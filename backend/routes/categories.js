const express = require('express');
const router = express.Router();
const { Category } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const cats = await Category.find({ isActive: true }).sort('sortOrder');
    res.json({ success: true, categories: cats });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat || !cat.isActive) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category: cat });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const cat = await Category.create(req.body);
    res.status(201).json({ success: true, category: cat });
  } catch (err) { 
    let msg = err.message;
    if (err.code === 11000) msg = 'A category with this name already exists.';
    res.status(400).json({ success: false, message: msg }); 
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, category: cat });
  } catch (err) { 
    let msg = err.message;
    if (err.code === 11000) msg = 'Another category already has this name.';
    res.status(400).json({ success: false, message: msg }); 
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, message: 'Category removed' });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;