const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const DeliveryBoy = require('../models/DeliveryBoy');
const DeliveryTracking = require('../models/DeliveryTracking');
const Category = require('../models/Category');
const ChargeConfig = require('../models/ChargeConfig');

// GET /api/v1/admin/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalOrders,
      ordersByStatus,
      totalRevenueResult,
      totalRefundsResult,
      totalUsers,
      totalDeliveryBoys,
      activeDeliveryBoys,
      totalProducts,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      Order.aggregate([
        { $match: { status: 'cancelled' } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ]),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'delivery' }),
      DeliveryBoy.countDocuments({ isOnline: true }),
      Product.countDocuments(),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
        .lean()
    ]);

    const statusMap = {};
    ordersByStatus.forEach(s => { statusMap[s._id] = s.count; });

    res.json({
      totalOrders,
      ordersByStatus: statusMap,
      totalRevenue: totalRevenueResult[0]?.total || 0,
      totalRefunds: totalRefundsResult[0]?.total || 0,
      totalUsers,
      totalDeliveryBoys,
      activeDeliveryBoys,
      totalProducts,
      recentOrders
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: error.message });
  }
};

// GET /api/v1/admin/orders?status=&page=&limit=
const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('userId', 'name email phone')
        .lean(),
      Order.countDocuments(filter)
    ]);

    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
  }
};

// PATCH /api/v1/admin/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['ordered', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status === 'delivered') {
      return res.status(400).json({ message: 'Cannot change status of delivered order' });
    }
    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot change status of cancelled order' });
    }

    order.status = status;
    if (status === 'delivered') order.deliveredAt = new Date();
    await order.save();

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update order status', error: error.message });
  }
};

// POST /api/v1/admin/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order already cancelled' });
    }
    if (order.status !== 'ordered') {
      return res.status(400).json({ message: 'Cannot cancel order after pickup. Only orders with status "ordered" can be cancelled.' });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity }
      });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelledBy = 'admin';
    await order.save();

    // Refund payment
    await Payment.findOneAndUpdate(
      { orderId: order._id },
      { status: 'refunded' }
    );

    // Clear delivery assignment if any
    await DeliveryTracking.findOneAndUpdate(
      { orderId: order._id, status: { $ne: 'delivered' } },
      { status: 'cancelled' }
    );

    const tracking = await DeliveryTracking.findOne({ orderId: order._id });
    if (tracking && tracking.deliveryBoyId) {
      await DeliveryBoy.findByIdAndUpdate(tracking.deliveryBoyId, {
        currentOrderId: null
      });
    }

    res.json({ message: 'Order cancelled and refunded', order });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cancel order', error: error.message });
  }
};

// GET /api/v1/admin/users?role=&page=&limit=
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

// GET /api/v1/admin/delivery-boys
const getDeliveryBoys = async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find()
      .populate('userId', 'name email phone')
      .populate('currentOrderId', 'status grandTotal deliveryAddress')
      .sort({ isOnline: -1, lastActiveAt: -1 })
      .lean();

    res.json({ deliveryBoys });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch delivery boys', error: error.message });
  }
};

// GET /api/v1/admin/charges
const getCharges = async (req, res) => {
  try {
    let config = await ChargeConfig.findOne();
    if (!config) {
      config = await ChargeConfig.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch charges', error: error.message });
  }
};

// PATCH /api/v1/admin/charges
const updateCharges = async (req, res) => {
  try {
    const { deliveryCharge, freeDeliveryThreshold, surgeCharge, handlingCharge } = req.body;

    let config = await ChargeConfig.findOne();
    if (!config) {
      config = await ChargeConfig.create({});
    }

    const updates = { deliveryCharge, freeDeliveryThreshold, surgeCharge, handlingCharge };
    const auditEntries = [];

    for (const [field, newValue] of Object.entries(updates)) {
      if (newValue !== undefined && newValue !== config[field]) {
        auditEntries.push({
          field,
          oldValue: config[field],
          newValue,
          changedBy: req.user._id,
          changedAt: new Date()
        });
        config[field] = newValue;
      }
    }

    if (auditEntries.length === 0) {
      return res.status(400).json({ message: 'No changes detected' });
    }

    config.auditLog.push(...auditEntries);
    await config.save();

    res.json({ message: 'Charges updated', config });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update charges', error: error.message });
  }
};

// DELETE /api/v1/admin/cleanup-products
const cleanupProducts = async (req, res) => {
  try {
    const productResult = await Product.deleteMany({});
    const categoryResult = await Category.deleteMany({});

    res.json({
      message: 'All products and categories deleted',
      productsDeleted: productResult.deletedCount,
      categoriesDeleted: categoryResult.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to cleanup', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getAllUsers,
  getDeliveryBoys,
  getCharges,
  updateCharges,
  cleanupProducts
};
