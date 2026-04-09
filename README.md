# 🛒 RK BAZAAR — 3D E-Commerce Platform

Welcome to **RK BAZAAR**, a premium, full-stack electronics e-commerce store featuring a futuristic 3D login experience, integrated payments, and a powerful admin panel.

---

## 📁 Project Structure

```text
RK-BAZAAR/
├── backend/            # Node.js + Express API
│   ├── models/         # Database schemas (MongoDB)
│   ├── routes/         # API endpoints
│   ├── uploads/        # Product images
│   └── server.js       # Main server entry
├── frontend/           # Static HTML, CSS, JavaScript
│   ├── index.html      # Main storefront
│   └── rk-secure-manager.html # Secret Admin Panel
└── .env                # Private configuration (DO NOT SHARE)
```

---

## ⚙️ Quick Setup Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (Local installation or MongoDB Atlas)

### 2. Backend Setup
1. Open a terminal in the `backend/` folder:
   ```bash
   cd backend
   npm install
   ```
2. Create your `.env` file:
   - Copy `.env.example` to a new file named `.env`.
   - Fill in your own MongoDB URI, Razorpay keys, and Gmail SMTP credentials.

### 3. Database Seeding (Optional)
To populate the store with sample products and categories:
```bash
npm run seed
```

### 4. Start the Application
1. Start the backend server:
   ```bash
   npm start
   ```
   The server will run on [http://localhost:5000](http://localhost:5000).

2. Open the frontend:
   - Simply open `frontend/index.html` in your browser.
   - Or use a liver server extension.

---

## 🛡️ Admin Access
To manage products and orders, visit the secret admin URL:
[http://localhost:5000/rk-secure-manager.html](http://localhost:5000/rk-secure-manager.html)

---

## 🚀 Deployment

- **Backend**: Can be deployed to Vercel, Railway, or Render.
- **Frontend**: Can be served directly from the backend or hosted on Netlify/Vercel.

---

## 📞 Support
For any questions regarding the setup or features, please contact the developer.
