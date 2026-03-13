const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  getOrders,
  getOrderDetail,
  cancelOrder,
  reorder,
  getOrderTracking,
} = require("../controllers/order.controller");

router.get("/", authenticate, getOrders);
router.get("/:orderId", authenticate, getOrderDetail);
router.get("/:orderId/tracking", authenticate, getOrderTracking);
router.post("/:orderId/cancel", authenticate, cancelOrder);
router.post("/:orderId/reorder", authenticate, reorder);

module.exports = router;
