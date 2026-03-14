const express = require("express");
const router = express.Router();
const { authenticate, requireRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  toggleStatus,
  getCurrentOrder,
  updateLocation,
  confirmPickup,
  confirmDelivery,
  getStatus,
} = require("../controllers/delivery.controller");
const {
  getDeliveryHistory,
  getEarnings,
} = require("../controllers/deliveryHistory.controller");

// All routes require auth + delivery role
router.use(authenticate, requireRole("delivery"));

// Status
router.get("/status", getStatus);
router.patch("/status", toggleStatus);

// Current order
router.get("/current-order", getCurrentOrder);

// Location
router.post("/location", updateLocation);

// Pickup & Deliver (multipart — expects "photo" field)
router.post("/pickup", upload.single("photo"), confirmPickup);
router.post("/deliver", upload.single("photo"), confirmDelivery);

// History & Earnings
router.get("/history", getDeliveryHistory);
router.get("/earnings", getEarnings);

module.exports = router;
