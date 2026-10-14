const express = require("express");
const {
  getDestinations,
  getDestination,
  createDestination,
  updateDestination,
  deleteDestination,
} = require("../controllers/destinationController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();
const uploadDestinationImage = upload("destinations").single("image");

router
  .route("/")
  .get(getDestinations)
  .post(protect, authorize("admin", "superadmin"), uploadDestinationImage, createDestination);

router
  .route("/:id")
  .put(protect, authorize("admin", "superadmin"), uploadDestinationImage, updateDestination)
  .delete(protect, authorize("superadmin"), deleteDestination);

router.get("/:idOrSlug", getDestination);

module.exports = router;
