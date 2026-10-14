const asyncHandler = require("express-async-handler");
const Inquiry = require("../models/Inquiry");
const Trip = require("../models/Trip");

// @desc    Submit an inquiry (from the public site's contact/booking form)
// @route   POST /api/inquiries
// @access  Public
const createInquiry = asyncHandler(async (req, res) => {
  const { name, email, phone, tripId, message } = req.body;

  if (!name || !email || !message) {
    res.status(400);
    throw new Error("Name, email and message are required");
  }

  let tripName = "";
  let tripInterested = null;
  if (tripId) {
    const trip = await Trip.findById(tripId).select("name");
    if (trip) {
      tripInterested = trip._id;
      tripName = trip.name;
    }
  }

  const inquiry = await Inquiry.create({
    name,
    email,
    phone: phone || "",
    tripInterested,
    tripName,
    message,
  });

  res.status(201).json({ success: true, data: inquiry });
});

// @desc    Get all inquiries (supports ?status=)
// @route   GET /api/inquiries
// @access  Private/Admin+
const getInquiries = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const inquiries = await Inquiry.find(filter)
    .populate("tripInterested", "name slug")
    .sort({ createdAt: -1 });

  res.json({ success: true, count: inquiries.length, data: inquiries });
});

// @desc    Get one inquiry
// @route   GET /api/inquiries/:id
// @access  Private/Admin+
const getInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id).populate("tripInterested", "name slug");
  if (!inquiry) {
    res.status(404);
    throw new Error("Inquiry not found");
  }
  res.json({ success: true, data: inquiry });
});

// @desc    Update inquiry status/notes
// @route   PUT /api/inquiries/:id
// @access  Private/Admin+
const updateInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    res.status(404);
    throw new Error("Inquiry not found");
  }

  if (req.body.status) inquiry.status = req.body.status;
  if (req.body.notes !== undefined) inquiry.notes = req.body.notes;

  await inquiry.save();
  res.json({ success: true, data: inquiry });
});

// @desc    Delete an inquiry
// @route   DELETE /api/inquiries/:id
// @access  Private/Superadmin
const deleteInquiry = asyncHandler(async (req, res) => {
  const inquiry = await Inquiry.findById(req.params.id);
  if (!inquiry) {
    res.status(404);
    throw new Error("Inquiry not found");
  }
  await inquiry.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = { createInquiry, getInquiries, getInquiry, updateInquiry, deleteInquiry };
