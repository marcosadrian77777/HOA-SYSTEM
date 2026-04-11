// ============================================================
// src/routes/profileRoutes.js
// ============================================================
// Profile routes for all users (admin, staff, homeowner)
// ============================================================
import express from "express";
import User from "../models/user.js";
import Consumer from "../models/Consumer.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// ── GET /api/profile/me ───────────────────────────────────────
// Get current user's full profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // If homeowner, also get consumer profile
    let consumer = null;
    if (user.role === "homeowner") {
      consumer = await Consumer.findOne({ userId: user._id });
    }

    res.status(200).json({
      success: true,
      user: user.toSafeObject(),
      consumer: consumer ? consumer.toSafeObject() : null,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
});

// ── PATCH /api/profile/me ─────────────────────────────────────
// Update current user's basic info
router.patch("/me", protect, async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    await user.save();

    // If homeowner, update phone in consumer profile
    if (user.role === "homeowner" && phone) {
      await Consumer.findOneAndUpdate(
        { userId: user._id },
        { phone },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: user.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update profile." });
  }
});

// ── PATCH /api/profile/password ───────────────────────────────
// Change password
router.patch("/password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide current and new password." });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters." });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to change password." });
  }
});

export default router;