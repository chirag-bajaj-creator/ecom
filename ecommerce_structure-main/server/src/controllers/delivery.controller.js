const DeliveryBoy = require("../models/DeliveryBoy");
const DeliveryTracking = require("../models/DeliveryTracking");
const Order = require("../models/Order");
const { getWss } = require("../websocket/deliverySocket");

// Ensure DeliveryBoy record exists for this user
const ensureDeliveryBoy = async (userId) => {
  let db = await DeliveryBoy.findOne({ userId });
  if (!db) {
    db = await DeliveryBoy.create({ userId });
  }
  return db;
};

// PATCH /api/v1/delivery/status
const toggleStatus = async (req, res, next) => {
  try {
    const { isOnline } = req.body;
    const deliveryBoy = await ensureDeliveryBoy(req.user._id);

    deliveryBoy.isOnline = isOnline;
    if (isOnline) {
      deliveryBoy.lastActiveAt = new Date();
    }
    await deliveryBoy.save();

    res.json({
      success: true,
      message: `You are now ${isOnline ? "online" : "offline"}`,
      data: { isOnline: deliveryBoy.isOnline },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/delivery/current-order
const getCurrentOrder = async (req, res, next) => {
  try {
    const deliveryBoy = await ensureDeliveryBoy(req.user._id);

    if (!deliveryBoy.currentOrderId) {
      return res.json({ success: true, data: { order: null } });
    }

    const order = await Order.findById(deliveryBoy.currentOrderId).lean();
    if (!order) {
      deliveryBoy.currentOrderId = null;
      await deliveryBoy.save();
      return res.json({ success: true, data: { order: null } });
    }

    const tracking = await DeliveryTracking.findOne({
      orderId: order._id,
      deliveryBoyId: deliveryBoy._id,
    }).lean();

    res.json({
      success: true,
      data: {
        order: {
          _id: order._id,
          items: order.items,
          deliveryAddress: order.deliveryAddress,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          grandTotal: order.grandTotal,
          status: order.status,
          createdAt: order.createdAt,
        },
        tracking: tracking
          ? {
              status: tracking.status,
              estimatedArrival: tracking.estimatedArrival,
              currentLat: tracking.currentLat,
              currentLng: tracking.currentLng,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/delivery/location
const updateLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_COORDS", message: "lat and lng are required" },
      });
    }

    const deliveryBoy = await ensureDeliveryBoy(req.user._id);
    deliveryBoy.currentLat = lat;
    deliveryBoy.currentLng = lng;
    deliveryBoy.lastActiveAt = new Date();
    await deliveryBoy.save();

    // Update tracking record if active order
    if (deliveryBoy.currentOrderId) {
      await DeliveryTracking.findOneAndUpdate(
        { orderId: deliveryBoy.currentOrderId, deliveryBoyId: deliveryBoy._id },
        { currentLat: lat, currentLng: lng }
      );

      // Broadcast to customer tracking WebSocket
      const wss = getWss();
      if (wss) {
        const trackingData = JSON.stringify({
          type: "location_update",
          orderId: deliveryBoy.currentOrderId.toString(),
          lat,
          lng,
          status: "on_the_way",
        });
        wss.clients.forEach((client) => {
          if (
            client.readyState === 1 &&
            client.orderId === deliveryBoy.currentOrderId.toString()
          ) {
            client.send(trackingData);
          }
        });
      }
    }

    res.json({ success: true, message: "Location updated" });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/delivery/pickup
const confirmPickup = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const deliveryBoy = await ensureDeliveryBoy(req.user._id);

    if (!deliveryBoy.currentOrderId || deliveryBoy.currentOrderId.toString() !== orderId) {
      return res.status(400).json({
        success: false,
        error: { code: "NOT_YOUR_ORDER", message: "This order is not assigned to you" },
      });
    }

    const tracking = await DeliveryTracking.findOne({
      orderId,
      deliveryBoyId: deliveryBoy._id,
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Tracking record not found" },
      });
    }

    if (tracking.status !== "assigned" && tracking.status !== "picking_up") {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_STATUS", message: `Cannot pick up order with status "${tracking.status}"` },
      });
    }

    tracking.status = "picked_up";
    tracking.pickedUpAt = new Date();
    await tracking.save();

    // Update order status
    await Order.findByIdAndUpdate(orderId, { status: "shipped" });

    // Broadcast status to customer
    broadcastTrackingUpdate(orderId, {
      type: "status_update",
      orderId,
      status: "picked_up",
      lat: deliveryBoy.currentLat,
      lng: deliveryBoy.currentLng,
    });

    res.json({
      success: true,
      message: "Order picked up",
      data: { status: "picked_up" },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/delivery/deliver
const confirmDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const deliveryBoy = await ensureDeliveryBoy(req.user._id);

    if (!deliveryBoy.currentOrderId || deliveryBoy.currentOrderId.toString() !== orderId) {
      return res.status(400).json({
        success: false,
        error: { code: "NOT_YOUR_ORDER", message: "This order is not assigned to you" },
      });
    }

    const tracking = await DeliveryTracking.findOne({
      orderId,
      deliveryBoyId: deliveryBoy._id,
    });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Tracking record not found" },
      });
    }

    if (tracking.status !== "picked_up" && tracking.status !== "on_the_way") {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_STATUS", message: "Order must be picked up before delivering" },
      });
    }

    // Mark tracking as delivered
    tracking.status = "delivered";
    tracking.deliveredAt = new Date();
    await tracking.save();

    // Update order status
    const order = await Order.findByIdAndUpdate(orderId, { status: "delivered" }, { new: true });

    // Update delivery boy stats
    const deliveryEarning = order.deliveryCharge || 30;
    deliveryBoy.currentOrderId = null;
    deliveryBoy.totalDeliveries += 1;
    deliveryBoy.totalEarnings += deliveryEarning;
    await deliveryBoy.save();

    // Broadcast delivered status to customer
    broadcastTrackingUpdate(orderId, {
      type: "status_update",
      orderId,
      status: "delivered",
    });

    res.json({
      success: true,
      message: "Order delivered successfully",
      data: { status: "delivered", earning: deliveryEarning },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/delivery/status
const getStatus = async (req, res, next) => {
  try {
    const deliveryBoy = await ensureDeliveryBoy(req.user._id);
    res.json({
      success: true,
      data: {
        isOnline: deliveryBoy.isOnline,
        hasActiveOrder: !!deliveryBoy.currentOrderId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Helper: broadcast tracking update to customer WebSocket
const broadcastTrackingUpdate = (orderId, data) => {
  const wss = getWss();
  if (!wss) return;
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1 && client.orderId === orderId.toString()) {
      client.send(message);
    }
  });
};

module.exports = {
  toggleStatus,
  getCurrentOrder,
  updateLocation,
  confirmPickup,
  confirmDelivery,
  getStatus,
};
