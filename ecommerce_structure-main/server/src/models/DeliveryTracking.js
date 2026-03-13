const mongoose = require("mongoose");

const deliveryTrackingSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    deliveryBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DeliveryBoy",
      required: true,
      index: true,
    },
    currentLat: { type: Number, default: null },
    currentLng: { type: Number, default: null },
    status: {
      type: String,
      enum: ["assigned", "picking_up", "picked_up", "on_the_way", "delivered"],
      default: "assigned",
    },
    estimatedArrival: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryTracking", deliveryTrackingSchema);
