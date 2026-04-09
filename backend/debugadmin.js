require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('./models/User');
  
  // Find admin
  const admin = await User.findOne({ role: 'admin' }).select('+password');
  if (!admin) {
    console.log('❌ No admin found in database!');
    process.exit();
  }
  
  console.log('✅ Admin found!');
  console.log('📧 Email:', admin.email);
  console.log('✔️  isVerified:', admin.isVerified);
  console.log('✔️  isActive:', admin.isActive);
  console.log('✔️  role:', admin.role);
  console.log('🔑 Password hash exists:', !!admin.password);

  // Test password
  const match = await bcrypt.compare('Admin@1234', admin.password);
  console.log('🔐 Password match (Admin@1234):', match);

  process.exit();
});