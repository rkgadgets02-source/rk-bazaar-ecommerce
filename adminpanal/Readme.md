# 🛒 BLANTECH STORE — Full Stack Electronics E-Commerce

A complete, production-ready electronics e-commerce website built with:
- **Frontend:** Pure HTML, CSS, JavaScript (no framework needed)
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Payments:** Razorpay + Stripe + Cash on Delivery

---

## 📁 PROJECT STRUCTURE

```
blantech/
├── backend/
│   ├── models/
│   │   ├── User.js          ← User accounts, addresses
│   │   ├── Product.js       ← Products with reviews
│   │   └── index.js         ← Category, Order, Cart, Wishlist
│   ├── routes/
│   │   ├── auth.js          ← Register, Login, Profile
│   │   ├── products.js      ← CRUD + search + reviews
│   │   ├── categories.js    ← Category management
│   │   ├── orders.js        ← Order lifecycle
│   │   ├── cart.js          ← Cart operations
│   │   ├── wishlist.js      ← Wishlist toggle
│   │   ├── payment.js       ← Razorpay + Stripe + COD
│   │   ├── admin.js         ← Dashboard stats
│   │   └── contact.js       ← Contact form + email
│   ├── middleware/
│   │   └── auth.js          ← JWT protect, admin-only
│   ├── config/
│   │   └── seed.js          ← Sample data seeder
│   ├── server.js            ← Main entry point
│   ├── package.json
│   └── .env.example         ← Environment variables template
│
└── frontend/
    ├── index.html           ← Main customer-facing website
    └── admin.html           ← Admin dashboard panel
```

---

## ⚙️ SETUP INSTRUCTIONS

### STEP 1 — Install Prerequisites
```bash
# Node.js (v18+): https://nodejs.org
node --version

# MongoDB: https://www.mongodb.com/try/download/community
# OR use MongoDB Atlas (free cloud): https://cloud.mongodb.com
```

### STEP 2 — Backend Setup
```bash
cd blantech/backend
npm install
```

### STEP 3 — Configure Environment
```bash
# Copy example env file
cp .env.example .env

# Edit .env with your real values:
nano .env   # or open with any editor
```

**Required .env values:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blantech_store

JWT_SECRET=your_very_secret_key_here

# Razorpay — get from https://razorpay.com
RAZORPAY_KEY_ID=rzp_test_XXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXX

# Stripe — get from https://stripe.com
STRIPE_SECRET_KEY=sk_test_XXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXX

# Gmail SMTP
EMAIL_USER=yourmail@gmail.com
EMAIL_PASS=your_app_password   # Enable 2FA → App passwords in Gmail
ADMIN_EMAIL=admin@blantech.in

CLIENT_URL=http://localhost:3000
```

### STEP 4 — Seed Database (Sample Data)
```bash
cd blantech/backend
npm run seed
```
This creates:
- 12 product categories
- 15 sample products
- Admin: `admin@blantech.in` / `Admin@123456`
- Sample user: `sanjaysri306@gmail.com` / `User@123456`

### STEP 5 — Start Backend Server
```bash
cd blantech/backend
npm start          # Production
# OR
npm run dev        # Development (auto-restart with nodemon)
```
Server runs at: **http://localhost:5000**

### STEP 6 — Open Frontend
Simply open the HTML files in your browser:
```
blantech/frontend/index.html   ← Customer website
blantech/frontend/admin.html   ← Admin panel
```

Or serve with a simple server:
```bash
# Python
cd blantech/frontend
python3 -m http.server 3000

# OR npx
npx serve blantech/frontend -p 3000
```

---

## 🌐 API ENDPOINTS

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get profile |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/address` | Add address |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List with search/filter/sort |
| GET | `/api/products/:id` | Single product |
| POST | `/api/products` | Create (Admin) |
| PUT | `/api/products/:id` | Update (Admin) |
| DELETE | `/api/products/:id` | Delete (Admin) |
| POST | `/api/products/:id/review` | Add review |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Place order |
| GET | `/api/orders/my` | My orders |
| PUT | `/api/orders/:id/pay` | Mark as paid |
| PUT | `/api/orders/:id/cancel` | Cancel order |
| GET | `/api/orders` | All orders (Admin) |
| PUT | `/api/orders/:id/status` | Update status (Admin) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/razorpay/create-order` | Create Razorpay order |
| POST | `/api/payment/razorpay/verify` | Verify payment |
| POST | `/api/payment/stripe/create-intent` | Stripe payment intent |
| POST | `/api/payment/stripe/confirm` | Confirm Stripe payment |
| POST | `/api/payment/cod/confirm` | COD confirmation |

---

## 🎯 FEATURES

### Customer Website
- ✅ Beautiful mobile-first UI (matches your reference app)
- ✅ Home with promo banner, categories, trending & featured
- ✅ Product search with filters & sorting
- ✅ Product detail with image gallery & reviews
- ✅ Add to cart / wishlist
- ✅ Checkout with address form
- ✅ Razorpay, Stripe & COD payment
- ✅ Order tracking
- ✅ User authentication (Login / Register)
- ✅ Contact & About page
- ✅ Works offline in demo mode (no backend required for UI preview)

### Admin Panel
- ✅ Dashboard with live revenue, orders, products, customers
- ✅ Product management (Add / Edit / Delete)
- ✅ Order management (Update status, tracking ID)
- ✅ Category management
- ✅ Customer management (Activate / Deactivate)

---

## 🚀 DEPLOYMENT

### Deploy Backend to Railway / Render
1. Push code to GitHub
2. Connect repo to Railway/Render
3. Set environment variables
4. Deploy

### Deploy Frontend to Netlify / Vercel
1. Upload `frontend/` folder
2. Or drag & drop to Netlify

### Use MongoDB Atlas (Cloud DB)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/blantech_store
```

---

## 📞 SUPPORT
- WhatsApp: +91 98765 43210
- Email: support@blantech.in