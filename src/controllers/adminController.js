const asyncHandler = require("express-async-handler");
const Admin = require("../models/Admin");

// @desc    List all admin/super admin accounts
// @route   GET /api/admins
// @access  Private/Superadmin
const getAdmins = asyncHandler(async (req, res) => {
  const admins = await Admin.find().sort({ createdAt: -1 });
  res.json({ success: true, count: admins.length, data: admins });
});

// @desc    Create a new admin account
// @route   POST /api/admins
// @access  Private/Superadmin
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  const exists = await Admin.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error("An account with that email already exists");
  }

  // Only a superadmin can grant the superadmin role; default new invites to "admin"
  const admin = await Admin.create({
    name,
    email,
    password,
    role: role === "superadmin" ? "superadmin" : "admin",
    createdBy: req.user._id,
  });

  res.status(201).json({
    success: true,
    data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
  });
});

// @desc    Update an admin's role or status
// @route   PUT /api/admins/:id
// @access  Private/Superadmin
const updateAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);

  if (!admin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  if (admin._id.equals(req.user._id) && req.body.role && req.body.role !== "superadmin") {
    res.status(400);
    throw new Error("You cannot demote yourself");
  }

  if (req.body.name) admin.name = req.body.name;
  if (req.body.role) admin.role = req.body.role;
  if (req.body.status) admin.status = req.body.status;

  await admin.save();

  res.json({
    success: true,
    data: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, status: admin.status },
  });
});

// @desc    Delete an admin account
// @route   DELETE /api/admins/:id
// @access  Private/Superadmin
const deleteAdmin = asyncHandler(async (req, res) => {
  const admin = await Admin.findById(req.params.id);

  if (!admin) {
    res.status(404);
    throw new Error("Admin not found");
  }

  if (admin._id.equals(req.user._id)) {
    res.status(400);
    throw new Error("You cannot delete your own account");
  }

  await admin.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = { getAdmins, createAdmin, updateAdmin, deleteAdmin };
