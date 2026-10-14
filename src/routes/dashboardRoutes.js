const express = require("express");
const { getSummary } = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", protect, authorize("admin", "superadmin"), getSummary);

module.exports = router;
