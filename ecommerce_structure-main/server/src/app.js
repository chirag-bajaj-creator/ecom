const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const searchRoutes = require('./routes/search.routes');
const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

// General rate limiter
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
});
app.use(generalLimiter);

// Body parsing & logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
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
