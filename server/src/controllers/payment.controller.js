const Payment = require("../models/Payment");
const Order = require("../models/Order");
const crypto = require("crypto");

// POST /api/v1/payments/process
const processPayment = async (req, res, next) => {
  try {
    const { orderId, method } = req.body;
    const userId = req.user._id;

    if (!["upi", "credit-debit", "cod"].includes(method)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_METHOD", message: "Invalid payment method" },
      });
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found" },
      });
    }

    if (order.paymentStatus === "success") {
      return res.status(400).json({
        success: false,
        error: { code: "ALREADY_PAID", message: "Order is already paid" },
      });
    }

    // Mock payment — always succeeds
    const transactionId =
      method === "cod" ? null : "TXN_" + crypto.randomBytes(8).toString("hex").toUpperCase();

    const payment = await Payment.create({
      orderId,
      userId,
      amount: order.grandTotal,
      method,
      status: method === "cod" ? "pending" : "success",
      transactionId,
      paidAt: method === "cod" ? null : new Date(),
    });

    // Update order payment status
    order.paymentStatus = method === "cod" ? "pending" : "success";
    order.paymentMethod = method;
    await order.save();

    res.json({
      success: true,
      message: method === "cod" ? "Cash on delivery confirmed" : "Payment successful",
      data: {
        payment: {
          _id: payment._id,
          transactionId: payment.transactionId,
          amount: payment.amount,
          method: payment.method,
          status: payment.status,
          paidAt: payment.paidAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/payments/:orderId
const getPaymentDetails = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({
      orderId: req.params.orderId,
      userId: req.user._id,
    }).lean();

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Payment not found" },
      });
    }

    res.json({ success: true, data: { payment } });
  } catch (error) {
    next(error);
  }
};

module.exports = { processPayment, getPaymentDetails };
