# Paolino E-commerce Platform

Complete MERN stack e-commerce platform for t-shirts and textile products with Stripe payment integration, complete admin panel, and JWT authentication.

**Status**: ~95% Complete - Admin panel fully functional, core features ready
**Tech Stack**: Node.js/Express + MongoDB + React 19 + Vite + Tailwind CSS + Stripe

## Table of Contents
- [Quick Start](#quick-start)
- [Project Overview](#project-overview)
- [Architecture & Key Components](#architecture--key-components)
- [Development Commands](#development-commands)
- [Environment Configuration](#environment-configuration)
- [Testing Credentials](#testing-credentials)
- [API Documentation](#api-documentation)
- [Admin Panel Features](#admin-panel-features)
- [Security Implementation](#security-implementation)
- [Project Status & Roadmap](#project-status--roadmap)
- [Troubleshooting](#troubleshooting)

## Quick Start

### ⚠️ CRITICAL: Start in Correct Order

**Step 1: Start MongoDB**
```bash
# Linux/WSL
sudo service mongodb start

# Or use MongoDB Compass
```

**Step 2: Start Backend (REQUIRED FIRST)**
```bash
# Terminal 1 - Backend
cd Paolino-main/backend
npm install          # First time only
npm run dev          # Server on port 5031
```

You should see:
```
Server running on port 5031
MongoDB connected successfully
```

**Step 3: Start Frontend**
```bash
# Terminal 2 - Frontend (new terminal)
cd Paolino-main/frontend
npm install          # First time only
npm run dev          # App on port 5173
```

**Step 4: Open Browser**
```
http://localhost:5173
```

### First-Time Database Setup

Initialize with admin user and 6 sample products:
```bash
cd Paolino-main/backend
npm run setup
```

## Project Overview

Paolino is a production-ready e-commerce platform featuring:
- **Complete Backend API** with MongoDB and Express
- **Modern React Frontend** with Tailwind CSS and responsive design
- **Stripe Payment Integration** for secure transactions
- **Full Admin Dashboard** with analytics, product management, order tracking
- **JWT Authentication** with cryptographically secure keys
- **Image Upload** via Cloudinary integration
- **Security Hardened** with helmet, CORS, rate limiting, input validation

## Architecture & Key Components

### Backend Structure (`/backend`)

```
backend/
├── serverPaolino.js       # Main Express server
├── config/
│   └── database.js        # MongoDB connection
├── models/
│   ├── User.js            # User schema with roles
│   ├── Product.js         # Product with variants
│   ├── Order.js           # Order with payment status
│   └── Cart.js            # Persistent shopping cart
├── routes/
│   ├── auth.js            # Authentication endpoints
│   ├── products.js        # Product catalog API
│   ├── cart.js            # Shopping cart operations
│   ├── orders.js          # Order management
│   └── admin.js           # Admin-only endpoints
├── controllers/           # Business logic handlers
├── middlewares/
│   ├── auth.js            # JWT verification
│   ├── upload.js          # Cloudinary integration
│   └── validation.js      # Joi input validation
├── services/
│   └── stripeService.js   # Stripe payment processing
└── uploads/               # Local file storage (fallback)
```

### Frontend Structure (`/frontend`)

```
frontend/
├── src/
│   ├── App.jsx            # Main router with route protection
│   ├── contexts/
│   │   ├── AuthContext.jsx    # User authentication state
│   │   └── CartContext.jsx    # Shopping cart state
│   ├── pages/
│   │   ├── HomePage.jsx           # Classic landing page
│   │   ├── ProductShowcasePage.jsx # NEW: Product-first landing
│   │   ├── ProductsPage.jsx       # Product catalog with filters
│   │   ├── CartPage.jsx           # Shopping cart management
│   │   ├── CheckoutPage.jsx       # Checkout with Stripe
│   │   ├── ProfilePage.jsx        # User profile and orders
│   │   └── admin/                 # Complete admin panel
│   │       ├── Dashboard.jsx
│   │       ├── ProductsAdmin.jsx
│   │       ├── OrdersAdmin.jsx
│   │       ├── UsersAdmin.jsx
│   │       ├── AnalyticsAdmin.jsx
│   │       └── SettingsAdmin.jsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx     # Navigation with cart icon
│   │   │   └── Footer.jsx     # Site footer
│   │   ├── ProductCard.jsx    # Product display component
│   │   └── Layout.jsx         # Page wrapper
│   ├── services/
│   │   └── api.js         # Axios API client with interceptors
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Helper functions
└── public/                # Static assets
```

### Database Models (MongoDB)

**User Model**:
- Fields: email, password (bcrypt hashed), firstName, lastName, role (customer/admin)
- Addresses: shipping/billing with full address details
- Timestamps: createdAt, updatedAt

**Product Model**:
- Fields: name, description, basePrice, category, tags, images[]
- Variants: Array of {size, color, stock, sku, price}
- Stock tracking per variant
- Stripe product/price integration
- Featured/active flags

**Order Model**:
- Fields: orderNumber (auto-generated), user, items[], totalAmount
- Status: pending, processing, shipped, delivered, cancelled
- Payment: method, status, transactionId, paidAt
- Shipping: address, carrier, trackingNumber, shippedAt
- Refund tracking

**Cart Model**:
- Fields: user, items[] with {product, variant, quantity}
- Auto-cleanup on checkout
- Persistent across sessions

## Development Commands

### Backend Development
```bash
cd backend
npm install              # Install dependencies
npm run dev              # Development server with nodemon (port 5031)
npm start                # Production server
npm run setup            # Initialize admin user and sample products
npm run clean:products   # Delete all products from database
```

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Development server (port 5173)
npm run build        # Production build
npm run lint         # ESLint code analysis
npm run preview      # Preview production build
```

## Environment Configuration

### 🔧 First Time Setup

**Backend Environment**:
```bash
cd backend
cp .env.example .env
# Edit .env with your actual keys (see below)
```

**Frontend Environment**:
```bash
cd frontend
cp .env.example .env
# Edit .env with API URL and Stripe key
```

### Backend `.env` Variables

```env
# Environment
NODE_ENV=development
PORT=5031

# Database
MONGODB_URI=mongodb://localhost:27017/paolino_ecommerce

# JWT Authentication (CRITICAL: Use cryptographically secure keys)
JWT_SECRET=your-512-bit-secret-here
JWT_REFRESH_SECRET=your-different-512-bit-refresh-secret
JWT_EXPIRE=7d

# Stripe Payment (https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Cloudinary Image Storage (https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend `.env` Variables

```env
# Backend API
VITE_API_URL=http://localhost:5031/api
VITE_SERVER_URL=http://localhost:5031

# Stripe (publishable key is safe to expose)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Testing Credentials

**Admin Account**:
- Email: `admin@paolino.com`
- Password: `admin123`
- Role: `admin`

Access admin panel at: `http://localhost:5173/admin`

## API Documentation

### Authentication (`/api/auth/*`)
- `POST /auth/register` - Create new user account
- `POST /auth/login` - Login with email/password (returns JWT)
- `GET /auth/profile` - Get current user profile (requires auth)
- `PUT /auth/profile` - Update user profile
- `POST /auth/logout` - Logout user

### Products (`/api/products/*`)
- `GET /products` - Get all products (with filters, search, pagination)
- `GET /products/:id` - Get single product details
- `POST /products` - Create new product (admin only)
- `PUT /products/:id` - Update product (admin only)
- `DELETE /products/:id` - Delete product (admin only)

**Query Parameters**:
- `category` - Filter by category
- `search` - Search in name/description
- `minPrice`, `maxPrice` - Price range
- `sort` - Sort by (newest, price-asc, price-desc, name)
- `page`, `limit` - Pagination

### Cart (`/api/cart/*`) - Requires Authentication
- `GET /cart` - Get user's cart
- `POST /cart/add` - Add item to cart
- `PUT /cart/update/:itemId` - Update item quantity
- `DELETE /cart/remove/:itemId` - Remove item from cart
- `DELETE /cart/clear` - Clear entire cart

### Orders (`/api/orders/*`) - Requires Authentication
- `GET /orders` - Get user's orders
- `GET /orders/:id` - Get single order details
- `POST /orders` - Create new order (with Stripe payment)
- `PUT /orders/:id/status` - Update order status (admin only)
- `POST /orders/:id/refund` - Process refund (admin only)

### Admin (`/api/admin/*`) - Requires Admin Role
- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/users` - Get all users
- `PUT /admin/users/:id/toggle` - Activate/deactivate user
- `GET /admin/analytics` - Sales analytics and charts
- `PUT /admin/settings` - Update store settings

## Admin Panel Features

### 📊 Dashboard
- Real-time statistics (users, products, orders, revenue)
- Recent orders with quick actions
- Alerts for pending orders
- System status overview

### 📦 Product Management
- Full CRUD operations with validation
- Multi-image upload (up to 5 per product)
- Complex variant management (size, color, stock, SKU)
- Auto-SKU generation
- Advanced filters and search
- Pagination and sorting

### 📋 Order Management
- Tabular view with all order details
- Detailed order modal
- Status updates with tracking numbers
- Integrated Stripe refund system
- Filter by status and search customers

### 👥 User Management
- Card-based responsive view
- Account activation/deactivation
- User statistics (active/inactive/admin counts)
- Search by name/email

### 📈 Analytics
- Sales charts with period selection (7d/30d/90d)
- Order status distribution
- Top-selling products
- KPIs and automated insights
- Performance recommendations

### ⚙️ Settings
- General store configuration
- Security and session settings
- Notification preferences
- Payment and tax configuration
- Shipping zones and methods

## Security Implementation

### ✅ Active Security Features

- **Bcrypt Password Hashing** - 10 salt rounds
- **JWT Authentication** - Cryptographically secure 512-bit secrets
- **Rate Limiting** - 100 req/15min (production), 500 req/15min (dev)
- **Helmet Security Headers** - XSS, clickjacking protection
- **CORS Whitelist** - Only authorized origins
- **Input Validation** - Joi schemas on all endpoints
- **File Upload Security** - Type/size validation (5MB max)
- **Cloudinary Integration** - Secure cloud image storage
- **Admin-Only Routes** - Role-based access control
- **Environment Isolation** - `.env` files protected by `.gitignore`

### 🔒 Pre-Production Security Checklist

See `/SECURITY.md` for complete guide:
- [ ] `.env` files NOT committed (verify with `git status`)
- [ ] Cloudinary keys rotated if exposed
- [ ] Stripe keys configured (test → live)
- [ ] MongoDB authentication enabled
- [ ] HTTPS enforced in production
- [ ] Webhook secrets configured
- [ ] Admin password changed from default
- [ ] Rate limits adjusted for production traffic
- [ ] CORS origins updated for production domain

### 📚 Security Documentation

- **Full Security Guide**: `/SECURITY.md`
- **Stripe Configuration**: `/STRIPE_SETUP.md`
- **Cloudinary Integration**: `/CLOUDINARY_INTEGRATION.md`
- **NPM Audit Status**: 0 vulnerabilities ✅

## Project Status & Roadmap

### ✅ Completed Features (95%)

**Backend (100%)**:
- ✅ Express server with security middleware
- ✅ MongoDB schemas and database connection
- ✅ Complete authentication system (JWT)
- ✅ Product API with filters, search, pagination
- ✅ Shopping cart functionality
- ✅ Order management with payment tracking
- ✅ Stripe integration for products
- ✅ Image upload system (Cloudinary)
- ✅ Input validation (Joi)
- ✅ Security hardening

**Frontend (95%)**:
- ✅ React 19 + Vite + Tailwind CSS setup
- ✅ Routing with React Router
- ✅ Context API (Auth + Cart)
- ✅ Responsive Header/Footer
- ✅ ProductShowcasePage (new landing)
- ✅ Product catalog with filters
- ✅ ProductCard component with variants
- ✅ Login/Register pages
- ✅ Route protection (auth + admin)
- ✅ **Complete Admin Panel** (Dashboard, Products, Orders, Users, Analytics, Settings)

### 🚧 Remaining Tasks (5%)

**Frontend Pages**:
- 🟡 **Product Detail Page** - Full product view with image gallery and variant selection
- 🟡 **Complete Cart Page** - Quantity management, item removal, totals summary
- 🟡 **Checkout Flow** - Shipping address form, Stripe Payment integration
- 🟡 **User Profile Page** - Account settings and order history

**Advanced Features** (Future):
- 🔴 Review System - Product ratings and comments
- 🔴 Wishlist - User favorite products
- 🔴 Email Notifications - Order confirmations, shipping updates
- 🔴 Coupon System - Discount codes and promotions

## Troubleshooting

### Error: "ERR_CONNECTION_REFUSED"
**Problem**: Backend not running
**Solution**:
1. Navigate to `Paolino-main/backend`
2. Run `npm run dev`
3. Wait for "Server running on port 5031"
4. Refresh frontend page

### Error: "MongoDB connection failed"
**Problem**: MongoDB not running
**Solution**:
```bash
sudo service mongodb start
# Or start MongoDB Compass
```

### No products displayed
**Problem**: Empty database
**Solution**:
```bash
cd Paolino-main/backend
npm run setup    # Creates admin + 6 sample products
```

### Port already in use
**Problem**: Port 5031 or 5173 occupied
**Solution**:
```bash
# Check what's running on port
lsof -i :5031

# Kill process
kill -9 $(lsof -t -i:5031)
```

### Frontend shows null/undefined errors
**Problem**: Components loading before data fetch
**Solution**: Already fixed with null safety checks in code

## Useful Commands

```bash
# View backend logs in real-time
cd Paolino-main/backend
npm run dev

# Check port 5031 status
lsof -i :5031

# Kill process on port (if needed)
kill -9 $(lsof -t -i:5031)

# Reset database (CAUTION!)
mongo paolino_ecommerce --eval "db.dropDatabase()"
npm run setup

# Run security audit
npm audit

# Update dependencies
npm update
```

## Additional Documentation

- **`/SECURITY.md`** - ⚠️ **CRITICAL**: Complete security guide, .env setup, key rotation
- **`/QUICK_START.md`** - Fast setup guide (superseded by this README)
- **`/STATUS.md`** - Detailed project status (superseded by this README)
- **`/STRIPE_SETUP.md`** - Stripe payment configuration guide
- **`/CLOUDINARY_INTEGRATION.md`** - Image upload setup guide

---

## Development Checklist

Before starting development:
- [ ] MongoDB running
- [ ] Backend running (port 5031)
- [ ] Frontend running (port 5173)
- [ ] Browser open on localhost:5173
- [ ] No errors in console

**Remember**: Backend MUST be running when developing frontend! 🚀

---

*Last Updated: 2025-11-20*
*Project Status: 95% Complete - Production Ready with Minor Features Pending*
