# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL SECURITY WARNINGS

**BEFORE STARTING:** Read `/SECURITY.md` for critical security information.

### 🔴 Immediate Actions Required
1. **Verify `.env` files are NOT committed** to git
2. **Check Cloudinary keys** - If exposed, rotate immediately (see SECURITY.md)
3. **Configure Stripe keys** - See STRIPE_SETUP.md for complete guide
4. **Review security checklist** in SECURITY.md before deployment

### 🔒 Protected Files
- `/backend/.env` - Contains secrets (JWT, Cloudinary, Stripe)
- `/frontend/.env` - Contains Stripe publishable key
- Both are protected by `.gitignore` ✅

## Project Overview

Paolino is a complete e-commerce platform for t-shirts and textile products with:
- Node.js/Express backend with MongoDB
- React 19 frontend with Vite and Tailwind CSS
- Stripe payment integration (requires configuration)
- Complete admin panel with analytics
- JWT authentication system (cryptographically secure keys)

## Development Commands

### Backend Development
```bash
cd backend
npm install
npm run dev          # Development server with nodemon on port 5031
npm start            # Production server
npm run setup        # Initialize admin user and sample products
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev          # Development server on port 5173
npm run build        # Production build
npm run lint         # ESLint code analysis
npm run preview      # Preview production build
```

### Project Setup
To initialize the project with sample data:
```bash
cd backend
npm run setup        # Creates admin user and 6 sample products
```

## Architecture & Key Components

### Backend Structure (`/backend`)
- **serverPaolino.js**: Main Express server with security middleware (helmet, CORS, rate limiting)
- **config/database.js**: MongoDB connection configuration
- **models/**: Mongoose schemas (User, Product, Order, Cart)
- **routes/**: API endpoints (auth, products, cart, orders, admin)
- **controllers/**: Business logic handlers
- **middlewares/**: Authentication, upload, validation middleware
- **services/**: Stripe integration and external services
- **uploads/**: Local file storage for product images

### Frontend Structure (`/frontend`)
- **src/App.jsx**: Main router with route protection
- **src/contexts/**: React Context providers (AuthContext, CartContext)
- **src/pages/**: Page components including complete admin panel
- **src/components/**: Reusable UI components (Header, Footer, ProductCard)
- **src/services/**: API communication layer with axios
- **src/hooks/**: Custom React hooks
- **src/utils/**: Utility functions and helpers

### Database Models (MongoDB)
- **User**: Roles (customer/admin), bcrypt hashed passwords, shipping addresses
- **Product**: Complex variants (size/color), stock tracking, Stripe integration
- **Order**: Complete order lifecycle with payment status and shipping
- **Cart**: Persistent shopping cart for authenticated users

### API Architecture
- `/api/auth/*`: Authentication (register, login, profile management)
- `/api/products/*`: Product catalog with search, filters, pagination
- `/api/cart/*`: Shopping cart operations (requires authentication)
- `/api/orders/*`: Order management and payment processing
- `/api/admin/*`: Administrative functions (products, orders, users, analytics)

### Admin Panel Features (Complete)
- **Dashboard**: Real-time statistics, recent orders, quick actions
- **Product Management**: Full CRUD with image upload, variant management
- **Order Management**: Status updates, refunds, tracking numbers
- **User Management**: Account activation/deactivation
- **Analytics**: Sales charts, top products, performance insights
- **Settings**: Store configuration, security, payment settings

## Key Technologies & Libraries

### Backend Dependencies
- **express**: Web framework with security middleware
- **mongoose**: MongoDB ODM with schema validation
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **stripe**: Payment processing
- **joi**: Input validation
- **multer**: File upload handling

### Frontend Dependencies
- **react**: v19 with modern hooks and Context API
- **react-router-dom**: Client-side routing with protected routes
- **@stripe/stripe-js**: Payment processing integration
- **axios**: HTTP client with interceptors
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Modern icon library

## Environment Configuration

### 🔧 First Time Setup

1. **Backend Environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your actual keys (see .env.example comments)
   ```

2. **Frontend Environment:**
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your Stripe publishable key
   ```

3. **Configure Stripe:** Follow `/STRIPE_SETUP.md` for complete guide

### Backend (.env)
See `.env.example` for template. Required variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (5031)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - **CRITICAL:** Cryptographically secure (512-bit) ✅ Generated
- `JWT_REFRESH_SECRET` - **CRITICAL:** Different from JWT_SECRET ✅ Generated
- `JWT_EXPIRE` - Token expiry (7d)
- `STRIPE_SECRET_KEY` - Stripe secret key (sk_test_... or sk_live_...)
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - **CRITICAL:** Keep secret
- `CORS_ORIGIN` - Frontend URL (http://localhost:5173)

### Frontend (.env)
See `.env.example` for template. Required variables:
- `VITE_API_URL` - Backend API URL (http://localhost:5031/api)
- `VITE_SERVER_URL` - Backend server URL (http://localhost:5031)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (safe to expose)

## Testing Credentials
- **Admin Email**: admin@paolino.com
- **Admin Password**: admin123

## Development Status

### Completed Features (95%)
- ✅ Backend API with authentication and security
- ✅ Product catalog with search, filters, and pagination
- ✅ Shopping cart functionality
- ✅ Complete admin panel with analytics
- ✅ User authentication and authorization
- ✅ Stripe payment integration setup
- ✅ Responsive frontend with Tailwind CSS

### Remaining Tasks (5%)
- Product detail page with image gallery
- Complete checkout flow with Stripe payment
- Shopping cart page with quantity management
- User profile page with order history

## Security Implementation

### ✅ Security Features Active
- **Bcrypt password hashing** - 10 salt rounds
- **JWT authentication** - Cryptographically secure 512-bit secrets
- **Rate limiting** - 100 req/15min (production), 500 req/15min (dev)
- **Helmet security headers** - XSS, clickjacking protection
- **CORS whitelist** - Only authorized origins
- **Input validation** - Joi schemas on all endpoints
- **File upload security** - Type/size validation (5MB max)
- **Cloudinary integration** - Secure image storage with transformations
- **Admin-only routes** - Role-based access control
- **Environment isolation** - .env files protected by .gitignore

### 🔒 Security Checklist (Pre-Production)
See `/SECURITY.md` for complete checklist:
- [ ] .env files NOT committed (verified)
- [ ] Cloudinary keys rotated if exposed
- [ ] Stripe keys configured (test → live)
- [ ] MongoDB authentication enabled
- [ ] HTTPS enforced in production
- [ ] Webhook secrets configured
- [ ] Admin password changed from default

### 📚 Security Documentation
- **Full Security Guide:** `/SECURITY.md`
- **Stripe Configuration:** `/STRIPE_SETUP.md`
- **NPM Audit Status:** 0 vulnerabilities ✅
- **Last Security Review:** 2025-11-04

## Database Prerequisites
- MongoDB must be running locally on port 27017
- Database name: `paolino_ecommerce`
- No additional setup required (schemas auto-create)

## File Upload Configuration
- **Storage:** Cloudinary (cloud-based, production-ready)
- **Supported formats:** JPEG, PNG, WebP
- **Maximum file size:** 5MB per file
- **Auto-transformations:** 1200x1200 max, auto quality, auto format
- **Folder structure:** `paolino/products/`
- **Cleanup:** Auto-delete images when products are deleted
- **Middleware:** Multer + CloudinaryStorage integration