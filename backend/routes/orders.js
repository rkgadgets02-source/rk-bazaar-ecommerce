const express = require('express');
const router = express.Router();
const { Order, Cart, Coupon, Product } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/orders — create order
router.post('/', protect, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const { 
      orderItems, shippingAddress, paymentMethod, itemsPrice, 
      shippingPrice, taxPrice, totalPrice, isExpressDelivery, couponCode 
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items in cart' });
    }

    // ─── Recalculate & Validate Pricing on Server ───
    let calculatedItemsPrice = 0;
    const validatedOrderItems = [];

    for (const item of orderItems) {
      if (!item.product) {
        return res.status(400).json({ success: false, message: 'Invalid product in order items' });
      }
      const dbProduct = await Product.findById(item.product);
      if (!dbProduct) {
        return res.status(404).json({ success: false, message: `Product not found: ${item.product}` });
      }
      if (!dbProduct.isActive) {
        return res.status(400).json({ success: false, message: `Product is not active: ${dbProduct.name}` });
      }

      const price = dbProduct.price;
      calculatedItemsPrice += price * Number(item.quantity);

      validatedOrderItems.push({
        product: dbProduct._id,
        name: dbProduct.name,
        image: dbProduct.images && dbProduct.images[0] ? dbProduct.images[0] : '',
        price: price,
        quantity: Number(item.quantity),
        color: item.color || '',
        storage: item.storage || '',
        size: item.size || '',
        variant: item.variant || ''
      });
    }

    // ─── Coupon Validation ───
    let discountAmount = 0;
    let validCoupon = null;

    if (couponCode) {
      validCoupon = await Coupon.findOne({ 
        code: couponCode.toUpperCase(), 
        isActive: true, 
        isUsed: false 
      });

      if (!validCoupon) {
        return res.status(400).json({ success: false, message: 'Invalid or expired coupon code' });
      }
      
      // Calculate discount percent on recalculated itemsPrice
      discountAmount = Math.round(Number(calculatedItemsPrice) * (validCoupon.discountPercent / 100));
    }

    const finalShippingPrice = Number(shippingPrice) || 0;
    const finalTaxPrice = Number(taxPrice) || 0;
    const expectedTotal = calculatedItemsPrice + finalShippingPrice + finalTaxPrice - discountAmount;

    const orderData = {
      user: req.user._id,
      orderItems: validatedOrderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice: calculatedItemsPrice,
      shippingPrice: finalShippingPrice,
      taxPrice: finalTaxPrice,
      discountAmount,
      totalPrice: expectedTotal, // Use calculated total
      isExpressDelivery: Boolean(isExpressDelivery),
      couponCode: validCoupon ? validCoupon.code : undefined,
      orderStatus: paymentMethod === 'cod' ? 'confirmed' : 'pending',
    };

    const order = await Order.create(orderData);

    // If coupon was used, mark it as consumed
    if (validCoupon) {
      validCoupon.isUsed = true;
      validCoupon.usedBy = req.user._id;
      validCoupon.usedAt = Date.now();
      await validCoupon.save();
    }

    if (paymentMethod === 'cod') {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    }

    res.status(201).json({ success: true, message: 'Order placed professionally!', order });

  } catch (err) {
    console.error("🔥 CREATE ORDER ERROR:", err);
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
router.put('/:id/pay', protect, adminOnly, async (req, res) => {
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

    await Cart.findOneAndUpdate({ user: order.user }, { items: [] });

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