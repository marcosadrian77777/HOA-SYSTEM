// ============================================================
// src/routes/consumerRoutes.js
// ============================================================
// Manage homeowner/consumer profiles
// Admin and Staff can manage, Homeowner can view own
// ============================================================
import express from "express";
import Consumer from "../models/Consumer.js";
import User from "../models/user.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// ── GET /api/consumers ────────────────────────────────────────
// Get all consumers (Admin and Staff only)
router.get("/", protect, restrictTo("hoa_admin", "staff_admin"), async (req, res) => {
  try {
    const consumers = await Consumer.find({})
      .populate("userId", "firstName lastName email username role isActive")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: consumers.length,
      consumers,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch consumers." });
  }
});

// ── GET /api/consumers/my ─────────────────────────────────────
// Homeowner gets their own consumer profile
router.get("/my", protect, async (req, res) => {
  try {
    const consumer = await Consumer.findOne({ userId: req.user._id })
      .populate("userId", "firstName lastName email username");

    if (!consumer) {
      return res.status(404).json({ success: false, message: "Consumer profile not found." });
    }

    res.status(200).json({ success: true, consumer });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch consumer profile." });
  }
});

// ── GET /api/consumers/:id ────────────────────────────────────
// Get single consumer by ID
router.get("/:id", protect, restrictTo("hoa_admin", "staff_admin"), async (req, res) => {
  try {
    const consumer = await Consumer.findById(req.params.id)
      .populate("userId", "firstName lastName email username role isActive");

    if (!consumer) return res.status(404).json({ success: false, message: "Consumer not found." });

    res.status(200).json({ success: true, consumer });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch consumer." });
  }
});

// ── POST /api/consumers ───────────────────────────────────────
// Create a consumer profile for a homeowner (Admin only)
router.post("/", protect, restrictTo("hoa_admin"), async (req, res) => {
  try {
    const { userId, unitNumber, streetAddress, blockLot, phone, meterNumber } = req.body;

    if (!userId || !unitNumber) {
      return res.status(400).json({ success: false, message: "userId and unitNumber are required." });
    }

    // Check user exists and is a homeowner
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Check if consumer profile already exists
    const existing = await Consumer.findOne({ userId });
    if (existing) return res.status(400).json({ success: false, message: "Consumer profile already exists for this user." });

    const consumer = await Consumer.create({
      userId, unitNumber, streetAddress, blockLot, phone, meterNumber,
    });

    res.status(201).json({
      success: true,
      message: "Consumer profile created successfully.",
      consumer: consumer.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create consumer profile." });
  }
});

// ── PATCH /api/consumers/:id ──────────────────────────────────
// Update consumer profile (Admin and Staff)
router.patch("/:id", protect, restrictTo("hoa_admin", "staff_admin"), async (req, res) => {
  try {
    const { unitNumber, streetAddress, blockLot, phone, meterNumber, isActive } = req.body;

    const consumer = await Consumer.findByIdAndUpdate(
      req.params.id,
      { unitNumber, streetAddress, blockLot, phone, meterNumber, isActive },
      { new: true, runValidators: true }
    );

    if (!consumer) return res.status(404).json({ success: false, message: "Consumer not found." });

    res.status(200).json({
      success: true,
      message: "Consumer updated successfully.",
      consumer: consumer.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update consumer." });
  }
});

export default router;