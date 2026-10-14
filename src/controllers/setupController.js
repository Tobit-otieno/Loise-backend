const Admin = require("../models/Admin");

exports.setupSuperAdmin = async (req, res) => {
  try {
    // Stops strangers from hitting this on your live server
    if (!process.env.SETUP_KEY || req.headers["x-setup-key"] !== process.env.SETUP_KEY) {
      return res.status(401).json({ message: "Invalid setup key" });
    }

    const exists = await Admin.findOne({ role: "superadmin" });
    if (exists) {
      return res.status(403).json({ message: "A super admin already exists" });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    // Plain password on purpose: the pre-save hook in your model hashes it
    const admin = await Admin.create({
      name,
      email,
      password,
      role: "superadmin",
      status: "active",
    });

    res.status(201).json({
      message: "Super admin created",
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};