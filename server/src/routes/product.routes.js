const express = require('express');
const rateLimit = require('express-rate-limit');
const { getCategories, getProducts, searchProducts, getSuggestions, getProductById, createProduct, createBulkProducts, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { optionalAuth, authenticate, requireRole } = require('../middleware/auth');
const { validateObjectId, validateSearch } = require('../middleware/validate');

const router = express.Router();

const suggestionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many requests. Please slow down.',
    },
  },
});

router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/search', optionalAuth, validateSearch, searchProducts);
router.get('/products/suggestions', suggestionLimiter, validateSearch, getSuggestions);
router.get('/products/:id', validateObjectId('id'), getProductById);

// Admin product CRUD
router.post('/products', authenticate, requireRole('admin'), createProduct);
router.post('/products/bulk', authenticate, requireRole('admin'), createBulkProducts);
router.put('/products/:id', authenticate, requireRole('admin'), validateObjectId('id'), updateProduct);
router.delete('/products/:id', authenticate, requireRole('admin'), validateObjectId('id'), deleteProduct);

module.exports = router;
