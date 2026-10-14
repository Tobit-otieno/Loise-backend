const asyncHandler = require("express-async-handler");
const Trip = require("../models/Trip");
const Destination = require("../models/Destination");
const GalleryImage = require("../models/GalleryImage");
const Inquiry = require("../models/Inquiry");
const Journal = require("../models/Journal");

// @desc    Quick stats + recent inquiries for the dashboard overview page
// @route   GET /api/dashboard/summary
// @access  Private/Admin+
const getSummary = asyncHandler(async (req, res) => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalTrips,
    totalDestinations,
    totalGalleryImages,
    totalJournalEntries,
    newInquiriesThisWeek,
    recentInquiries,
  ] = await Promise.all([
    Trip.countDocuments(),
    Destination.countDocuments(),
    GalleryImage.countDocuments(),
    Journal.countDocuments(),
    Inquiry.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
    Inquiry.find().sort({ createdAt: -1 }).limit(5),
  ]);

  res.json({
    success: true,
    data: {
      totalTrips,
      totalDestinations,
      totalGalleryImages,
      totalJournalEntries,
      newInquiriesThisWeek,
      recentInquiries,
    },
  });
});

module.exports = { getSummary };
