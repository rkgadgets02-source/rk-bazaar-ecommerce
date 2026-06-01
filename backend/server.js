const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const crypto = require('crypto');
require('dotenv').config();

// ─── VALIDATE REQUIRED ENV VARIABLES ──────────────────────────
const REQUIRED_ENV = [
  'MONGODB_URI', 'JWT_SECRET', 'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET', 'ADMIN_EMAIL'
];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.error(`⚠️  Missing environment variables: ${missingEnv.join(', ')}`);
  console.log('💡 Ensure these are added to Vercel for production features to work!');
}

// ─── JWT SECRET STRENGTH CHECK ────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn('⚠️  JWT_SECRET is missing or too short! Logins will fail.');
  console.log('💡 TIP: Add a 32+ character JWT_SECRET to Vercel!');
}

let server;
const app = express();

// ─── TRUST PROXY (for deployment behind reverse proxy) ────────
app.set('trust proxy', 1);

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────

// 1. Helmet — strict security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://checkout.razorpay.com",
        "https://cdn.razorpay.com",
        "https://js.stripe.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com",
        "https://ajax.googleapis.com",
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://use.fontawesome.com",
        "https://ka-p.fontawesome.com"
      ],
      styleSrcElem: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://use.fontawesome.com",
        "https://ka-p.fontawesome.com"
      ],
      fontSrc: [
        "'self'",
        "data:",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://use.fontawesome.com",
        "https://ka-p.fontawesome.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https:",
        "https://images.unsplash.com",
        "https://i.ibb.co",
      ],
      connectSrc: [
        "'self'",
        "https:",
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
        "https://lumberjack.razorpay.com",
        "https://ajax.googleapis.com",
        "https://images.unsplash.com",
        "https://i.ibb.co",
        "https://ka-p.fontawesome.com",
        "ws://localhost:5000",
        "http://localhost:5000",
      ],
      frameSrc: [
        "https://api.razorpay.com",
        "https://checkout.razorpay.com",
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      scriptSrcAttr: ["'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// 2. Disable X-Powered-By (don't reveal Express)
app.disable('x-powered-by');

// 3. Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000, // Generous limit for a typical SPA
  message: { success: false, message: 'Too many requests. Try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts. Try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Wait 10 minutes.' },
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // max 20 payment attempts per hour
  message: { success: false, message: 'Too many payment requests. Try again later.' },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // strict limit for admin panel but high enough for normal use
  message: { success: false, message: 'Too many admin requests.' },
});

app.use('/api/', globalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/resend-otp', otpLimiter);
app.use('/api/payment', paymentLimiter);
app.use('/api/admin', adminLimiter);

// 4. CORS — strict origin whitelist
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000',
  'http://127.0.0.1:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // 1. Always allow same-origin or no-origin requests (server-to-server, file://, etc.)
    if (!origin || origin === 'null') return callback(null, true);

    // 2. Allow if in allowedOrigins
    if (allowedOrigins.includes(origin)) return callback(null, true);

    // 3. Allow Vercel preview/production domains automatically
    if (origin.endsWith('.vercel.app')) return callback(null, true);

    // 4. Allow any localhost/127.0.0.1 port in development
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);

    // 5. Allow any additional origins from CLIENT_URL env var (comma-separated)
    const extraOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean);
    if (extraOrigins.includes(origin)) return callback(null, true);

    const corsErr = new Error(`CORS policy: Origin ${origin} not allowed`);
    corsErr.isCorsError = true;
    callback(corsErr);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // cache preflight for 24h
}));
app.options('*', cors());

// 5. Body Parser with size limits
app.use(express.json({ limit: '15mb' })); // increased to permit base64 image strings
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 6. MongoDB Injection Protection
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`⚠️  Sanitized NoSQL injection attempt from IP ${req.ip} on key: ${key}`);
  },
}));

// 7. XSS Protection
app.use(xss());

// 8. HTTP Parameter Pollution Protection
app.use(hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'category', 'brand'],
}));

// 9. Nonce for CSP (inline scripts)
app.use((req, res, next) => {
  res.locals.nonce = crypto.randomBytes(16).toString('base64');
  next();
});

