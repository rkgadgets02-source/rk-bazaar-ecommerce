const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── GENERATE JWT TOKEN ───────────────────────────────────────
exports.generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// ─── PROTECT ROUTE (any logged in user) ───────────────────────
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Get token from Authorization header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. Please login.' });
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
    }

    // 3. Check user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }

    // 4. Check if user is active (not banned/deleted)
    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account disabled. Contact support.' });
    }

    // 5. Check if password was changed after token was issued
    if (user.passwordChangedAt) {
      const changedAt = parseInt(user.passwordChangedAt.getTime() / 1000, 10);
      if (decoded.iat < changedAt) {
        return res.status(401).json({ success: false, message: 'Password recently changed. Please login again.' });
      }
    }

    req.user = user;
    next();

  } catch (err) {
    console.error('Auth middleware error:', err.message);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
};

// ─── ADMIN ONLY ───────────────────────────────────────────────
exports.adminOnly = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  if (req.user.role !== 'admin' || req.user.email !== process.env.ADMIN_EMAIL) {
    console.warn(`🛑 UNAUTHORIZED ADMIN ATTEMPT: ${req.user._id} (${req.user.email}) from IP: ${req.ip}`);
    return res.status(403).json({ success: false, message: 'Access denied. Reserved for SuperAdmin.' });
  }

  next();
};

// ─── AUTHORIZE SPECIFIC ROLES ─────────────────────────────────
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this route.`
      });
    }
    next();
  };
};

// ─── VERIFY TOKEN (for frontend session check) ────────────────
exports.verifyToken = async (req, res) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    res.json({ success: true, user });

  } catch (err) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};