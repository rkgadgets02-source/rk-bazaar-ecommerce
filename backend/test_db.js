require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const { Cart, Order } = require('./models/index');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('DB Connected');
  
  try {
    const user = await User.findOne();
    if (!user) return console.log('No user');
    
    const product = await Product.findOne();
    if (!product) return console.log('No product');
    
    console.log('Found user and product, testing cart find...');
    let cart = await Cart.findOne({ user: user._id });
    console.log('Cart find success:', cart);
    
    if (!cart) cart = new Cart({ user: user._id, items: [] });
    cart.items.push({ product: product._id, quantity: 1, price: product.price });
    await cart.save();
    console.log('Cart save success');
    
  } catch(e) {
    console.error('ERROR CAUGHT:', e);
  }
  process.exit();
}
test();
