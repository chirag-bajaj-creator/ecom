const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { validateObjectId } = require('../middleware/validate');
const {
  getSellerProducts,
  createSellerProduct,
  createSellerBulkJsonProducts,
  sellerBulkMatchImages,
  updateSellerProduct,
  deleteSellerProduct,
  deleteAllSellerProducts,
  getSellerOrders,
  getAdminContact,
} = require('../controllers/seller.controller');
const { productImageUpload } = require('../middleware/upload');

// All routes require seller role
router.use(authenticate, requireRole('seller'));

// Products
router.get('/products', getSellerProducts);
router.post('/products', createSellerProduct);
router.post('/products/bulk-json', createSellerBulkJsonProducts);
router.post('/products/bulk-images', productImageUpload.array('images', 50), sellerBulkMatchImages);
router.put('/products/:id', validateObjectId('id'), updateSellerProduct);
router.delete('/products/all', deleteAllSellerProducts);
router.delete('/products/:id', validateObjectId('id'), deleteSellerProduct);

// Orders (delivery status)
router.get('/orders', getSellerOrders);

// Admin contact
router.get('/admin-contact', getAdminContact);

module.exports = router;
