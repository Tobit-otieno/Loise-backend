const express = require("express");
const { getAdmins, createAdmin, updateAdmin, deleteAdmin } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Everything here is Super Admin only
router.use(protect, authorize("superadmin"));

router.route("/").get(getAdmins).post(createAdmin);
router.route("/:id").put(updateAdmin).delete(deleteAdmin);

module.exports = router;
