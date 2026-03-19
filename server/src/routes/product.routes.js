const express = require('express');
const { getCategories, getProducts, searchProducts, getSuggestions, getProductById, createProduct, createBulkProducts, createBulkJsonProducts, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { optionalAuth, authenticate, requireRole } = require('../middleware/auth');
const { validateObjectId, validateSearch } = require('../middleware/validate');

const router = express.Router();

router.get('/categories', getCategories);
router.get('/products', getProducts);
router.get('/products/search', optionalAuth, validateSearch, searchProducts);
router.get('/products/suggestions', validateSearch, getSuggestions);
router.get('/products/:id', validateObjectId('id'), getProductById);

// Admin product CRUD
router.post('/products', authenticate, requireRole('admin'), createProduct);
router.post('/products/bulk', authenticate, requireRole('admin'), createBulkProducts);
router.post('/products/bulk-json', authenticate, requireRole('admin'), createBulkJsonProducts);
router.put('/products/:id', authenticate, requireRole('admin'), validateObjectId('id'), updateProduct);
router.delete('/products/:id', authenticate, requireRole('admin'), validateObjectId('id'), deleteProduct);

module.exports = router;
