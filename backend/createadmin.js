require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('✅ MongoDB connected');
  const User = require('./models/User');

  // Delete old admin
  await User.deleteOne({ email: 'rkgadgets02@gmail.com' });
  console.log('🗑️  Old admin removed');

  // Let the MODEL hash the password (don't hash manually)
  const admin = new User({
    name: 'RK BAZAAR Admin',
    email: 'rkgadgets02@gmail.com',
    password: 'Admin@1234',
    phone: '9999999999',
    role: 'admin',
    isVerified: true,
    isActive: true,
  });

  await admin.save();
  console.log('✅ Admin created!');
  console.log('📧 Email    : rkgadgets02@gmail.com');
  console.log('🔑 Password : Admin@1234');
  process.exit();

}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});