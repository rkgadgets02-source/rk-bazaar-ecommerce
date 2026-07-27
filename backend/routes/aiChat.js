const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// POST /api/ai-chat
router.post('/', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.json({ success: false, message: 'Query string required' });
    }

    const q = query.toLowerCase();

    // 1. Coupons
    if (q.includes('coupon') || q.includes('discount') || q.includes('offer') || q.includes('promo')) {
      return res.json({
        success: true,
        reply: `<p>🎟️ <b>Active RK Bazaar Coupons:</b></p><p>• <b>WELCOME10</b> — 10% OFF!</p><p>• <b>RKB15</b> — 15% OFF over ₹1,000.</p>`
      });
    }

    // 2. Search products from DB
    const searchTerms = q.split(/\s+/).filter(t => t.length > 2);
    let products = [];
    if (searchTerms.length > 0) {
      const regex = new RegExp(searchTerms.join('|'), 'i');
      products = await Product.find({
        isActive: true,
        $or: [{ name: regex }, { brand: regex }, { tags: regex }]
      }).limit(3);
    }

    if (products.length > 0) {
      let replyHtml = `<p>🛒 Found ${products.length} product(s) matching your request:</p>`;
      products.forEach(p => {
        const dsc = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
        const img = (p.images && p.images.length) ? p.images[0] : '';
        replyHtml += `
          <div class="ai-prod-card" onclick="closeAiChat(); openProd('${p._id}')">
            <img src="${img}" class="ai-prod-img" alt="${p.name}" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'300\\' height=\\'300\\'><rect width=\\'300\\' height=\\'300\\' fill=\\'%23181818\\'/></svg>'">
            <div class="ai-prod-info">
              <div class="ai-prod-name">${p.name}</div>
              <div class="ai-prod-price">₹${p.price.toLocaleString('en-IN')} ${dsc > 0 ? `<span style="font-size:0.65rem;color:#00E676">(${dsc}% OFF)</span>` : ''}</div>
            </div>
            <button class="ai-prod-btn" onclick="event.stopPropagation(); addById('${p._id}'); toast('Added to cart 🛒');">Add +</button>
          </div>
        `;
      });
      return res.json({ success: true, reply: replyHtml });
    }

    return res.json({
      success: true,
      reply: `<p>I'm <b>RK Assist</b>! Ask me about earbuds, chargers, power banks, coupons, or shipping options!</p>`
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ success: false, message: 'Server AI error' });
  }
});

module.exports = router;
