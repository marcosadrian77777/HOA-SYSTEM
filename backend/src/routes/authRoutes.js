// ============================================================
// src/routes/authRoutes.js
// ============================================================

import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.js";              // ← FIXED (was: "src/models/User.js")
import { protect, restrictTo } from "../middleware/auth.js"; // ← FIXED (was: "../../../src/middleware/auth.js")

const router = express.Router();

// Helper: create a JWT token for a user
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// REGISTER — POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, username, password } = req.body;

    if (!firstName || !lastName || !email || !username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all fields: firstName, lastName, email, username, password.",
      });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "That email or username is already registered.",
      });
    }

    const newUser = await User.create({
      firstName, lastName, email, username, password,
      role: "homeowner",
    });

    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      token,
      user: newUser.toSafeObject(),
    });

  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: "Server error. Try again." });
  }
});

// LOGIN — POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your username and password.",
      });
    }

    const user = await User.findOne({ username }).select("+password");

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is deactivated. Contact the HOA office.",
      });
    }

    const isCorrect = await user.comparePassword(password);
    if (!isCorrect) {
      return res.status(401).json({ success: false, message: "Invalid username or password." });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: "Login successful!",
      token,
      user: user.toSafeObject(),
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error. Try again." });
  }
});

// GET ME — GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toSafeObject(),
  });
});

// CREATE ADMIN — POST /api/auth/create-admin
// HOA Admin only
router.post("/create-admin", protect, restrictTo("hoa_admin"), async (req, res) => {
  try {
    const { firstName, lastName, email, username, password, role } = req.body;

    if (!["staff_admin", "hoa_admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'staff_admin' or 'hoa_admin'.",
      });
    }

    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email or username already in use." });
    }

    const admin = await User.create({ firstName, lastName, email, username, password, role });

    res.status(201).json({
      success: true,
      message: `${role} account created!`,
      user: admin.toSafeObject(),
    });

  } catch (error) {
    console.error("Create admin error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
});

export default router;