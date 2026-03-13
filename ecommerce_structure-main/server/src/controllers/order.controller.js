const Order = require("../models/Order");
const CartItem = require("../models/CartItem");
const Product = require("../models/Product");
const DeliveryTracking = require("../models/DeliveryTracking");
const User = require("../models/User");

// GET /api/v1/orders?page=1&limit=10
const getOrders = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments({ userId }),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/orders/:orderId
const getOrderDetail = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found" },
      });
    }

    res.json({ success: true, data: { order } });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/orders/:orderId/cancel
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found" },
      });
    }

    if (!["ordered", "shipped"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "CANNOT_CANCEL",
          message: `Cannot cancel order with status "${order.status}"`,
        },
      });
    }

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    order.status = "cancelled";
    order.cancelledAt = new Date();

    // Auto-refund if payment was successful
    if (order.paymentStatus === "success") {
      order.paymentStatus = "refunded";
    }

    await order.save();

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: { order },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/orders/:orderId/reorder
const reorder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found" },
      });
    }

    const added = [];
    const skipped = [];

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product || product.stock < 1) {
        skipped.push(item.name);
        continue;
      }

      const existing = await CartItem.findOne({
        userId: req.user._id,
        productId: item.productId,
      });

      if (existing) {
        const newQty = Math.min(existing.quantity + item.quantity, product.stock);
        existing.quantity = newQty;
        await existing.save();
      } else {
        const qty = Math.min(item.quantity, product.stock);
        await CartItem.create({
          userId: req.user._id,
          productId: item.productId,
          quantity: qty,
        });
      }
      added.push(item.name);
    }

    res.json({
      success: true,
      message: "Items added to cart",
      data: { added, skipped },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/orders/:orderId/tracking
const getOrderTracking = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user._id,
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found" },
      });
    }

    const tracking = await DeliveryTracking.findOne({
      orderId: order._id,
    }).lean();

    if (!tracking) {
      return res.json({
        success: true,
        data: {
          order: { _id: order._id, status: order.status },
          tracking: null,
          deliveryBoy: null,
        },
      });
    }

    // Get delivery boy info
    let deliveryBoy = null;
    if (order.deliveryBoyId) {
      const dbUser = await User.findById(order.deliveryBoyId)
        .select("name phone")
        .lean();
      if (dbUser) {
        deliveryBoy = { name: dbUser.name, phone: dbUser.phone };
      }
    }

    res.json({
      success: true,
      data: {
        order: {
          _id: order._id,
          status: order.status,
          deliveryAddress: order.deliveryAddress,
        },
        tracking: {
          status: tracking.status,
          currentLat: tracking.currentLat,
          currentLng: tracking.currentLng,
          estimatedArrival: tracking.estimatedArrival,
          pickedUpAt: tracking.pickedUpAt,
          deliveredAt: tracking.deliveredAt,
        },
        deliveryBoy,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOrders, getOrderDetail, cancelOrder, reorder, getOrderTracking };
