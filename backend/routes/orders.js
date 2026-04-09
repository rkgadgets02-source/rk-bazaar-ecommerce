const express = require('express');
const router = express.Router();
const { Order, Cart } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/orders — create order
router.post('/', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { orderItems, shippingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, totalPrice, isExpressDelivery } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items in cart' });
    }

    // Ensure cart exists
    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      try {
        cart = await Cart.create({ user: req.user._id, items: [] });
      } catch (err) {
        if (err.code === 11000) {
          cart = await Cart.findOne({ user: req.user._id });
        } else {
          console.error("🔥 CART ERROR:", err);
          return res.status(400).json({ success: false, message: 'Could not initialize cart: ' + err.message });
        }
      }
    }

    const orderData = {
      user: req.user._id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice: Number(itemsPrice),
      shippingPrice: Number(shippingPrice) || 0,
      taxPrice: Number(taxPrice) || 0,
      totalPrice: Number(totalPrice),
      isExpressDelivery: Boolean(isExpressDelivery),
    };

    const order = await Order.create(orderData);

    if (paymentMethod === 'cod') {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    }

    res.status(201).json({ success: true, message: 'Order placed professionally!', order });

  } catch (err) {
    console.error("🔥 CREATE ORDER ERROR:", err);
    // Return 400 with specific message to help the admin debug
    res.status(400).json({ success: false, message: 'ORDER_FAILED: ' + err.message });
  }
});

// GET /api/orders/my
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, orders });
  } catch (err) {
    console.error("🔥 MY ORDERS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, order });

  } catch (err) {
    console.error("🔥 GET ORDER ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/pay
router.put('/:id/pay', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.orderStatus = 'confirmed';
    order.paymentResult = req.body;

    await order.save();

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.json({ success: true, message: 'Payment confirmed', order });

  } catch (err) {
    console.error("🔥 PAYMENT ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['shipped', 'delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: `Cannot cancel '${order.orderStatus}' order` });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    res.json({ success: true, message: 'Order cancelled', order });

  } catch (err) {
    console.error("🔥 CANCEL ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders — admin
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    let query = {};
    if (status) query.orderStatus = status;

    const total = await Order.countDocuments(query);

    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, orders });

  } catch (err) {
    console.error("🔥 ADMIN ORDERS ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/orders/:id/status
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { orderStatus, trackingId } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        orderStatus,
        trackingId,
        ...(orderStatus === 'delivered' ? { isDelivered: true, deliveredAt: Date.now() } : {})
      },
      { new: true }
    );

    res.json({ success: true, message: 'Status updated', order });

  } catch (err) {
    console.error("🔥 STATUS UPDATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;