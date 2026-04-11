// ============================================================
// src/routes/billingRoutes.js
// ============================================================
// Water readings and bill generation
// Staff records readings, Admin generates bills
// ============================================================
import express from "express";
import WaterReading from "../models/WaterReading.js";
import Bill from "../models/Bill.js";
import Consumer from "../models/Consumer.js";
import Rate from "../models/Rate.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// ── POST /api/billing/readings ────────────────────────────────
// Staff records a water reading for a consumer
router.post("/readings", protect, restrictTo("hoa_admin", "staff_admin"), async (req, res) => {
  try {
    const { consumerId, month, year, previousReading, currentReading, notes } = req.body;

    if (!consumerId || !month || !year || currentReading === undefined) {
      return res.status(400).json({ success: false, message: "consumerId, month, year, and currentReading are required." });
    }

    // Check consumer exists
    const consumer = await Consumer.findById(consumerId);
    if (!consumer) return res.status(404).json({ success: false, message: "Consumer not found." });

    // Check for duplicate reading this month
    const existing = await WaterReading.findOne({ consumerId, month, year });
    if (existing) return res.status(400).json({ success: false, message: "Reading already recorded for this month." });

    const reading = await WaterReading.create({
      consumerId,
      month,
      year,
      previousReading: previousReading || 0,
      currentReading,
      notes,
      recordedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Water reading recorded successfully.",
      reading,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to record water reading." });
  }
});

// ── GET /api/billing/readings ─────────────────────────────────
// Get all water readings (Admin and Staff)
router.get("/readings", protect, restrictTo("hoa_admin", "staff_admin"), async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = {};
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const readings = await WaterReading.find(filter)
      .populate({ path: "consumerId", populate: { path: "userId", select: "firstName lastName" } })
      .populate("recordedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: readings.length, readings });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch readings." });
  }
});

// ── POST /api/billing/generate ────────────────────────────────
// Generate a bill from a water reading (Admin only)
router.post("/generate", protect, restrictTo("hoa_admin"), async (req, res) => {
  try {
    const { readingId } = req.body;

    const reading = await WaterReading.findById(readingId);
    if (!reading) return res.status(404).json({ success: false, message: "Water reading not found." });

    // Check if bill already generated
    const existingBill = await Bill.findOne({
      consumerId: reading.consumerId,
      month: reading.month,
      year: reading.year,
    });
    if (existingBill) return res.status(400).json({ success: false, message: "Bill already generated for this period." });

    // Get active rate
    const rate = await Rate.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!rate) return res.status(404).json({ success: false, message: "No active billing rate found. Please set a rate first." });

    // Compute bill amounts
    const consumption = reading.consumption || 0;
    const waterCharge = consumption * rate.ratePerCubicMeter;
    const baseCharge = rate.baseCharge;
    const monthlyDues = rate.monthlyDues;
    const totalAmount = baseCharge + waterCharge + monthlyDues;

    // Due date = 15th of next month
    const dueDate = new Date(reading.year, reading.month, 15);

    const bill = await Bill.create({
      consumerId: reading.consumerId,
      waterReadingId: reading._id,
      month: reading.month,
      year: reading.year,
      previousReading: reading.previousReading,
      currentReading: reading.currentReading,
      consumption,
      baseCharge,
      waterCharge,
      monthlyDues,
      penalty: 0,
      totalAmount,
      dueDate,
      status: "unpaid",
      generatedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Bill generated successfully.",
      bill,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to generate bill." });
  }
});

// ── GET /api/billing/bills ────────────────────────────────────
// Get all bills (Admin and Staff)
router.get("/bills", protect, restrictTo("hoa_admin", "staff_admin"), async (req, res) => {
  try {
    const { status, month, year } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const bills = await Bill.find(filter)
      .populate({ path: "consumerId", populate: { path: "userId", select: "firstName lastName email" } })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: bills.length, bills });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch bills." });
  }
});

// ── GET /api/billing/bills/my ─────────────────────────────────
// Homeowner gets their own bills
router.get("/bills/my", protect, async (req, res) => {
  try {
    const consumer = await Consumer.findOne({ userId: req.user._id });
    if (!consumer) return res.status(404).json({ success: false, message: "Consumer profile not found." });

    const bills = await Bill.find({ consumerId: consumer._id }).sort({ year: -1, month: -1 });

    res.status(200).json({ success: true, count: bills.length, bills });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch bills." });
  }
});

// ── GET /api/billing/rates ────────────────────────────────────
// Get current active rate
router.get("/rates", protect, async (req, res) => {
  try {
    const rate = await Rate.findOne({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, rate });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch rate." });
  }
});

// ── POST /api/billing/rates ───────────────────────────────────
// Set a new billing rate (Admin only)
router.post("/rates", protect, restrictTo("hoa_admin"), async (req, res) => {
  try {
    const { name, baseCharge, ratePerCubicMeter, monthlyDues, penaltyRate } = req.body;

    // Deactivate all old rates
    await Rate.updateMany({}, { isActive: false });

    const rate = await Rate.create({
      name: name || "Standard Rate",
      baseCharge,
      ratePerCubicMeter,
      monthlyDues,
      penaltyRate,
      isActive: true,
      setBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Billing rate set successfully.",
      rate,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to set billing rate." });
  }
});

export default router;