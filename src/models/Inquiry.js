const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "" },
    tripInterested: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", default: null },
    tripName: { type: String, default: "" }, // captured as free text too, in case trip is deleted later
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "contacted", "closed"],
      default: "new",
    },
    notes: { type: String, default: "" }, // internal admin notes
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inquiry", inquirySchema);
