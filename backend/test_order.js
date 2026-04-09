require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const { Order } = require('./models/index');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('DB Connected');
  
  try {
    const user = await User.findOne();
    const product = await Product.findOne();
    
    console.log('Testing Order creation...');
    const order = new Order({
      user: user._id,
      orderItems: [{ product: product._id, name: product.name, price: product.price, quantity: 1, image: product.images[0] }],
      shippingAddress: { name: 'Test', phone: '123', street: '1', city: 'A', state: 'B', pincode: '123' },
      paymentMethod: 'cod',
      itemsPrice: 100,
      totalPrice: 100
    });
    
    await order.save();
    console.log('Order save success!');
    
  } catch(e) {
    console.error('ERROR CAUGHT:', e);
  }
  process.exit();
}
test();
