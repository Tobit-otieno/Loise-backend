const asyncHandler = require("express-async-handler");
const GalleryImage = require("../models/GalleryImage");
const cloudinary = require("../config/cloudinary");

// @desc    Get all gallery images (supports ?category=)
// @route   GET /api/gallery
// @access  Public
const getGalleryImages = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;

  const images = await GalleryImage.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: images.length, data: images });
});

// @desc    Upload one or more images with descriptions
//          Send as multipart/form-data: files under "images" (array),
//          plus a JSON string "descriptions" = ["desc for file 1", "desc for file 2", ...]
//          in the same order as the uploaded files, and optional "category".
// @route   POST /api/gallery
// @access  Private/Admin+
const uploadGalleryImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error("At least one image is required");
  }

  let descriptions = [];
  try {
    descriptions = JSON.parse(req.body.descriptions || "[]");
  } catch {
    descriptions = [];
  }

  const docs = req.files.map((file, i) => ({
    url: file.path,
    publicId: file.filename,
    description: descriptions[i] || req.body.description || "",
    category: req.body.category || "General",
    uploadedBy: req.user._id,
  }));

  const created = await GalleryImage.insertMany(docs);
  res.status(201).json({ success: true, count: created.length, data: created });
});

// @desc    Update an image's description/category
// @route   PUT /api/gallery/:id
// @access  Private/Admin+
const updateGalleryImage = asyncHandler(async (req, res) => {
  const image = await GalleryImage.findById(req.params.id);
  if (!image) {
    res.status(404);
    throw new Error("Image not found");
  }

  if (req.body.description !== undefined) image.description = req.body.description;
  if (req.body.category !== undefined) image.category = req.body.category;

  await image.save();
  res.json({ success: true, data: image });
});

// @desc    Delete a gallery image
// @route   DELETE /api/gallery/:id
// @access  Private/Superadmin
const deleteGalleryImage = asyncHandler(async (req, res) => {
  const image = await GalleryImage.findById(req.params.id);
  if (!image) {
    res.status(404);
    throw new Error("Image not found");
  }

  await cloudinary.uploader.destroy(image.publicId).catch(() => {});
  await image.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = { getGalleryImages, uploadGalleryImages, updateGalleryImage, deleteGalleryImage };
