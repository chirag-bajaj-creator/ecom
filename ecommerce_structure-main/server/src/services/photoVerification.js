const cloudinary = require("cloudinary").v2;
const sharp = require("sharp");

const VERIFICATION_THRESHOLD = 70; // % similarity to auto-verify
const HASH_SIZE = 16; // 16x16 = 256-bit perceptual hash

// Configure Cloudinary lazily (called before first upload)
let cloudinaryConfigured = false;
const ensureCloudinaryConfig = () => {
  if (!cloudinaryConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinaryConfigured = true;
  }
};

// Upload photo buffer to Cloudinary
const uploadPhoto = (fileBuffer, folder) => {
  ensureCloudinaryConfig();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `delivery-verification/${folder}`,
        resource_type: "image",
        transformation: [{ width: 800, height: 800, crop: "limit", quality: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

// Download image and generate perceptual hash (dHash)
const getImageHash = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to download image: ${response.statusText}`);
  const arrayBuffer = await response.arrayBuffer();

  // Resize to (HASH_SIZE+1) x HASH_SIZE grayscale for difference hash
  const { data } = await sharp(Buffer.from(arrayBuffer))
    .resize(HASH_SIZE + 1, HASH_SIZE, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Build difference hash: compare each pixel to its right neighbor
  const hash = [];
  for (let y = 0; y < HASH_SIZE; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      const left = data[y * (HASH_SIZE + 1) + x];
      const right = data[y * (HASH_SIZE + 1) + x + 1];
      hash.push(left > right ? 1 : 0);
    }
  }

  return hash;
};

// Compare two perceptual hashes using Hamming distance
const compareHashes = (hash1, hash2) => {
  let matching = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] === hash2[i]) matching++;
  }
  return Math.round((matching / hash1.length) * 10000) / 100;
};

// Compare two photos and return similarity score
const comparePhotos = async (pickupPhotoUrl, deliveryPhotoUrl) => {
  const [pickupHash, deliveryHash] = await Promise.all([
    getImageHash(pickupPhotoUrl),
    getImageHash(deliveryPhotoUrl),
  ]);

  const similarity = compareHashes(pickupHash, deliveryHash);

  return {
    similarity,
    verified: similarity >= VERIFICATION_THRESHOLD,
  };
};

module.exports = { uploadPhoto, comparePhotos, VERIFICATION_THRESHOLD };
