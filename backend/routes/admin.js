const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');
const Product = require('../models/Product');
const { Category, Order, Brand, HeroSlide } = require('../models/index');

// ─── ALL ROUTES REQUIRE ADMIN ─────────────────────────────────
router.use(protect, adminOnly);

// Audit logger
router.use((req, res, next) => {
  if (req.method !== 'GET') {
    const time = new Date().toLocaleString();
    console.log(`[AUDIT] ${time} | Admin: ${req.user.email} | ${req.method} ${req.originalUrl}`);
  }
  next();
});

// ─── DASHBOARD ────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, totalProducts] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Product.countDocuments(),
    ]);

    let totalOrders = 0;
    let expressOrders = 0;
    let revenue = 0;

    if (Order) {
      totalOrders = await Order.countDocuments();
      expressOrders = await Order.countDocuments({ isExpressDelivery: true });
      const r = await Order.aggregate([
        { $match: { $or: [{ paymentStatus: 'paid' }, { isPaid: true }] } },
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]);
      revenue = r[0]?.total || 0;
    }

    res.json({
      success: true,
      data: { totalUsers, totalProducts, totalOrders, expressOrders, revenue }
    });
  } catch (err) {
    console.error('Dashboard error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── USERS ────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    const users = await User.find({ role: { $ne: 'admin' } })
      .select('-password -otp -otpExpire -otpExpiry')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await User.countDocuments({ role: { $ne: 'admin' } });
    res.json({ success: true, data: users, total });
  } catch (err) {
    console.error('Users error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/:id/status', async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change your own status.' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) {
    console.error('User status error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ORDERS ───────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  try {
    if (!Order) return res.json({ success: true, data: [], total: 0 });

    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const filter = {};
    if (req.query.status) filter.orderStatus = req.query.status;

    const orders = await Order.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Order.countDocuments(filter);

    const normalized = orders.map(o => ({
      _id: o._id,
      user: o.user,
      totalAmount: o.totalPrice || o.totalAmount || 0,
      totalPrice: o.totalPrice || o.totalAmount || 0,
      status: o.orderStatus || o.status || 'pending',
      orderStatus: o.orderStatus || o.status || 'pending',
      paymentStatus: o.isPaid ? 'paid' : (o.paymentStatus || 'pending'),
      paymentMethod: o.paymentMethod || '—',
      orderItems: o.orderItems || [],
      isExpressDelivery: !!o.isExpressDelivery,
      shippingAddress: o.shippingAddress || {},
      createdAt: o.createdAt,
    }));

    res.json({ success: true, data: normalized, total });
  } catch (err) {
    console.error('Orders error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/orders/:id/status', async (req, res) => {
  try {
    if (!Order) return res.status(404).json({ success: false, message: 'Orders not available.' });

    const allowed = ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const status = req.body.status || req.body.orderStatus;

    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        orderStatus: status,
        status: status,
        ...(status === 'delivered' ? { isDelivered: true, deliveredAt: new Date() } : {})
      },
      { new: true }
    );

    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order, message: 'Order status updated.' });
  } catch (err) {
    console.error('Order status error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── PRODUCTS ─────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const products = await Product.find().populate('category').sort({ createdAt: -1 });
    res.json({ success: true, data: products });
  } catch (err) {
    console.error('Products error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { name, price, mrp, stock, category, brand, description, images } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Name and price are required.' });
    }

    // Find or create category
    let categoryId = null;
    if (category) {
      let cat = await Category.findOne({ name: new RegExp('^' + category + '$', 'i') });
      if (!cat) {
        cat = await Category.create({ name: category });
      }
      categoryId = cat._id;
    }

    // Auto-generate SKU
    const generatedSku = `SKU-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const product = await Product.create({
      name,
      price,
      mrp: mrp || price,
      stock: stock || 0,
      category: categoryId,
      brand: brand || 'Generic',
      description: description || name,
      images: images || [],
      sku: generatedSku,
    });

    res.status(201).json({ success: true, data: product });
  } catch (err) {
    console.error('Create product error:', err.message);
    // Use 400 so Vercel does not intercept and replace the error message with a generic 500 HTML page
    res.status(400).json({ success: false, message: 'DB_ERROR: ' + err.message });
  }
});

router.put('/products/:id', async (req, res) => {
  try {
    const { name, price, mrp, stock, category, brand, description, images } = req.body;

    // Resolve category name → ObjectId (same as POST)
    let categoryId = undefined;
    if (category) {
      let cat = await Category.findOne({ name: new RegExp('^' + category + '$', 'i') });
      if (!cat) {
        cat = await Category.create({ name: category });
      }
      categoryId = cat._id;
    }

    const updateData = {
      ...(name !== undefined && { name }),
      ...(price !== undefined && { price }),
      ...(mrp !== undefined && { mrp }),
      ...(stock !== undefined && { stock }),
      ...(categoryId !== undefined && { category: categoryId }),
      ...(brand !== undefined && { brand }),
      ...(description !== undefined && { description }),
      ...(images !== undefined && { images }),
    };

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: false }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product, message: 'Product updated.' });
  } catch (err) {
    console.error('Update product error:', err.message);
    res.status(400).json({ success: false, message: 'DB_ERROR: ' + err.message });
  }
});

router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── OFFERS (HERO SLIDES) ─────────────────────────────────────
router.get('/slides', async (req, res) => {
  try {
    const slides = await HeroSlide.find().sort({ order: 1, createdAt: -1 });
    res.json({ success: true, data: slides });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching slides' });
  }
});

router.post('/slides', async (req, res) => {
  try {
    const { title, subtitle, offerText, icon, badgeText, badgeSub, isActive, order } = req.body;
    const slide = await HeroSlide.create({ title, subtitle, offerText, icon, badgeText, badgeSub, isActive, order });
    res.status(201).json({ success: true, data: slide, message: 'Slide created successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Error creating slide' });
  }
});

router.put('/slides/:id', async (req, res) => {
  try {
    const slide = await HeroSlide.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found.' });
    res.json({ success: true, data: slide, message: 'Slide updated successfully.' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Error updating slide' });
  }
});

router.delete('/slides/:id', async (req, res) => {
  try {
    const slide = await HeroSlide.findByIdAndDelete(req.params.id);
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found.' });
    res.json({ success: true, message: 'Slide deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting slide' });
  }
});

// ─── BRANDING ─────────────────────────────────────────────────
router.get('/brand', async (req, res) => {
  try {
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

router.put('/brand', async (req, res) => {
  try {
    const { name, slogan, description, contactEmail, contactPhone, themeColor } = req.body;
    let brand = await Brand.findOne();
    
    if (!brand) {
      brand = new Brand();
    }
    
    if (name) brand.name = name;
    if (slogan) brand.slogan = slogan;
    if (description) brand.description = description;
    if (contactEmail) brand.contactEmail = contactEmail;
    if (contactPhone) brand.contactPhone = contactPhone;
    if (themeColor) brand.themeColor = themeColor;
    
    await brand.save();
    res.json({ success: true, data: brand, message: 'Branding updated successfully.' });
  } catch (err) {
    console.error('Update branding error:', err.message);
    res.status(500).json({ success: false, message: 'Error updating brand info' });
  }
});

module.exports = router;