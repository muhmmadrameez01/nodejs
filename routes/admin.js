
const express = require("express");
const Admin = require("../models/admin.model");
const router = express.Router();
// Admin Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const admin = new Admin({ username, email, password });
    const savedAdmin = await admin.save();
    res.status(201).json({ message: "Admin registered successfully", adminId: savedAdmin._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    if (admin.password !== password) { // Direct string comparison
      return res.status(401).json({ message: "Invalid credentials" });
    }
    res.status(200).json({ message: "Login successful", adminId: admin._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all Admins
router.get('/', async (req, res) => {
  try {
    const admins = await Admin.find({});
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
