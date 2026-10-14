const express = require("express");
const {
  getTrips,
  getTrip,
  createTrip,
  updateTrip,
  deleteTrip,
} = require("../controllers/tripController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();
const uploadTripImage = upload("trips").single("image");

router
  .route("/")
  .get(getTrips) // public - powers the main site's trip listings
  .post(protect, authorize("admin", "superadmin"), uploadTripImage, createTrip);

router
  .route("/:id")
  .put(protect, authorize("admin", "superadmin"), uploadTripImage, updateTrip)
  .delete(protect, authorize("superadmin"), deleteTrip);

router.get("/:idOrSlug", getTrip); // public - single trip page

module.exports = router;
