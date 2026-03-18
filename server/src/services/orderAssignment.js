const DeliveryBoy = require("../models/DeliveryBoy");
const DeliveryTracking = require("../models/DeliveryTracking");
const Order = require("../models/Order");
const { getWss } = require("../websocket/deliverySocket");

// Geocode address to lat/lng using OpenStreetMap Nominatim (free, no API key)
const geocodeAddress = async (address) => {
  const query = `${address.addressLine1}, ${address.city}, ${address.state}, ${address.pincode}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": "ecommerce-app/1.0" },
  });
  const data = await res.json();

  if (data.length > 0) {
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  }

  // Fallback: try with just city + state + pincode
  const fallbackQuery = `${address.city}, ${address.state}, ${address.pincode}`;
  const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fallbackQuery)}&format=json&limit=1`;

  const res2 = await fetch(fallbackUrl, {
    headers: { "User-Agent": "ecommerce-app/1.0" },
  });
  const data2 = await res2.json();

  if (data2.length > 0) {
    return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) };
  }

  return null;
};

// Get real driving duration (minutes) using OSRM (free, no API key)
const getDrivingETA = async (fromLat, fromLng, toLat, toLng) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=false`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === "Ok" && data.routes.length > 0) {
      const durationSeconds = data.routes[0].duration;
      return Math.max(10, Math.round(durationSeconds / 60)); // minutes, min 10
    }
  } catch (err) {
    console.error("OSRM API error:", err.message);
  }
  return null;
};

// Haversine fallback (returns km) — used only if OSRM fails
const getDistance = (lat1, lng1, lat2, lng2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
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

    // Find all online delivery boys with no active order (with or without GPS)
    const availableBoys = await DeliveryBoy.find({
      isOnline: true,
      currentOrderId: null,
    }).populate("userId", "name phone");

    if (availableBoys.length === 0) {
      console.log(`No available delivery boys for order ${orderId}`);
      return null;
    }

    // Split into boys with GPS and without
    const boysWithGPS = availableBoys.filter((b) => b.currentLat != null && b.currentLng != null);
    const boysWithoutGPS = availableBoys.filter((b) => b.currentLat == null || b.currentLng == null);

    let nearest;
    let deliveryCoords;

    if (boysWithGPS.length > 0) {
      // Geocode the customer's delivery address
      deliveryCoords = await geocodeAddress(order.deliveryAddress);
      if (!deliveryCoords) {
        console.log(`Could not geocode delivery address for order ${orderId}, using first available boy`);
        deliveryCoords = { lat: boysWithGPS[0].currentLat, lng: boysWithGPS[0].currentLng };
      }

      // Sort by distance to delivery address (nearest first)
      const sorted = boysWithGPS
        .map((boy) => ({
          boy,
          distance: getDistance(boy.currentLat, boy.currentLng, deliveryCoords.lat, deliveryCoords.lng),
        }))
        .sort((a, b) => a.distance - b.distance);

      nearest = sorted[0].boy;
    } else {
      // No boys have GPS yet — pick first available (no distance sorting)
      nearest = boysWithoutGPS[0];
      deliveryCoords = await geocodeAddress(order.deliveryAddress);
      console.log(`No delivery boys with GPS for order ${orderId}, assigning to first available: ${nearest.userId.name}`);
    }

    // Assign order to nearest delivery boy
    nearest.currentOrderId = orderId;
    await nearest.save();

    // Get ETA (default 30 mins if no GPS)
    const nearestHasGPS = nearest.currentLat != null && nearest.currentLng != null;
    let estimatedMinutes = 30;

    if (nearestHasGPS && deliveryCoords) {
      estimatedMinutes = await getDrivingETA(
        nearest.currentLat, nearest.currentLng,
        deliveryCoords.lat, deliveryCoords.lng
      );

      // Fallback to Haversine-based estimate if OSRM fails
      if (!estimatedMinutes) {
        const dist = getDistance(nearest.currentLat, nearest.currentLng, deliveryCoords.lat, deliveryCoords.lng);
        estimatedMinutes = Math.max(15, Math.round(dist * 3));
      }
    }

    // Cap at reasonable max (120 mins)
    estimatedMinutes = Math.min(estimatedMinutes, 120);

    const estimatedArrival = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    const tracking = await DeliveryTracking.create({
      orderId,
      deliveryBoyId: nearest._id,
      currentLat: nearest.currentLat,
      currentLng: nearest.currentLng,
      status: "assigned",
      estimatedArrival,
      deliveryLat: deliveryCoords.lat,
      deliveryLng: deliveryCoords.lng,
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
        estimatedMinutes,
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
      `Order ${orderId} assigned to ${nearest.userId.name} (${sorted[0].distance.toFixed(1)}km, ETA: ${estimatedMinutes} mins)`
    );

    return { deliveryBoy: nearest, tracking };
  } catch (error) {
    console.error("Order assignment failed:", error.message);
    return null;
  }
};

// Assign oldest unassigned order to a specific delivery boy (called when boy comes online or finishes a delivery)
const assignPendingOrders = async (deliveryBoyId) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId).populate("userId", "name phone");
    if (!deliveryBoy || !deliveryBoy.isOnline || deliveryBoy.currentOrderId) return null;

    // Find oldest unassigned order
    const pendingOrder = await Order.findOne({
      status: "ordered",
      deliveryBoyId: null,
    }).sort({ createdAt: 1 });

    if (!pendingOrder) return null;

    // Geocode the delivery address
    let deliveryCoords = await geocodeAddress(pendingOrder.deliveryAddress);
    const hasGPS = deliveryBoy.currentLat != null && deliveryBoy.currentLng != null;
    if (!deliveryCoords && hasGPS) {
      deliveryCoords = { lat: deliveryBoy.currentLat, lng: deliveryBoy.currentLng };
    }

    // Assign order to this delivery boy
    deliveryBoy.currentOrderId = pendingOrder._id;
    await deliveryBoy.save();

    // Get ETA (default 30 mins if no GPS available)
    let estimatedMinutes = 30;
    if (hasGPS && deliveryCoords) {
      estimatedMinutes = await getDrivingETA(
        deliveryBoy.currentLat, deliveryBoy.currentLng,
        deliveryCoords.lat, deliveryCoords.lng
      );

      if (!estimatedMinutes) {
        const distance = getDistance(deliveryBoy.currentLat, deliveryBoy.currentLng, deliveryCoords.lat, deliveryCoords.lng);
        estimatedMinutes = Math.max(15, Math.round(distance * 3));
      }
    }

    estimatedMinutes = Math.min(estimatedMinutes, 120);
    const estimatedArrival = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    const tracking = await DeliveryTracking.create({
      orderId: pendingOrder._id,
      deliveryBoyId: deliveryBoy._id,
      currentLat: deliveryBoy.currentLat,
      currentLng: deliveryBoy.currentLng,
      status: "assigned",
      estimatedArrival,
      deliveryLat: deliveryCoords.lat,
      deliveryLng: deliveryCoords.lng,
    });

    // Update order with delivery boy
    pendingOrder.deliveryBoyId = deliveryBoy.userId._id;
    pendingOrder.status = "ordered";
    await pendingOrder.save();

    // Notify delivery boy via WebSocket
    const wss = getWss();
    if (wss) {
      const assignment = JSON.stringify({
        type: "order_assigned",
        orderId: pendingOrder._id.toString(),
        deliveryAddress: pendingOrder.deliveryAddress,
        items: pendingOrder.items,
        paymentMethod: pendingOrder.paymentMethod,
        grandTotal: pendingOrder.grandTotal,
        estimatedArrival,
        estimatedMinutes,
      });

      wss.clients.forEach((client) => {
        if (
          client.readyState === 1 &&
          client.deliveryBoyUserId === deliveryBoy.userId._id.toString()
        ) {
          client.send(assignment);
        }
      });
    }

    console.log(
      `Pending order ${pendingOrder._id} assigned to ${deliveryBoy.userId.name} (ETA: ${estimatedMinutes} mins)`
    );

    return { deliveryBoy, tracking };
  } catch (error) {
    console.error("Pending order assignment failed:", error.message);
    return null;
  }
};

module.exports = { assignOrder, assignPendingOrders, getDrivingETA, geocodeAddress };
