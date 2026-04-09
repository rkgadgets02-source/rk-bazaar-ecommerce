require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ Connected');

  // Test User model
  try {
    const User = require('./models/User');
    const count = await User.countDocuments({ role: 'user' });
    console.log('✅ Users:', count);
  } catch(e) { console.log('❌ User model error:', e.message); }

  // Test Product model
  try {
    const Product = require('./models/Product');
    const count = await Product.countDocuments();
    console.log('✅ Products:', count);
  } catch(e) { console.log('❌ Product model error:', e.message); }

  // Test Order model
  try {
    const Order = require('./models/orders');
    const count = await Order.countDocuments();
    console.log('✅ Orders:', count);
  } catch(e) { console.log('❌ Order model error:', e.message); }

  process.exit();
});