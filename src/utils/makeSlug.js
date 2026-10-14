const slugify = require("slugify");

// Turns "10-Day Kenyan Classics Safari" into "10-day-kenyan-classics-safari",
// and appends a short random suffix if a slug isn't provided/unique upstream.
const makeSlug = (text) =>
  slugify(text, { lower: true, strict: true, trim: true });

module.exports = makeSlug;
