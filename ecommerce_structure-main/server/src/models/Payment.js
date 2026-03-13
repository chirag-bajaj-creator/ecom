const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["upi", "credit-debit", "cod"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "refunded"],
      default: "pending",
    },
    transactionId: { type: String, default: null },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
