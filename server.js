require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./src/config/db");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");

const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const tripRoutes = require("./src/routes/tripRoutes");
const destinationRoutes = require("./src/routes/destinationRoutes");
const galleryRoutes = require("./src/routes/galleryRoutes");
const inquiryRoutes = require("./src/routes/inquiryRoutes");
const journalRoutes = require("./src/routes/journalRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");

const { setupSuperAdmin } = require("./src/controllers/setupController");

 
connectDB();

const app = express();

app.post("/api/setup/superadmin", setupSuperAdmin);
// --- Core middleware ---
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = (process.env.CLIENT_URLS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // allow non-browser tools (curl/Postman) with no origin, and any whitelisted origin
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Basic rate limiting on the public-facing auth + inquiry endpoints to slow brute force/spam
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use("/api/auth/login", limiter);
app.use("/api/inquiries", limiter);

// --- Routes ---
app.get("/", (req, res) => {
  res.json({ success: true, message: "Loise Adventures API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/destinations", destinationRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/dashboard", dashboardRoutes);

// --- Error handling (must be last) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Loise Adventures API running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
});
