const express = require('express');
const { getCategories, getProducts, searchProducts, getSuggestions, getProductById, createProduct, createBulkProducts, createBulkJsonProducts, updateProduct, deleteProduct, bulkMatchImages } = require('../controllers/product.controller');
const { optionalAuth, authenticate, requireRole } = require('../middleware/auth');
const { validateObjectId, validateSearch } = require('../middleware/validate');
const { productImageUpload } = require('../middleware/upload');

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
router.post('/products/bulk-images', authenticate, requireRole('admin'), productImageUpload.array('images', 50), bulkMatchImages);
router.put('/products/:id', authenticate, requireRole('admin'), validateObjectId('id'), updateProduct);
router.delete('/products/:id', authenticate, requireRole('admin'), validateObjectId('id'), deleteProduct);

module.exports = router;
