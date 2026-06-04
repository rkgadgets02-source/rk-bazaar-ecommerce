const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate('items.product', 'name images price stock unit');
        if (!cart) cart = { items: [] };
        res.json({ success: true, cart });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/add', protect, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        if (product.stock < quantity) return res.status(400).json({ success: false, message: 'Insufficient stock' });

        let cart = await Cart.findOneAndUpdate(
            { user: req.user._id },
            { $setOnInsert: { user: req.user._id, items: [] } },
            { new: true, upsert: true }
        );

        const idx = cart.items.findIndex(i => i.product.toString() === productId);
        if (idx > -1) cart.items[idx].quantity += quantity;
        else cart.items.push({ product: productId, quantity, price: product.price });

        await cart.save();
        res.json({ success: true, message: 'Added to cart' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/update', protect, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
        const idx = cart.items.findIndex(i => i.product.toString() === productId);
        if (idx > -1) {
            if (quantity <= 0) cart.items.splice(idx, 1);
            else cart.items[idx].quantity = quantity;
        }
        await cart.save();
        res.json({ success: true, message: 'Cart updated', cart });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/remove/:productId', protect, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (cart) {
            cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
            await cart.save();
        }
        res.json({ success: true, message: 'Item removed' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/clear', protect, async (req, res) => {
    try {
        await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
        res.json({ success: true, message: 'Cart cleared' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;

