const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  phone:     { type: String, required: true },
  street:    { type: String, required: true },
  city:      { type: String, required: true },
  state:     { type: String, required: true },
  pincode:   { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name:       { type: String, required: [true, 'Name required'], trim: true },
  email:      { type: String, required: [true, 'Email required'], unique: true, lowercase: true },
  phone:      { type: String, required: [true, 'Phone required'] },
  password:   { type: String, required: [true, 'Password required'], minlength: 6, select: false },
  role:       { type: String, enum: ['user', 'admin'], default: 'user' },
  avatar:     { type: String, default: '' },
  addresses:  [addressSchema],
  isActive:   { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  wallet:     { type: Number, default: 0 },
  otp:        { type: String },
  otpExpire:  { type: Date },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(entered) {
  return await bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);