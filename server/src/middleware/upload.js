const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

// Memory storage (for profile pics, etc.)
const memoryStorage = multer.memoryStorage();

// Disk storage for product images (bulk upload)
const productDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/products"));
  },
  filename: (req, file, cb) => {
    // Keep original name but add unique prefix to avoid overwrites
    const uniquePrefix = crypto.randomBytes(6).toString("hex");
    cb(null, `${uniquePrefix}_${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Accept by MIME type or by file extension (some mobile browsers send wrong MIME)
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif", "image/bmp"];
  const allowedExts = /\.(jpg|jpeg|png|webp|heic|heif|gif|bmp)$/i;

  if (file.mimetype.startsWith("image/") || allowedMimes.includes(file.mimetype) || allowedExts.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

// Default upload (memory storage)
const upload = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Product image upload (disk storage, max 50 files)
const productImageUpload = multer({
  storage: productDiskStorage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 },
});

module.exports = { upload, productImageUpload };
