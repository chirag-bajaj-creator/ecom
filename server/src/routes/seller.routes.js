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
router.post('/products/upload-image', productImageUpload.single('image'), (req, res, next) => {
  if (!req.file) return res.status(400).json({ success: false, error: { message: 'No image file provided' } });
  res.json({ success: true, data: { imageUrl: `/uploads/products/${req.file.filename}` } });
});
router.put('/products/:id', validateObjectId('id'), updateSellerProduct);
router.delete('/products/all', deleteAllSellerProducts);
router.delete('/products/:id', validateObjectId('id'), deleteSellerProduct);

// Orders (delivery status)
router.get('/orders', getSellerOrders);

// Admin contact
router.get('/admin-contact', getAdminContact);

module.exports = router;
