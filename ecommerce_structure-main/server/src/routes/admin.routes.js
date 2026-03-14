const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getAllUsers,
  getDeliveryBoys,
  getCharges,
  updateCharges
} = require('../controllers/admin.controller');

// All routes require admin role
router.use(authenticate, requireRole('admin'));

// Dashboard
router.get('/dashboard', getDashboardStats);

// Orders
router.get('/orders', getAllOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/cancel', cancelOrder);

// Users
router.get('/users', getAllUsers);

// Delivery Boys
router.get('/delivery-boys', getDeliveryBoys);

// Charges
router.get('/charges', getCharges);
router.patch('/charges', updateCharges);

module.exports = router;
