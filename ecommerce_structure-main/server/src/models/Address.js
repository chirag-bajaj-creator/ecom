const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^\d{10}$/.test(v),
        message: "Phone must be exactly 10 digits",
      },
    },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^\d{6}$/.test(v),
        message: "Pincode must be exactly 6 digits",
      },
    },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Address", addressSchema);
