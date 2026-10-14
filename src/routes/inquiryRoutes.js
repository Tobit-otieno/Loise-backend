const express = require("express");
const {
  createInquiry,
  getInquiries,
  getInquiry,
  updateInquiry,
  deleteInquiry,
} = require("../controllers/inquiryController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router
  .route("/")
  .post(createInquiry) // public - submitted from the main site's contact/booking form
  .get(protect, authorize("admin", "superadmin"), getInquiries);

router
  .route("/:id")
  .get(protect, authorize("admin", "superadmin"), getInquiry)
  .put(protect, authorize("admin", "superadmin"), updateInquiry)
  .delete(protect, authorize("superadmin"), deleteInquiry);

module.exports = router;
