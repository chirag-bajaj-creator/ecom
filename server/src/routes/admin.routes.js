const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { validateObjectId, validateCharges } = require('../middleware/validate');
const {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getAllUsers,
  getDeliveryBoys,
  getCharges,
  updateCharges,
  cleanupProducts,
  cleanupUsers,
  deleteUser,
  getDeliveryReviews,
  reviewDelivery
} = require('../controllers/admin.controller');

// All routes require admin role
router.use(authenticate, requireRole('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Orders
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', validateObjectId('id'), updateOrderStatus);
router.post('/orders/:id/cancel', validateObjectId('id'), cancelOrder);

// Users
router.get('/users', getAllUsers);
router.delete('/users/:id', validateObjectId('id'), deleteUser);

// Delivery Boys
router.get('/delivery-boys', getDeliveryBoys);

// Delivery Photo Reviews
router.get('/delivery-reviews', getDeliveryReviews);
router.patch('/delivery-reviews/:trackingId', validateObjectId('trackingId'), reviewDelivery);

// Charges
router.get('/charges', getCharges);
router.patch('/charges', validateCharges, updateCharges);

// Cleanup
router.delete('/cleanup-products', cleanupProducts);
router.delete('/cleanup-users', cleanupUsers);

module.exports = router;
