const asyncHandler = require("express-async-handler");
const Journal = require("../models/Journal");
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

// @desc    Get all journal entries (supports ?status=, ?category=)
// @route   GET /api/journal
// @access  Public
const getJournalEntries = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;

  const entries = await Journal.find(filter).sort({ publishedDate: -1 });
  res.json({ success: true, count: entries.length, data: entries });
});

// @desc    Get one journal entry by slug or id
// @route   GET /api/journal/:idOrSlug
// @access  Public
const getJournalEntry = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const entry = await Journal.findOne({
    $or: [{ _id: idOrSlug.match(/^[0-9a-fA-F]{24}$/) ? idOrSlug : null }, { slug: idOrSlug }],
  });

  if (!entry) {
    res.status(404);
    throw new Error("Journal entry not found");
  }
  res.json({ success: true, data: entry });
});

// @desc    Create a journal entry (cover image uploaded as "image")
// @route   POST /api/journal
// @access  Private/Admin+
const createJournalEntry = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("A cover image is required");
  }

  const entry = await Journal.create({
    title: req.body.title,
    slug: req.body.slug ? makeSlug(req.body.slug) : makeSlug(req.body.title),
    category: req.body.category,
    readTime: req.body.readTime,
    excerpt: req.body.excerpt,
    image: { url: req.file.path, publicId: req.file.filename },
    author: req.body.author || req.user.name,
    sections: parseJSONField(req.body.sections, []),
    faqs: parseJSONField(req.body.faqs, []),
    metaTitle: req.body.metaTitle || "",
    metaDescription: req.body.metaDescription || "",
    status: req.body.status === "published" ? "published" : "draft",
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: entry });
});

// @desc    Update a journal entry
// @route   PUT /api/journal/:id
// @access  Private/Admin+
const updateJournalEntry = asyncHandler(async (req, res) => {
  const entry = await Journal.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error("Journal entry not found");
  }

  const fields = ["title", "category", "readTime", "excerpt", "author", "metaTitle", "metaDescription", "status"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) entry[f] = req.body[f];
  });

  if (req.body.slug) entry.slug = makeSlug(req.body.slug);
  if (req.body.sections) entry.sections = parseJSONField(req.body.sections, entry.sections);
  if (req.body.faqs) entry.faqs = parseJSONField(req.body.faqs, entry.faqs);

  if (req.file) {
    const oldPublicId = entry.image?.publicId;
    entry.image = { url: req.file.path, publicId: req.file.filename };
    if (oldPublicId) cloudinary.uploader.destroy(oldPublicId).catch(() => {});
  }

  await entry.save();
  res.json({ success: true, data: entry });
});

// @desc    Delete a journal entry
// @route   DELETE /api/journal/:id
// @access  Private/Superadmin
const deleteJournalEntry = asyncHandler(async (req, res) => {
  const entry = await Journal.findById(req.params.id);
  if (!entry) {
    res.status(404);
    throw new Error("Journal entry not found");
  }

  if (entry.image?.publicId) {
    cloudinary.uploader.destroy(entry.image.publicId).catch(() => {});
  }

  await entry.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
};
