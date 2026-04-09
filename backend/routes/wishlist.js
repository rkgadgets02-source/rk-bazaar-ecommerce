const express = require('express');
const router = express.Router();
const { Wishlist } = require('../models/index');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const wl = await Wishlist.findOne({ user: req.user._id }).populate('products', 'name images price mrp rating unit');
    res.json({ success: true, wishlist: wl || { products: [] } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/toggle', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    let wl = await Wishlist.findOne({ user: req.user._id });
    if (!wl) wl = new Wishlist({ user: req.user._id, products: [] });

    const idx = wl.products.findIndex(p => p.toString() === productId);
    let message, inWishlist;
    if (idx > -1) { wl.products.splice(idx, 1); message = 'Removed from wishlist'; inWishlist = false; }
    else           { wl.products.push(productId); message = 'Added to wishlist'; inWishlist = true; }

    await wl.save();
    res.json({ success: true, message, inWishlist });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;