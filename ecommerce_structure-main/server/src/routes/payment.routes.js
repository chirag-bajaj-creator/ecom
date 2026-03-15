const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { validatePayment, validateObjectId } = require("../middleware/validate");
const { processPayment, getPaymentDetails } = require("../controllers/payment.controller");

router.post("/process", authenticate, validatePayment, processPayment);
router.get("/:orderId", authenticate, validateObjectId('orderId'), getPaymentDetails);

module.exports = router;
