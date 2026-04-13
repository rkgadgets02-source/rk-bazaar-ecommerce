const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { Coupon } = require('../models/index');

// @desc    Validate a coupon code
// @route   POST /api/coupons/validate
// @access  Private
router.post('/validate', protect, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive coupon code' });
    }

    if (coupon.isUsed) {
      return res.status(400).json({ success: false, message: 'This coupon has already been used' });
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        discountPercent: coupon.discountPercent
      }
    });
  } catch (err) {
    console.error('Coupon validation error:', err.message);
    res.status(500).json({ success: false, message: 'Server error during validation' });
  }
});

module.exports = router;
