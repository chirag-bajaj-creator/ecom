const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { validateObjectId } = require("../middleware/validate");
const {
  getOrders,
  getOrderDetail,
  cancelOrder,
  reorder,
  getOrderTracking,
} = require("../controllers/order.controller");

router.get("/", authenticate, getOrders);
router.get("/:orderId", authenticate, validateObjectId('orderId'), getOrderDetail);
router.get("/:orderId/tracking", authenticate, validateObjectId('orderId'), getOrderTracking);
router.post("/:orderId/cancel", authenticate, validateObjectId('orderId'), cancelOrder);
router.post("/:orderId/reorder", authenticate, validateObjectId('orderId'), reorder);

module.exports = router;
