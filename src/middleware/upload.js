const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Builds a multer instance that uploads straight to a given Cloudinary folder.
// Usage: upload("trips").single("image")  or  upload("gallery").array("images", 20)
const upload = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `loise-adventures/${folder}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 1920, height: 1920, crop: "limit", quality: "auto" }],
    },
  });

  return multer({
    storage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB per image
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Only image files are allowed"), false);
      }
    },
  });
};

module.exports = upload;
