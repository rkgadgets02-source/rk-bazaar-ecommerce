const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { protect } = require('../middleware/auth');
const { Order } = require('../models/index');

// ─── INIT RAZORPAY SDK LAZILY ──────────────────────────────────
let razorpay;
const getRazorpay = () => {
  if (razorpay) return razorpay;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys missing. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Vercel.');
  }
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  return razorpay;
};

// ─── HELPER: Recalculate order amount from DB ─────────────────
const getVerifiedAmount = async (orderId) => {
  const order = await Order.findById(orderId).populate('orderItems.product');
  if (!order) throw new Error('Order not found in database');

  let itemsTotal = 0;
  if (!order.orderItems || order.orderItems.length === 0) {
    throw new Error('Order has no items');
  }

  for (const item of order.orderItems) {
    // Priority: Product Model Price > Item Stored Price > 0
    const itemPrice = item.product ? item.product.price : (item.price || 0);
    const quantity = item.quantity || 1;
    itemsTotal += itemPrice * quantity;
  }
  
  const finalTotal = Math.round(itemsTotal + (order.shippingPrice || 0) + (order.taxPrice || 0));
  
  if (isNaN(finalTotal) || finalTotal <= 0) {
    throw new Error(`Invalid total amount calculated: ${finalTotal}`);
  }

  return finalTotal * 100; // Return in paise
};

// ─── CREATE RAZORPAY ORDER ────────────────────────────────────
router.post('/razorpay/create-order', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Missing orderId in request body' });
    }

    console.log(`[RAZORPAY] Initializing order creation for Order: ${orderId}`);

    const amountInPaise = await getVerifiedAmount(orderId);
    console.log(`[RAZORPAY] Verified Amount: ${amountInPaise} paise`);

    const instance = getRazorpay();
    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${orderId.toString().slice(-6)}`,
    };

    const razorpayOrder = await instance.orders.create(options);
    console.log(`[RAZORPAY] Razorpay Order Created: ${razorpayOrder.id}`);

    await Order.findByIdAndUpdate(orderId, { 'paymentResult.razorpay_order_id': razorpayOrder.id });

    res.json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      razorpayOrderId: razorpayOrder.id
    });
  } catch (err) {
    console.error('🔥 RAZORPAY_CREATE_ORDER_ERROR:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ 
      success: false, 
      message: 'RAZORPAY_FAILURE: ' + (errorMessage || 'Unknown Error'),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ─── VERIFY RAZORPAY PAYMENT ──────────────────────────────────
router.post('/razorpay/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: razorpay_payment_id,
        status: 'completed',
        updateTime: new Date().toISOString(),
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature
      };
      await order.save();

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid signature' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CONFIRM COD ORDER ────────────────────────────────────────
router.post('/cod/confirm', protect, async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    order.paymentStatus = 'pending'; // COD is pending payment
    await order.save();
    res.json({ success: true, message: 'COD Order confirmed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;