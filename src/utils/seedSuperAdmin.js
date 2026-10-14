// One-time bootstrap script: creates the very first Super Admin account.
// Run with: npm run seed:superadmin
// Requires SUPERADMIN_NAME / SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD in .env

require("dotenv").config();
const connectDB = require("../config/db");
const Admin = require("../models/Admin");

const run = async () => {
  await connectDB();

  const { SUPERADMIN_NAME, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD } = process.env;

  if (!SUPERADMIN_NAME || !SUPERADMIN_EMAIL || !SUPERADMIN_PASSWORD) {
    console.error("Missing SUPERADMIN_NAME / SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD in .env");
    process.exit(1);
  }

  const existing = await Admin.findOne({ email: SUPERADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log(`An admin with email ${SUPERADMIN_EMAIL} already exists. Nothing to do.`);
    process.exit(0);
  }

  const admin = await Admin.create({
    name: SUPERADMIN_NAME,
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASSWORD,
    role: "superadmin",
    status: "active",
  });

  console.log("Super Admin created:");
  console.log(`  Name:  ${admin.name}`);
  console.log(`  Email: ${admin.email}`);
  console.log("  Log in with the password you set in .env, then change it from Settings.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
