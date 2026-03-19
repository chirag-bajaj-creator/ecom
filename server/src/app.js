const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xssSanitize = require('./middleware/sanitize');
const hpp = require('hpp');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const searchRoutes = require('./routes/search.routes');
const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const checkoutRoutes = require('./routes/checkout.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const profileRoutes = require('./routes/profile.routes');
const deliveryRoutes = require('./routes/delivery.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const path = require('path');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", env.FRONTEND_URL],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// General rate limiter (skip in test mode, skip for admin & delivery routes)
if (process.env.NODE_ENV !== 'test') {
  const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 300,
    skip: (req) => {
      return req.path.startsWith('/api/v1/admin') || req.path.startsWith('/api/v1/delivery');
    },
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.',
      },
    },
  });
  app.use(generalLimiter);
}

// Body parsing & logging
app.use(express.json({ limit: '10mb' }));
app.use(mongoSanitize());
app.use(xssSanitize);
app.use(hpp());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}
app.use(compression());

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/wishlist', wishlistRoutes);
app.use('/api/v1/checkout', checkoutRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
