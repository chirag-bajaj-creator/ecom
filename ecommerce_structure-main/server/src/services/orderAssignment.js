const DeliveryBoy = require("../models/DeliveryBoy");
const DeliveryTracking = require("../models/DeliveryTracking");
const Order = require("../models/Order");
const { getWss } = require("../websocket/deliverySocket");

// Calculate distance between two GPS points (Haversine formula, returns km)
const getDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

// Assign order to nearest available delivery boy
const assignOrder = async (orderId) => {
  try {
    const order = await Order.findById(orderId);
    if (!order) return null;

    // Find all online delivery boys with no active order
    const availableBoys = await DeliveryBoy.find({
      isOnline: true,
      currentOrderId: null,
      currentLat: { $ne: null },
      currentLng: { $ne: null },
    }).populate("userId", "name phone");

    if (availableBoys.length === 0) {
      console.log(`No available delivery boys for order ${orderId}`);
      return null;
    }

    // Use a default pickup location (warehouse/store)
    // In production this would come from the product/seller data
    const pickupLat = 28.6139; // Default: Delhi
    const pickupLng = 77.209;

    // Sort by distance to pickup location (nearest first)
    const sorted = availableBoys
      .map((boy) => ({
        boy,
        distance: getDistance(boy.currentLat, boy.currentLng, pickupLat, pickupLng),
      }))
      .sort((a, b) => a.distance - b.distance);

    const nearest = sorted[0].boy;

    // Assign order to nearest delivery boy
    nearest.currentOrderId = orderId;
    await nearest.save();

    // Create tracking record
    const estimatedMinutes = Math.max(15, Math.round(sorted[0].distance * 5));
    const estimatedArrival = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    const tracking = await DeliveryTracking.create({
      orderId,
      deliveryBoyId: nearest._id,
      currentLat: nearest.currentLat,
      currentLng: nearest.currentLng,
      status: "assigned",
      estimatedArrival,
    });

    // Update order with delivery boy
    order.deliveryBoyId = nearest.userId._id;
    order.status = "ordered";
    await order.save();

    // Notify delivery boy via WebSocket
    const wss = getWss();
    if (wss) {
      const assignment = JSON.stringify({
        type: "order_assigned",
        orderId: order._id.toString(),
        deliveryAddress: order.deliveryAddress,
        items: order.items,
        paymentMethod: order.paymentMethod,
        grandTotal: order.grandTotal,
        estimatedArrival,
      });

      wss.clients.forEach((client) => {
        if (
          client.readyState === 1 &&
          client.deliveryBoyUserId === nearest.userId._id.toString()
        ) {
          client.send(assignment);
        }
      });
    }

    console.log(
      `Order ${orderId} assigned to delivery boy ${nearest.userId.name} (${sorted[0].distance.toFixed(1)}km away)`
    );

    return { deliveryBoy: nearest, tracking };
  } catch (error) {
    console.error("Order assignment failed:", error.message);
    return null;
  }
};

module.exports = { assignOrder };
