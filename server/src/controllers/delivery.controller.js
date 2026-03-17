const DeliveryBoy = require("../models/DeliveryBoy");
const DeliveryTracking = require("../models/DeliveryTracking");
const Order = require("../models/Order");
const { getWss } = require("../websocket/deliverySocket");
const { getDrivingETA, assignPendingOrders } = require("../services/orderAssignment");
const { uploadPhoto, comparePhotos } = require("../services/photoVerification");
const User = require("../models/User");

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

    // If coming online and no active order, check for pending unassigned orders
    if (isOnline && !deliveryBoy.currentOrderId) {
      assignPendingOrders(deliveryBoy._id).catch((err) =>
        console.error("Pending order assignment error:", err.message)
      );
    }

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

    // If online with no active order, check for pending unassigned orders
    if (deliveryBoy.isOnline && !deliveryBoy.currentOrderId) {
      assignPendingOrders(deliveryBoy._id).catch((err) =>
        console.error("Pending order assignment error:", err.message)
      );
    }

    // Update tracking record if active order + recalculate live ETA
    if (deliveryBoy.currentOrderId) {
      const tracking = await DeliveryTracking.findOne({
        orderId: deliveryBoy.currentOrderId,
        deliveryBoyId: deliveryBoy._id,
      });

      if (tracking) {
        tracking.currentLat = lat;
        tracking.currentLng = lng;

        // Recalculate ETA using OSRM if delivery coordinates exist
        if (tracking.deliveryLat && tracking.deliveryLng) {
          const newETA = await getDrivingETA(lat, lng, tracking.deliveryLat, tracking.deliveryLng);
          if (newETA) {
            tracking.estimatedArrival = new Date(Date.now() + Math.min(newETA, 120) * 60 * 1000);
          }
        }

        await tracking.save();
      }

      // Broadcast to customer tracking WebSocket with live ETA
      const wss = getWss();
      if (wss) {
        const trackingData = JSON.stringify({
          type: "location_update",
          orderId: deliveryBoy.currentOrderId.toString(),
          lat,
          lng,
          status: "on_the_way",
          estimatedArrival: tracking ? tracking.estimatedArrival : null,
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

// POST /api/v1/delivery/pickup (multipart: photo + orderId)
const confirmPickup = async (req, res, next) => {
  console.log("CLOUDINARY:", process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY ? "KEY_SET" : "KEY_MISSING", process.env.CLOUDINARY_API_SECRET ? "SECRET_SET" : "SECRET_MISSING");
  try {
    const { orderId } = req.body;
    const deliveryBoy = await ensureDeliveryBoy(req.user._id);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: "PHOTO_REQUIRED", message: "Pickup photo is required" },
      });
    }

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

    // Upload pickup photo to Cloudinary
    const pickupPhotoUrl = await uploadPhoto(req.file.buffer, `pickup/${orderId}`);

    tracking.status = "picked_up";
    tracking.pickedUpAt = new Date();
    tracking.pickupPhotoUrl = pickupPhotoUrl;
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
      message: "Order picked up — photo captured",
      data: { status: "picked_up", pickupPhotoUrl },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/delivery/deliver (multipart: photo + orderId)
const confirmDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const deliveryBoy = await ensureDeliveryBoy(req.user._id);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: "PHOTO_REQUIRED", message: "Delivery photo is required" },
      });
    }

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

    if (!tracking.pickupPhotoUrl) {
      return res.status(400).json({
        success: false,
        error: { code: "NO_PICKUP_PHOTO", message: "Pickup photo is missing — cannot verify delivery" },
      });
    }

    // Upload delivery photo to Cloudinary
    const deliveryPhotoUrl = await uploadPhoto(req.file.buffer, `delivery/${orderId}`);

    // Auto-verify: compare pickup vs delivery photos
    let verification = { similarity: 0, verified: false };
    try {
      verification = await comparePhotos(tracking.pickupPhotoUrl, deliveryPhotoUrl);
    } catch (err) {
      console.error("Photo verification failed, flagging for manual review:", err.message);
    }

    // Mark tracking as delivered with verification data
    tracking.status = "delivered";
    tracking.deliveredAt = new Date();
    tracking.deliveryPhotoUrl = deliveryPhotoUrl;
    tracking.photoVerified = verification.verified;
    tracking.verificationScore = verification.similarity;
    tracking.verifiedAt = new Date();
    tracking.adminReviewStatus = verification.verified ? "auto_approved" : "pending_review";
    tracking.earningsCredited = verification.verified;
    await tracking.save();

    // Update order status
    const order = await Order.findByIdAndUpdate(orderId, { status: "delivered" }, { new: true });

    // Only credit earnings if auto-verified, otherwise hold for admin review
    const deliveryEarning = order.deliveryCharge || 30;
    deliveryBoy.currentOrderId = null;
    deliveryBoy.totalDeliveries += 1;
    if (verification.verified) {
      deliveryBoy.totalEarnings += deliveryEarning;
    }
    await deliveryBoy.save();

    // Get delivery boy name for admin notification
    const deliveryUser = await User.findById(deliveryBoy.userId).select("name").lean();
    const deliveryBoyName = deliveryUser ? deliveryUser.name : "Unknown";

    // Notify admin via WebSocket about verification result
    const wss = getWss();
    if (wss) {
      const adminNotification = JSON.stringify({
        type: "photo_verification_result",
        orderId,
        deliveryBoyId: deliveryBoy._id.toString(),
        deliveryBoyName,
        pickupPhotoUrl: tracking.pickupPhotoUrl,
        deliveryPhotoUrl,
        verificationScore: verification.similarity,
        photoVerified: verification.verified,
        message: verification.verified
          ? `Order #${orderId} verified (${verification.similarity}% match) — Delivery by ${deliveryBoyName}`
          : `Order #${orderId} NEEDS REVIEW (${verification.similarity}% match) — Delivery by ${deliveryBoyName}`,
      });

      wss.clients.forEach((client) => {
        if (client.readyState === 1 && client.role === "admin") {
          client.send(adminNotification);
        }
      });

      // If flagged, notify delivery boy that earning is in pipeline
      if (!verification.verified) {
        const deliveryNotification = JSON.stringify({
          type: "earning_pipeline",
          orderId,
          message: "Earning in pipeline — under review. You will be notified once reviewed.",
        });
        wss.clients.forEach((client) => {
          if (client.readyState === 1 && client.deliveryBoyUserId === deliveryBoy.userId.toString()) {
            client.send(deliveryNotification);
          }
        });
      }
    }

    // Broadcast delivered status to customer
    broadcastTrackingUpdate(orderId, {
      type: "status_update",
      orderId,
      status: "delivered",
    });

    // Delivery boy is now free — check for pending unassigned orders
    assignPendingOrders(deliveryBoy._id).catch((err) =>
      console.error("Pending order assignment error:", err.message)
    );

    res.json({
      success: true,
      message: verification.verified
        ? "Order delivered & verified successfully"
        : "Order delivered — flagged for manual review",
      data: {
        status: "delivered",
        earning: deliveryEarning,
        photoVerified: verification.verified,
        verificationScore: verification.similarity,
      },
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
