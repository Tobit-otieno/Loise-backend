const express = require("express");
const {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} = require("../controllers/journalController");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();
const uploadJournalImage = upload("journal").single("image");

router
  .route("/")
  .get(getJournalEntries)
  .post(protect, authorize("admin", "superadmin"), uploadJournalImage, createJournalEntry);

router
  .route("/:id")
  .put(protect, authorize("admin", "superadmin"), uploadJournalImage, updateJournalEntry)
  .delete(protect, authorize("superadmin"), deleteJournalEntry);

router.get("/:idOrSlug", getJournalEntry);

module.exports = router;
