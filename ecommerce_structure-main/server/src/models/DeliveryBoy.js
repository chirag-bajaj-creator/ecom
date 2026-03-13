const mongoose = require("mongoose");

const deliveryBoySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    isOnline: { type: Boolean, default: false },
    currentLat: { type: Number, default: null },
    currentLng: { type: Number, default: null },
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    lastActiveAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryBoy", deliveryBoySchema);
