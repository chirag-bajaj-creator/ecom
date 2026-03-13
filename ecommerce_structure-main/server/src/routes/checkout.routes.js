const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { checkout, getCharges } = require("../controllers/checkout.controller");

router.post("/", authenticate, checkout);
router.get("/charges", authenticate, getCharges);

module.exports = router;
