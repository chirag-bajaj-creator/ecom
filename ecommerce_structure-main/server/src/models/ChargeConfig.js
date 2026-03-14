const mongoose = require('mongoose');

const auditEntrySchema = new mongoose.Schema({
  field: { type: String, required: true },
  oldValue: { type: Number, required: true },
  newValue: { type: Number, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  changedAt: { type: Date, default: Date.now }
}, { _id: false });

const chargeConfigSchema = new mongoose.Schema({
  deliveryCharge: { type: Number, default: 40 },
  freeDeliveryThreshold: { type: Number, default: 500 },
  surgeCharge: { type: Number, default: 0 },
  handlingCharge: { type: Number, default: 5 },
  auditLog: [auditEntrySchema]
}, { timestamps: true });

module.exports = mongoose.model('ChargeConfig', chargeConfigSchema);