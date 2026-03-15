const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { validateCheckout } = require("../middleware/validate");
const { checkout, getCharges } = require("../controllers/checkout.controller");

router.post("/", authenticate, validateCheckout, checkout);
router.get("/charges", authenticate, getCharges);

module.exports = router;
