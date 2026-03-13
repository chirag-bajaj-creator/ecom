const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authenticate } = require("../middleware/auth");
const {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} = require("../controllers/profile.controller");

// Multer config for profile picture upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile_${req.user._id}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only jpg and png images are allowed"));
    }
  },
});

// Profile
router.get("/", authenticate, getProfile);
router.patch("/", authenticate, updateProfile);
router.post("/picture", authenticate, upload.single("profilePicture"), uploadProfilePicture);
router.post("/change-password", authenticate, changePassword);

// Addresses
router.get("/addresses", authenticate, getAddresses);
router.post("/addresses", authenticate, addAddress);
router.patch("/addresses/:addressId", authenticate, updateAddress);
router.delete("/addresses/:addressId", authenticate, deleteAddress);
router.patch("/addresses/:addressId/default", authenticate, setDefaultAddress);

module.exports = router;
