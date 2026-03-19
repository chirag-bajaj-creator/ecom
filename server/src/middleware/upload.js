const multer = require("multer");

const storage = multer.memoryStorage();

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

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB (mobile cameras take large photos)
});

module.exports = upload;
