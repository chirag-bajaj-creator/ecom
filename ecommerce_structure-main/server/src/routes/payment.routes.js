const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { processPayment, getPaymentDetails } = require("../controllers/payment.controller");

router.post("/process", authenticate, processPayment);
router.get("/:orderId", authenticate, getPaymentDetails);

module.exports = router;
