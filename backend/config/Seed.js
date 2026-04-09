require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rkgadget_store';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const { User, Category, Brand, HeroSlide, Product } = require('../models/index');

    // Clear existing
    await Promise.all([
      User.deleteMany({}), 
      Category.deleteMany({}), 
      Product.deleteMany({}),
      Brand.deleteMany({}),
      HeroSlide.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Brand
    await Brand.create({
      name: 'RK BAZAAR',
      slogan: '3D FUTURE SHOPPING EXPERIENCE',
      contactEmail: process.env.ADMIN_EMAIL || 'support@rkbazaar.com',
      contactPhone: 'YOUR_PHONE_NUMBER',
      description: 'Your premium destination for high-quality electronics and 3D immersive shopping.'
    });
    console.log('✅ Brand seeded: RK BAZAAR');

    // Create Hero Slides
    await HeroSlide.create([
      {
        title: 'Order Worth',
        subtitle: '₹5,000',
        offerText: '🎁 Get 1 Premium Bag Absolutely FREE',
        icon: 'fa-bolt',
        badgeText: 'FREE',
        badgeSub: 'BAG!',
        order: 1
      },
      {
        title: 'Flash Sale',
        subtitle: 'UP TO 70% OFF',
        offerText: 'Limited time deals on premium electronics',
        icon: 'fa-fire',
        badgeText: '70%',
        badgeSub: 'OFF',
        order: 2
      },
      {
        title: 'New Arrivals',
        subtitle: 'BEST GADGETS',
        offerText: 'Explore the latest tech at unbeatable prices',
        icon: 'fa-star',
        badgeText: 'NEW',
        badgeSub: '2026',
        order: 3
      }
    ]);
    console.log('✅ Hero Slides seeded');

    // Create admin
    const adminPass = await bcrypt.hash('Admin@123456', 12);
    await User.create({ 
      name: 'RK BAZAAR Admin', 
      email: process.env.ADMIN_EMAIL || 'admin@rkbazaar.com', 
      phone: 'YOUR_PHONE_NUMBER', 
      password: adminPass, 
      role: 'admin' 
    });
    console.log(`✅ Admin created: ${process.env.ADMIN_EMAIL || 'admin@rkbazaar.com'} / Admin@123456`);

    // Create sample user
    const userPass = await bcrypt.hash('User@123456', 12);
    await User.create({ name:'Sanjay', email:'sanjaysri306@gmail.com', phone:'9123456789', password:userPass, role:'user' });
    console.log('✅ User created: sanjaysri306@gmail.com / User@123456');

    // Create categories
    const cats = [
      'Wired Earphone','Earbuds','Bluetooth Neckband','Bluetooth Headphone',
      'Smart Watches','Mobile Charger','Charging Cables','Bluetooth Speaker',
      'Car Charger','Wireless Charger','Power Bank','Mobile Battery'
    ];
    const createdCats = await Category.insertMany(cats.map((name,i) => ({ name, slug: name.toLowerCase().replace(/\s+/g,'-'), sortOrder: i+1 })));
    console.log(`✅ Created ${createdCats.length} categories`);

    const catMap = {};
    createdCats.forEach(c => catMap[c.name] = c._id);

    // Create products
    const products = [
      { name:'HD Wired Earphone Super Bass with Mic', price:89, mrp:199, category:catMap['Wired Earphone'], brand:'Generic', stock:300, unit:'1pcs', isTrending:true, description:'Extra bass 10mm driver, tangle-free cable, in-line mic.', images:['https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400'] },
      { name:'Pro TWS Wireless Earbuds Bluetooth 5.3', price:299, mrp:599, category:catMap['Earbuds'], brand:'RK BAZAAR', stock:80, unit:'1pcs', isFeatured:true, isTrending:true, description:'40hr battery, ENC noise cancellation, IPX5 waterproof.', images:['https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400'] },
      { name:'Bluetooth 5.0 Neckband 24hr Battery', price:149, mrp:299, category:catMap['Bluetooth Neckband'], brand:'RK BAZAAR', stock:110, unit:'1pcs', isFeatured:true, description:'Magnetic earbuds, deep bass, fast charging, IPX5.', images:['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400'] },
      { name:'Gaming Headphone 7.1 Surround RGB', price:499, mrp:999, category:catMap['Bluetooth Headphone'], brand:'RK BAZAAR', stock:55, unit:'1pcs', isFeatured:true, description:'7.1 surround, noise-cancelling mic, RGB, foldable.', images:['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'] },
      { name:'Smart Watch Series 9 AMOLED 1.96"', price:899, mrp:1999, category:catMap['Smart Watches'], brand:'RK BAZAAR', stock:45, unit:'1pcs', isFeatured:true, isTrending:true, description:'AMOLED display, health monitoring, Bluetooth calling, GPS.', images:['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400'] },
      { name:'65W GaN Fast Charger Dual Port', price:349, mrp:699, category:catMap['Mobile Charger'], brand:'RK BAZAAR', stock:90, unit:'1pcs', isTrending:true, description:'GaN 65W, USB-C + USB-A, foldable plug.', images:['https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=400'] },
      { name:'Braided Type-C Cable 3A Fast 2m', price:45, mrp:99, category:catMap['Charging Cables'], brand:'Generic', stock:500, unit:'1pcs', isTrending:true, description:'3A fast charge, nylon braided, 10000+ bends.', images:['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'] },
      { name:'BoomBass 20W Portable Bluetooth Speaker', price:599, mrp:1199, category:catMap['Bluetooth Speaker'], brand:'RK BAZAAR', stock:35, unit:'1pcs', isFeatured:true, description:'20W stereo, RGB, IPX6 waterproof, 12hr battery.', images:['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400'] },
      { name:'36W Dual Port Car Charger QC 3.0', price:99, mrp:199, category:catMap['Car Charger'], brand:'Generic', stock:180, unit:'1pcs', isTrending:true, description:'QC3.0 + PD 18W, smart chip protection.', images:['https://images.unsplash.com/photo-1625842268584-8f3296236761?w=400'] },
      { name:'15W Magnetic Wireless Charging Pad', price:36, mrp:75, category:catMap['Wireless Charger'], brand:'RK BAZAAR', stock:120, unit:'1pcs', isTrending:true, description:'Qi 15W fast charge, LED indicator, anti-slip base.', images:['https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=400'] },
      { name:'20000mAh Slim Power Bank 22.5W', price:799, mrp:1499, category:catMap['Power Bank'], brand:'RK BAZAAR', stock:65, unit:'1pcs', isFeatured:true, description:'Slim design, 22.5W fast charge, LED display.', images:['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400'] },
      { name:'Samsung Compatible Battery 5000mAh', price:199, mrp:399, category:catMap['Mobile Battery'], brand:'Generic', stock:85, unit:'1pcs', description:'CE certified, 500+ cycles, safety protection.', images:['https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400'] },
    ];

    const withSKU = products.map((p,i) => ({ ...p, sku:`BLT-${String(i+1).padStart(4,'0')}` }));
    await Product.insertMany(withSKU);
    console.log(`✅ Created ${products.length} products`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Admin: ${process.env.ADMIN_EMAIL || 'admin@rkbazaar.com'} / Admin@123456`);
    console.log('User:  sanjaysri306@gmail.com / User@123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(0);
  } catch(err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

createAdmin();