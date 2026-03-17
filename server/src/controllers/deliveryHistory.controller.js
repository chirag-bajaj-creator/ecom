const DeliveryBoy = require("../models/DeliveryBoy");
const DeliveryTracking = require("../models/DeliveryTracking");
const Order = require("../models/Order");

// Helper: get date range for period
const getDateRange = (period) => {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
};

// GET /api/v1/delivery/history?period=today&page=1&limit=20
const getDeliveryHistory = async (req, res, next) => {
  try {
    const deliveryBoy = await DeliveryBoy.findOne({ userId: req.user._id });
    if (!deliveryBoy) {
      return res.json({ success: true, data: { deliveries: [], pagination: { page: 1, totalPages: 0, total: 0 } } });
    }

    const period = req.query.period || "today";
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const { start, end } = getDateRange(period);

    const filter = {
      deliveryBoyId: deliveryBoy._id,
      status: "delivered",
      deliveredAt: { $gte: start, $lte: end },
    };

    const [trackings, total] = await Promise.all([
      DeliveryTracking.find(filter)
        .sort({ deliveredAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DeliveryTracking.countDocuments(filter),
    ]);

    // Fetch order details for each tracking
    const deliveries = await Promise.all(
      trackings.map(async (t) => {
        const order = await Order.findById(t.orderId)
          .select("items deliveryAddress grandTotal deliveryCharge createdAt")
          .lean();

        const earning = order ? (order.deliveryCharge || 30) : 30;

        return {
          orderId: t.orderId,
          customerName: order?.deliveryAddress?.name || "Customer",
          deliveryLocation: order
            ? `${order.deliveryAddress.city}, ${order.deliveryAddress.state}`
            : "",
          itemCount: order?.items?.length || 0,
          totalAmount: order?.grandTotal || 0,
          earning,
          pickedUpAt: t.pickedUpAt,
          deliveredAt: t.deliveredAt,
          status: t.status,
          adminReviewStatus: t.adminReviewStatus || "auto_approved",
          earningsCredited: t.earningsCredited !== false,
        };
      })
    );

    res.json({
      success: true,
      data: {
        deliveries,
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

// GET /api/v1/delivery/earnings
const getEarnings = async (req, res, next) => {
  try {
    const deliveryBoy = await DeliveryBoy.findOne({ userId: req.user._id });
    if (!deliveryBoy) {
      return res.json({
        success: true,
        data: {
          totalEarnings: 0, totalDeliveries: 0,
          earningsToday: 0, deliveriesToday: 0,
          earningsThisWeek: 0, deliveriesThisWeek: 0,
          earningsThisMonth: 0, deliveriesThisMonth: 0,
        },
      });
    }

    const now = new Date();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setMonth(now.getMonth() - 1);
    monthStart.setHours(0, 0, 0, 0);

    const baseFilter = { deliveryBoyId: deliveryBoy._id, status: "delivered" };

    const [todayTrackings, weekTrackings, monthTrackings] = await Promise.all([
      DeliveryTracking.find({ ...baseFilter, deliveredAt: { $gte: todayStart } }).lean(),
      DeliveryTracking.find({ ...baseFilter, deliveredAt: { $gte: weekStart } }).lean(),
      DeliveryTracking.find({ ...baseFilter, deliveredAt: { $gte: monthStart } }).lean(),
    ]);

    // Calculate earnings from orders (only count credited earnings)
    const calcEarnings = async (trackings) => {
      let total = 0;
      for (const t of trackings) {
        if (t.earningsCredited === false) continue;
        const order = await Order.findById(t.orderId).select("deliveryCharge").lean();
        total += order?.deliveryCharge || 30;
      }
      return total;
    };

    const [earningsToday, earningsThisWeek, earningsThisMonth] = await Promise.all([
      calcEarnings(todayTrackings),
      calcEarnings(weekTrackings),
      calcEarnings(monthTrackings),
    ]);

    res.json({
      success: true,
      data: {
        totalEarnings: deliveryBoy.totalEarnings,
        totalDeliveries: deliveryBoy.totalDeliveries,
        earningsToday,
        deliveriesToday: todayTrackings.length,
        earningsThisWeek,
        deliveriesThisWeek: weekTrackings.length,
        earningsThisMonth,
        deliveriesThisMonth: monthTrackings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDeliveryHistory, getEarnings };
