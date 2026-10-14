const express = require("express");
const {
  getGalleryImages,
  uploadGalleryImages,
  updateGalleryImage,
  deleteGalleryImage,
} = require("../controllers/galleryController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();
const uploadImages = upload("gallery").array("images", 20);

router
  .route("/")
  .get(getGalleryImages)
  .post(protect, authorize("admin", "superadmin"), uploadImages, uploadGalleryImages);

router
  .route("/:id")
  .put(protect, authorize("admin", "superadmin"), updateGalleryImage)
  .delete(protect, authorize("superadmin"), deleteGalleryImage);

module.exports = router;
