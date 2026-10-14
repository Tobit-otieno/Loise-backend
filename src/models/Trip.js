const mongoose = require("mongoose");

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    meals: { type: String, default: "" }, // e.g. "Breakfast, Lunch, Dinner"
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    tripType: {
      type: String,
      enum: ["kenyan-safari", "international-tour"],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },

    category: [{ type: String, trim: true }],
    highlights: [{ type: String, trim: true }],
    destinations: [{ type: String, trim: true }],

    duration: {
      days: { type: Number, required: true, min: 1 },
      nights: { type: Number, required: true, min: 0 },
    },

    groupSize: {
      noLimit: { type: Boolean, default: false },
      min: { type: Number, default: null },
      max: { type: Number, default: null },
    },

    price: {
      amount: { type: Number, required: true, min: 0 },
      // Kenyan Safaris are always priced in USD (foreign clients).
      // International Tours are priced for Kenyan clients, default KES, USD allowed.
      currency: { type: String, enum: ["USD", "KES"], required: true },
    },

    description: { type: String, required: true }, // short excerpt
    overview: { type: String, required: true }, // long-form summary

    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },

    itinerary: [itineraryDaySchema],
    included: [{ type: String, trim: true }],
    excluded: [{ type: String, trim: true }],
    note: { type: String, default: "" },

    status: { type: String, enum: ["draft", "published"], default: "draft" },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

tripSchema.index({ tripType: 1, status: 1 });

module.exports = mongoose.model("Trip", tripSchema);
