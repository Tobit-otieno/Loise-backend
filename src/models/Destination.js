const mongoose = require("mongoose");

const destinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    tagline: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    bestTime: { type: String, required: true, trim: true },
    wildlife: [{ type: String, trim: true }],
    drive: { type: String, default: "" }, // e.g. "5-6 hours from Nairobi"
    altitude: { type: String, default: "" },
    description: { type: String, required: true },
    image: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Destination", destinationSchema);