// 10. Request logging (dev only — never log in production to avoid leaking data)
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  // In production, log only method + url + status, no request body
  app.use(morgan(':method :url :status :response-time ms'));
}

// 11. Prevent serving hidden files (like .env)
app.use((req, res, next) => {
  if (req.path.includes('/.') || req.path.toLowerCase().includes('.env')) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
});

// ─── STATIC FILES ─────────────────────────────────────────────
// Serve uploaded files with strict content type
app.use('/uploads', (req, res, next) => {
  // Only allow image file extensions
  const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(req.path).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return res.status(403).json({ success: false, message: 'Forbidden file type' });
  }
  next();
}, express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
}));

// ─── DATABASE ─────────────────────────────────────────────────
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).then((mongoose) => {
      console.log('✅ MongoDB connected');
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    res.status(500).json({ success: false, message: 'Database unavailable' });
  }
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting reconnect...');
});

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'RK BAZAAR Store API Running 🚀',
    uptime: process.uptime(),
    timestamp: Date.now(),
    env: {
      mongodb: !!process.env.MONGODB_URI,
      razorpay: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      jwt: !!process.env.JWT_SECRET
    }
  });
});

// ─── HERO SLIDES ──────────────────────────────────────────────
app.get('/api/slides', async (req, res) => {
  try {
    const { HeroSlide } = require('./models/index');
    const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: slides });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching slides' });
  }
});

// ─── BRANDING ─────────────────────────────────────────────────
app.get('/api/brand', async (req, res) => {
  try {
    const { Brand } = require('./models');
    let brand = await Brand.findOne();
    if (!brand) {
      brand = await Brand.create({
        name: 'RK BAZAAR',
        slogan: '3D FUTURE SHOPPING EXPERIENCE',
        contactEmail: process.env.ADMIN_EMAIL || 'support@rkbazaar.com',
      });
    }
    res.json({ success: true, data: brand });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching brand info' });
  }
});

// ─── ROUTES ───────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/coupons', require('./routes/coupons'));

// ─── SERVE FRONTEND ───────────────────────────────────────────
// Never cache HTML files — always serve fresh so product updates show instantly
app.use(express.static(path.join(process.cwd(), 'frontend'), {
  maxAge: 0,
  etag: false,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (/\.(js|css|png|jpg|jpeg|webp|gif|ico|woff2?)$/.test(filePath)) {
      // Cache static assets for 1 day
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  },
  index: 'index.html',
}));

// ─── ADMIN PANEL ROUTE (SECRET) ──────────────────────────────
app.get('/rk-secure-manager.html', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'frontend', 'rk-secure-manager.html'));
});

// Redirect old Admin path to home
app.get('/Admin.html', (req, res) => res.redirect('/'));

// ─── SPA CATCH-ALL ────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'frontend', 'index.html'));
});

// ─── 404 HANDLER ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────
app.use((err, req, res, next) => {
  // Log full error internally
  console.error(`❌ Error [${req.method} ${req.path}]:`, err.message);

  // CORS errors — only catch actual CORS errors, not errors that happen to mention CORS in their message
  if (err.isCorsError || (err.message && err.message.startsWith('CORS policy:'))) {
    return res.status(403).json({ success: false, message: 'CORS: Origin not allowed' });
  }

  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: messages.join('. ') });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
  }

  // Never leak stack traces in production
  const message = process.env.NODE_ENV === 'production'
    ? 'Something went wrong. Please try again.'
    : err.message;

  res.status(err.statusCode || 500).json({ success: false, message });
});

// ─── START SERVER ─────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🛡️  Security: Rate limiting, Helmet, XSS, NoSQL injection protection enabled`);
  });
}

module.exports = app;

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('🔴 SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      mongoose.connection.close(false, () => process.exit(0));
    });
  } else {
    mongoose.connection.close(false, () => process.exit(0));
  }
});

process.on('SIGINT', () => {
  console.log('🔴 SIGINT received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      mongoose.connection.close(false, () => process.exit(0));
    });
  } else {
    mongoose.connection.close(false, () => process.exit(0));
  }
});