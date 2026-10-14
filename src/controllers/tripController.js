const asyncHandler = require("express-async-handler");
const Trip = require("../models/Trip");
const cloudinary = require("../config/cloudinary");
const makeSlug = require("../utils/makeSlug");

// Body fields that arrive as JSON strings when sent via multipart/form-data
// (category, highlights, destinations, duration, groupSize, price, itinerary, included, excluded)
const parseJSONField = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// @desc    Get all trips (supports ?type=kenyan-safari|international-tour, ?status=, ?search=)
// @route   GET /api/trips
// @access  Public
const getTrips = asyncHandler(async (req, res) => {
  const { type, status, search } = req.query;
  const filter = {};

  if (type) filter.tripType = type;
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: "i" };

  const trips = await Trip.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: trips.length, data: trips });
});

// @desc    Get single trip by slug or id
// @route   GET /api/trips/:idOrSlug
// @access  Public
const getTrip = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const trip = await Trip.findOne({
    $or: [{ _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null }, { slug: idOrSlug }],
  });

  if (!trip) {
    res.status(404);
    throw new Error("Trip not found");
  }
  res.json({ success: true, data: trip });
});

// @desc    Create a trip (cover image uploaded as "image")
// @route   POST /api/trips
// @access  Private/Admin+
const createTrip = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("A cover image is required");
  }

  const duration = parseJSONField(req.body.duration, {});
  const groupSize = parseJSONField(req.body.groupSize, { noLimit: true });
  const price = parseJSONField(req.body.price, {});

  const trip = await Trip.create({
    tripType: req.body.tripType,
    name: req.body.name,
    slug: req.body.slug ? makeSlug(req.body.slug) : makeSlug(req.body.name),
    category: parseJSONField(req.body.category, []),
    highlights: parseJSONField(req.body.highlights, []),
    destinations: parseJSONField(req.body.destinations, []),
    duration: { days: duration.days, nights: duration.nights },
    groupSize: {
      noLimit: !!groupSize.noLimit,
      min: groupSize.noLimit ? null : groupSize.min,
      max: groupSize.noLimit ? null : groupSize.max,
    },
    price: {
      amount: price.amount,
      currency: req.body.tripType === "kenyan-safari" ? "USD" : price.currency || "KES",
    },
    description: req.body.description,
    overview: req.body.overview,
    image: { url: req.file.path, publicId: req.file.filename },
    itinerary: parseJSONField(req.body.itinerary, []),
    included: parseJSONField(req.body.included, []),
    excluded: parseJSONField(req.body.excluded, []),
    note: req.body.note || "",
    status: req.body.status === "published" ? "published" : "draft",
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: trip });
});

// @desc    Update a trip (new cover image optional)
// @route   PUT /api/trips/:id
// @access  Private/Admin+
const updateTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    res.status(404);
    throw new Error("Trip not found");
  }

  const fields = [
    "tripType",
    "name",
    "description",
    "overview",
    "note",
    "status",
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) trip[f] = req.body[f];
  });

  if (req.body.slug) trip.slug = makeSlug(req.body.slug);
  if (req.body.category) trip.category = parseJSONField(req.body.category, trip.category);
  if (req.body.highlights) trip.highlights = parseJSONField(req.body.highlights, trip.highlights);
  if (req.body.destinations) trip.destinations = parseJSONField(req.body.destinations, trip.destinations);
  if (req.body.itinerary) trip.itinerary = parseJSONField(req.body.itinerary, trip.itinerary);
  if (req.body.included) trip.included = parseJSONField(req.body.included, trip.included);
  if (req.body.excluded) trip.excluded = parseJSONField(req.body.excluded, trip.excluded);

  if (req.body.duration) {
    const duration = parseJSONField(req.body.duration, trip.duration);
    trip.duration = { days: duration.days, nights: duration.nights };
  }

  if (req.body.groupSize) {
    const groupSize = parseJSONField(req.body.groupSize, trip.groupSize);
    trip.groupSize = {
      noLimit: !!groupSize.noLimit,
      min: groupSize.noLimit ? null : groupSize.min,
      max: groupSize.noLimit ? null : groupSize.max,
    };
  }

  if (req.body.price) {
    const price = parseJSONField(req.body.price, trip.price);
    trip.price = {
      amount: price.amount,
      currency: trip.tripType === "kenyan-safari" ? "USD" : price.currency || "KES",
    };
  }

  // If a new cover image was uploaded, replace it and remove the old one from Cloudinary
  if (req.file) {
    const oldPublicId = trip.image?.publicId;
    trip.image = { url: req.file.path, publicId: req.file.filename };
    if (oldPublicId) {
      cloudinary.uploader.destroy(oldPublicId).catch(() => {});
    }
  }

  await trip.save();
  res.json({ success: true, data: trip });
});

// @desc    Delete a trip
// @route   DELETE /api/trips/:id
// @access  Private/Superadmin
const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    res.status(404);
    throw new Error("Trip not found");
  }

  if (trip.image?.publicId) {
    cloudinary.uploader.destroy(trip.image.publicId).catch(() => {});
  }

  await trip.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = { getTrips, getTrip, createTrip, updateTrip, deleteTrip };
