const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  rating:  { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: [true, 'Product name required'], trim: true },
  description: { type: String, required: [true, 'Description required'] },
  price:       { type: Number, required: [true, 'Price required'], min: 0 },
  mrp:         { type: Number, required: true },
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand:       { type: String, default: 'Generic' },
  images:      [{ type: String }],
  stock:       { type: Number, required: true, default: 0 },
  unit:        { type: String, default: '1pcs' },
  sku:         { type: String, unique: true },
  tags:        [String],
  specifications: [{ key: String, value: String }],
  reviews:     [reviewSchema],
  rating:      { type: Number, default: 0 },
  numReviews:  { type: Number, default: 0 },
  isFeatured:  { type: Boolean, default: false },
  isTrending:  { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  discount:    { type: Number, default: 0 }, // percentage
}, { timestamps: true });

// Auto-calculate discount
productSchema.pre('save', function(next) {
  if (this.mrp && this.price) {
    this.discount = Math.round(((this.mrp - this.price) / this.mrp) * 100);
  }
  next();
});

// Virtual for discount price
productSchema.virtual('discountAmount').get(function() {
  return this.mrp - this.price;
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);