const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');

// ── EMAIL TRANSPORTER ─────────────────────────────
function getTransporter() {
  const port = Number(process.env.EMAIL_PORT) === 587 ? 587 : 465;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000, // 10s timeout so Vercel doesn't hang
  });
}

// ── SEND OTP EMAIL ────────────────────────────────
async function sendOTPEmail(email, name, otp) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || `"RK BAZAAR" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your RK BAZAAR verification code`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
        <div style="background:linear-gradient(135deg,#FF4500,#FF6B00);padding:30px 24px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:3px">RK BAZAAR</h1>
          <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:13px">Premium Electronics</p>
        </div>
        <div style="padding:32px 24px">
          <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:20px">Hello ${name}! 👋</h2>
          <p style="color:#666;font-size:14px;margin:0 0 24px">Use the OTP below to verify your account. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#f8f8f8;border:2px dashed #FF4500;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
            <p style="color:#888;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Your OTP Code</p>
            <h1 style="color:#FF4500;font-size:42px;letter-spacing:10px;margin:0;font-family:monospace">${otp}</h1>
          </div>
          <p style="color:#999;font-size:12px;margin:0">If you didn't request this, please ignore this email.</p>
        </div>
        <div style="background:#f8f8f8;padding:16px 24px;text-align:center">
          <p style="color:#bbb;font-size:11px;margin:0">© 2024 RK BAZAAR · Virudhunagar, Tamil Nadu</p>
        </div>
      </div>
    `,
  });
}

// ── GENERATE OTP ──────────────────────────────────
function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ─────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    // Check if already registered and verified
    const exists = await User.findOne({ email });
    if (exists && exists.isVerified)
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });

    const otp = generateOTP();
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (exists && !exists.isVerified) {
      // Update OTP for unverified user
      exists.otp = otp;
      exists.otpExpire = otpExpire;
      exists.name = name;
      exists.phone = phone;
      exists.password = password;
      await exists.save();
    } else {
      // Create new unverified user
      await User.create({ name, email, phone, password, otp, otpExpire, isVerified: false, isActive: false });
    }

    // Send OTP email
    await sendOTPEmail(email, name, otp);

    res.status(201).json({
      success: true,
      message: `OTP sent to ${email}. Please verify to activate your account.`,
      email,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────
// POST /api/auth/verify-otp
// ─────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: 'User not found' });

    if (user.isVerified)
      return res.status(400).json({ success: false, message: 'Account already verified. Please login.' });

    if (user.otp !== otp)
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });

    if (user.otpExpire < new Date())
      return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });

    // Verify user
    user.isVerified = true;
    user.isActive = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    const token = generateToken(user._id);

    // Send welcome email
    try {
      const transporter = getTransporter();
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"RK BAZAAR" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to RK BAZAAR! 🎉',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
            <div style="background:linear-gradient(135deg,#FF4500,#FF6B00);padding:30px 24px;text-align:center;border-radius:16px 16px 0 0">
              <h1 style="color:#fff;margin:0;letter-spacing:3px">RK BAZAAR</h1>
            </div>
            <div style="padding:28px 24px;background:#fff;border:1px solid #eee;border-top:none;border-radius:0 0 16px 16px">
              <h2 style="color:#1a1a1a">Welcome, ${user.name}! 🎉</h2>
              <p style="color:#666">Your account has been verified successfully. Start shopping premium electronics at unbeatable prices!</p>
              <a href="http://localhost:5000" style="display:inline-block;background:#FF4500;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin-top:16px">Shop Now →</a>
            </div>
          </div>
        `,
      });
    } catch(e) { /* welcome email optional */ }

    res.json({
      success: true,
      message: 'Account verified successfully! Welcome to RK BAZAAR 🎉',
      token,
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, wallet: user.wallet },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────
// POST /api/auth/resend-otp
// ─────────────────────────────────────────────────
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Already verified' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTPEmail(email, user.name, otp);
    res.json({ success: true, message: 'New OTP sent to ' + email });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    if (!user.isVerified)
      return res.status(403).json({ success: false, message: 'Account not verified. Please check your email for OTP.', needsVerification: true, email });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact support.' });

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, wallet: user.wallet },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────────────
// PUT /api/auth/profile
// ─────────────────────────────────────────────────
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone, avatar }, { new: true, runValidators: true });
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────────────
// PUT /api/auth/change-password
// ─────────────────────────────────────────────────
router.put('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'Email not found' });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const transporter = getTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"RK BAZAAR" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `${otp} is your RK BAZAAR password reset code`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
          <div style="background:linear-gradient(135deg,#FF4500,#FF6B00);padding:30px 24px;text-align:center">
            <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:3px">RK BAZAAR</h1>
            <p style="color:rgba(255,255,255,.85);margin:8px 0 0;font-size:13px">Password Recovery</p>
          </div>
          <div style="padding:32px 24px">
            <h2 style="color:#1a1a1a;margin:0 0 8px;font-size:20px">Reset Your Password</h2>
            <p style="color:#666;font-size:14px;margin:0 0 24px">Hi ${user.name}, use the OTP below to reset your password. This code will expire in 10 minutes.</p>
            <div style="background:#f8f8f8;border:2px dashed #FF4500;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
              <p style="color:#888;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Your Reset Code</p>
              <h1 style="color:#FF4500;font-size:42px;letter-spacing:10px;margin:0;font-family:monospace">${otp}</h1>
            </div>
            <p style="color:#999;font-size:12px;margin:0">If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div style="background:#f8f8f8;padding:16px 24px;text-align:center">
            <p style="color:#bbb;font-size:11px;margin:0">© 2024 RK BAZAAR · Virudhunagar, Tamil Nadu</p>
          </div>
        </div>
      `,
    });

    res.json({ success: true, message: 'Password reset OTP sent to ' + email });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otpExpire < new Date()) return res.status(400).json({ success: false, message: 'OTP expired' });
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successfully! Please login.' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─────────────────────────────────────────────────
// Address routes
// ─────────────────────────────────────────────────
router.post('/address', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, message: 'Address added', addresses: user.addresses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/address/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.id);
    await user.save();
    res.json({ success: true, message: 'Address removed', addresses: user.addresses });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.get('/verify', require('../middleware/auth').verifyToken);
module.exports = router;