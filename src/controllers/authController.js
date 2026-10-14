const asyncHandler = require("express-async-handler");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");

// @desc    Login admin/super admin
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const admin = await Admin.findOne({ email: email.toLowerCase() }).select("+password");

  if (!admin || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (admin.status === "suspended") {
    res.status(403);
    throw new Error("This account has been suspended. Contact a Super Admin.");
  }

  res.json({
    success: true,
    token: generateToken(admin._id),
    user: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  });
});

// @desc    Get currently logged-in admin
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.user });
});

// @desc    Update own name/password
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.user._id).select("+password");

  if (req.body.name) admin.name = req.body.name;
  if (req.body.password) admin.password = req.body.password; // pre-save hook hashes it

  await admin.save();

  res.json({
    success: true,
    user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  });
});

module.exports = { login, getMe, updateMe };
