# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Paolino is a complete e-commerce platform for t-shirts and textile products with:
- Node.js/Express backend with MongoDB
- React 19 frontend with Vite and Tailwind CSS
- Stripe payment integration
- Complete admin panel with analytics
- JWT authentication system

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

### Backend (.env)
Required environment variables:
- `NODE_ENV=development`
- `PORT=5031`
- `MONGODB_URI=mongodb://localhost:27017/paolino_ecommerce`
- `JWT_SECRET=your_jwt_secret_here`
- `JWT_EXPIRE=7d`
- `STRIPE_SECRET_KEY=your_stripe_secret_key`
- `STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key`
- `STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret`

### Frontend (.env)
Required environment variables:
- `VITE_API_URL=http://localhost:5031/api`
- `VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key`

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
- Bcrypt password hashing
- JWT token-based authentication
- Express rate limiting
- Helmet security headers
- CORS configuration for frontend domains
- Input validation with Joi schemas
- File upload validation and size limits

## Database Prerequisites
- MongoDB must be running locally on port 27017
- Database name: `paolino_ecommerce`
- No additional setup required (schemas auto-create)

## File Upload Configuration
- Local storage in `/backend/uploads/products/`
- Supported formats: JPEG, PNG, WebP
- Maximum file size: 5MB
- Multer middleware handles validation and storage