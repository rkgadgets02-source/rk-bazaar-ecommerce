const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ─── Category ─────────────────────────────────────────────────
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  slug: { type: String, unique: true },
  isActive: { type: Boolean, default: true },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

categorySchema.pre('save', function (next) {
  this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  next();
});

// ─── User ─────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  otp: String,
  otpExpire: Date,
  avatar: String,
  addresses: [{
    name: String, phone: String, street: String, city: String, state: String, pincode: String, isDefault: Boolean
  }],
  wallet: { type: Number, default: 0 },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ─── Product ──────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  images: [{ type: String }],
  stock: { type: Number, required: true, default: 0 },
  brand: { type: String, default: '' },
  isFeatured: { type: Boolean, default: false },
  ratings: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  specification: [Object],
  tags: [String],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

productSchema.index({ brand: 1, name: 1 });

// ─── Order ────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderItems: [orderItemSchema],
  shippingAddress: {
    name: String, phone: String, street: String,
    city: String, state: String, pincode: String,
  },
  paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true }, // Removed Stripe
  paymentResult: {
    id: String, status: String, updateTime: String, email: String,
    razorpay_payment_id: String, razorpay_order_id: String, razorpay_signature: String,
  },
  itemsPrice: { type: Number, required: true },
  shippingPrice: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  orderNumber: { type: String, unique: true },
  orderStatus: { type: String, enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  isDelivered: { type: Boolean, default: false },
  deliveredAt: Date,
  trackingId: { type: String, default: '' },
  notes: { type: String, default: '' },
  isExpressDelivery: { type: Boolean, default: false },
  couponCode: { type: String, uppercase: true },
  discountAmount: { type: Number, default: 0 },
}, { timestamps: true });

// Auto-generate high-performance order numbers
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    this.orderNumber = `RK-${Date.now().toString().slice(-4)}${code}`;
  }
  next();
});

// ─── Cart ─────────────────────────────────────────────────────
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1, min: 1 },
    price: Number,
  }],
}, { timestamps: true });

// ─── Wishlist ─────────────────────────────────────────────────
const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, { timestamps: true });

// ─── Brand ────────────────────────────────────────────────────
const brandSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'RK BAZAAR' },
  slogan: { type: String, default: '3D FUTURE SHOPPING EXPERIENCE' },
  logo: { type: String, default: '' },
  themeColor: { type: String, default: '#00dbff' },
  description: { type: String, default: '' },
  contactEmail: { type: String, default: 'support@rkbazaar.com' },
  contactPhone: { type: String, default: '+91 8220748235' },
}, { timestamps: true });

const heroSlideSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  offerText: { type: String },
  imageUrl: { type: String, default: '' },
  link: { type: String, default: '' },
  placement: { type: String, enum: ['hero', 'inline', 'both'], default: 'hero' },
  icon: { type: String, default: 'fa-bolt' },
  badgeText: { type: String },
  badgeSub: { type: String },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

// ─── Coupon ───────────────────────────────────────────────────
const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  discountPercent: { type: Number, default: 20 },
  isActive: { type: Boolean, default: true },
  isUsed: { type: Boolean, default: false },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  usedAt: { type: Date },
}, { timestamps: true });

module.exports = {
  Category: mongoose.models.Category || mongoose.model('Category', categorySchema),
  Order: mongoose.models.Order || mongoose.model('Order', orderSchema),
  Cart: mongoose.models.Cart || mongoose.model('Cart', cartSchema),
  Product: mongoose.models.Product || mongoose.model('Product', productSchema),
  User: mongoose.models.User || mongoose.model('User', userSchema),
  Wishlist: mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema),
  Brand: mongoose.models.Brand || mongoose.model('Brand', brandSchema),
  HeroSlide: mongoose.models.HeroSlide || mongoose.model('HeroSlide', heroSlideSchema),
  Coupon: mongoose.models.Coupon || mongoose.model('Coupon', couponSchema),
};