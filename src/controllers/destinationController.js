const asyncHandler = require("express-async-handler");
const Destination = require("../models/Destination");
const cloudinary = require("../config/cloudinary");
const makeSlug = require("../utils/makeSlug");

const parseJSONField = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// @desc    Get all destinations
// @route   GET /api/destinations
// @access  Public
const getDestinations = asyncHandler(async (req, res) => {
  const destinations = await Destination.find().sort({ name: 1 });
  res.json({ success: true, count: destinations.length, data: destinations });
});

// @desc    Get one destination by slug or id
// @route   GET /api/destinations/:idOrSlug
// @access  Public
const getDestination = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const destination = await Destination.findOne({
    $or: [{ _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null }, { slug: idOrSlug }],
  });

  if (!destination) {
    res.status(404);
    throw new Error("Destination not found");
  }
  res.json({ success: true, data: destination });
});

// @desc    Create a destination
// @route   POST /api/destinations
// @access  Private/Admin+
const createDestination = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("An image is required");
  }

  const destination = await Destination.create({
    name: req.body.name,
    slug: req.body.slug ? makeSlug(req.body.slug) : makeSlug(req.body.name),
    tagline: req.body.tagline,
    region: req.body.region,
    bestTime: req.body.bestTime,
    wildlife: parseJSONField(req.body.wildlife, []),
    drive: req.body.drive || "",
    altitude: req.body.altitude || "",
    description: req.body.description,
    image: { url: req.file.path, publicId: req.file.filename },
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: destination });
});

// @desc    Update a destination
// @route   PUT /api/destinations/:id
// @access  Private/Admin+
const updateDestination = asyncHandler(async (req, res) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) {
    res.status(404);
    throw new Error("Destination not found");
  }

  const fields = ["name", "tagline", "region", "bestTime", "drive", "altitude", "description"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) destination[f] = req.body[f];
  });

  if (req.body.slug) destination.slug = makeSlug(req.body.slug);
  if (req.body.wildlife) destination.wildlife = parseJSONField(req.body.wildlife, destination.wildlife);

  if (req.file) {
    const oldPublicId = destination.image?.publicId;
    destination.image = { url: req.file.path, publicId: req.file.filename };
    if (oldPublicId) cloudinary.uploader.destroy(oldPublicId).catch(() => {});
  }

  await destination.save();
  res.json({ success: true, data: destination });
});

// @desc    Delete a destination
// @route   DELETE /api/destinations/:id
// @access  Private/Superadmin
const deleteDestination = asyncHandler(async (req, res) => {
  const destination = await Destination.findById(req.params.id);
  if (!destination) {
    res.status(404);
    throw new Error("Destination not found");
  }

  if (destination.image?.publicId) {
    cloudinary.uploader.destroy(destination.image.publicId).catch(() => {});
  }

  await destination.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = {
  getDestinations,
  getDestination,
  createDestination,
  updateDestination,
  deleteDestination,
};
