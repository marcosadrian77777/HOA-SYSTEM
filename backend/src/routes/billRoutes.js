// ============================================================
// src/routes/billRoutes.js
// ============================================================
// All water billing endpoints.
//
// Admin/Staff endpoints:
//   POST   /api/bills              → create a new bill
//   GET    /api/bills              → get all bills (with filters)
//   GET    /api/bills/:id          → get one bill
//   PATCH  /api/bills/:id/pay      → mark a bill as paid
//   PATCH  /api/bills/:id/penalty  → add a penalty fee
//   DELETE /api/bills/:id          → delete a bill
//
// Homeowner endpoints:
//   GET    /api/bills/mine         → get my own bills
//   GET    /api/bills/mine/current → get my latest unpaid bill
// ============================================================

import express from "express";
import Bill from "../models/bill.js";
import User from "../models/user.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// ── All routes require login ──────────────────────────────────
router.use(protect);


// ============================================================
// HOMEOWNER ROUTES (must come before /:id to avoid conflicts)
// ============================================================

// GET /api/bills/mine — homeowner views their own bill history
router.get("/mine", async (req, res) => {
  try {
    const bills = await Bill.find({ homeowner: req.user._id })
      .sort({ billingYear: -1, billingMonth: -1 });

    res.status(200).json({
      success: true,
      count: bills.length,
      bills: bills.map((b) => b.toSafeObject()),
    });
  } catch (err) {
    console.error("Get my bills error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch your bills." });
  }
});

// GET /api/bills/mine/current — homeowner views latest unpaid bill
router.get("/mine/current", async (req, res) => {
  try {
    const bill = await Bill.findOne({
      homeowner: req.user._id,
      status: { $in: ["unpaid", "overdue"] },
    }).sort({ billingYear: -1, billingMonth: -1 });

    if (!bill) {
      return res.status(200).json({
        success: true,
        message: "No outstanding bills found.",
        bill: null,
      });
    }

    res.status(200).json({
      success: true,
      bill: bill.toSafeObject(),
    });
  } catch (err) {
    console.error("Get current bill error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch current bill." });
  }
});


// ============================================================
// ADMIN / STAFF ROUTES
// ============================================================

// POST /api/bills — create a new water bill for a homeowner
router.post(
  "/",
  restrictTo("hoa_admin", "staff_admin"),
  async (req, res) => {
    try {
      const {
        homeownerId,
        unitNumber,
        billingMonth,
        billingYear,
        previousReading,
        currentReading,
        ratePerCubicMeter,
        maintenanceFee,
        dueDate,
        notes,
      } = req.body;

      // Validate required fields
      if (
        !homeownerId ||
        !unitNumber ||
        !billingMonth ||
        !billingYear ||
        previousReading == null ||
        currentReading == null ||
        !dueDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Missing required fields: homeownerId, unitNumber, billingMonth, billingYear, previousReading, currentReading, dueDate.",
        });
      }

      // Validate reading values
      if (currentReading < previousReading) {
        return res.status(400).json({
          success: false,
          message: "Current reading cannot be less than previous reading.",
        });
      }

      // Check that the homeowner exists
      const homeowner = await User.findById(homeownerId);
      if (!homeowner || homeowner.role !== "homeowner") {
        return res.status(404).json({
          success: false,
          message: "Homeowner not found.",
        });
      }

      // Build bill object (pre-save hook computes consumption + totals)
      const billData = {
        homeowner: homeownerId,
        unitNumber,
        billingMonth: parseInt(billingMonth),
        billingYear: parseInt(billingYear),
        previousReading: parseFloat(previousReading),
        currentReading: parseFloat(currentReading),
        dueDate: new Date(dueDate),
        createdBy: req.user._id,
        notes: notes || "",
      };

      if (ratePerCubicMeter != null)
        billData.ratePerCubicMeter = parseFloat(ratePerCubicMeter);
      if (maintenanceFee != null)
        billData.maintenanceFee = parseFloat(maintenanceFee);

      const bill = await Bill.create(billData);

      res.status(201).json({
        success: true,
        message: "Bill created successfully!",
        bill: bill.toSafeObject(),
      });
    } catch (err) {
      // Duplicate bill (same homeowner + same month/year)
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A bill for this homeowner already exists for that billing period.",
        });
      }
      console.error("Create bill error:", err);
      res.status(500).json({ success: false, message: "Failed to create bill." });
    }
  }
);

// GET /api/bills — list all bills (admin/staff)
// Optional query params: ?status=unpaid&month=6&year=2026&homeownerId=xxx
router.get(
  "/",
  restrictTo("hoa_admin", "staff_admin"),
  async (req, res) => {
    try {
      const filter = {};
      if (req.query.status) filter.status = req.query.status;
      if (req.query.month) filter.billingMonth = parseInt(req.query.month);
      if (req.query.year) filter.billingYear = parseInt(req.query.year);
      if (req.query.homeownerId) filter.homeowner = req.query.homeownerId;

      const bills = await Bill.find(filter)
        .populate("homeowner", "firstName lastName email username")
        .sort({ billingYear: -1, billingMonth: -1, createdAt: -1 });

      res.status(200).json({
        success: true,
        count: bills.length,
        bills: bills.map((b) => ({
          ...b.toSafeObject(),
          homeownerName: b.homeowner
            ? `${b.homeowner.firstName} ${b.homeowner.lastName}`
            : "Unknown",
          homeownerUsername: b.homeowner?.username,
        })),
      });
    } catch (err) {
      console.error("Get all bills error:", err);
      res.status(500).json({ success: false, message: "Failed to fetch bills." });
    }
  }
);

// GET /api/bills/:id — get a single bill
router.get("/:id", async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate(
      "homeowner",
      "firstName lastName email username"
    );

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found." });
    }

    // Homeowners can only see their own bills
    if (
      req.user.role === "homeowner" &&
      bill.homeowner._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    res.status(200).json({
      success: true,
      bill: {
        ...bill.toSafeObject(),
        homeownerName: bill.homeowner
          ? `${bill.homeowner.firstName} ${bill.homeowner.lastName}`
          : "Unknown",
      },
    });
  } catch (err) {
    console.error("Get bill error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch bill." });
  }
});

// PATCH /api/bills/:id/pay — mark a bill as paid
router.patch(
  "/:id/pay",
  restrictTo("hoa_admin", "staff_admin"),
  async (req, res) => {
    try {
      const { paidAmount } = req.body;
      const bill = await Bill.findById(req.params.id);

      if (!bill) {
        return res.status(404).json({ success: false, message: "Bill not found." });
      }

      if (bill.status === "paid") {
        return res.status(400).json({ success: false, message: "Bill is already paid." });
      }

      bill.status = "paid";
      bill.paidAt = new Date();
      bill.paidAmount = paidAmount != null ? parseFloat(paidAmount) : bill.totalAmountDue;
      await bill.save();

      res.status(200).json({
        success: true,
        message: "Bill marked as paid.",
        bill: bill.toSafeObject(),
      });
    } catch (err) {
      console.error("Pay bill error:", err);
      res.status(500).json({ success: false, message: "Failed to update bill." });
    }
  }
);

// PATCH /api/bills/:id/penalty — add a penalty fee to a bill
router.patch(
  "/:id/penalty",
  restrictTo("hoa_admin", "staff_admin"),
  async (req, res) => {
    try {
      const { penaltyFee } = req.body;
      if (!penaltyFee || penaltyFee <= 0) {
        return res.status(400).json({ success: false, message: "Penalty fee must be greater than 0." });
      }

      const bill = await Bill.findById(req.params.id);
      if (!bill) {
        return res.status(404).json({ success: false, message: "Bill not found." });
      }

      bill.penaltyFee = parseFloat(penaltyFee);
      bill.status = "overdue";
      // Pre-save hook will recompute totalAmountDue
      await bill.save();

      res.status(200).json({
        success: true,
        message: "Penalty applied successfully.",
        bill: bill.toSafeObject(),
      });
    } catch (err) {
      console.error("Add penalty error:", err);
      res.status(500).json({ success: false, message: "Failed to apply penalty." });
    }
  }
);

// DELETE /api/bills/:id — delete a bill (admin only)
router.delete(
  "/:id",
  restrictTo("hoa_admin"),
  async (req, res) => {
    try {
      const bill = await Bill.findById(req.params.id);
      if (!bill) {
        return res.status(404).json({ success: false, message: "Bill not found." });
      }

      await Bill.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true, message: "Bill deleted successfully." });
    } catch (err) {
      console.error("Delete bill error:", err);
      res.status(500).json({ success: false, message: "Failed to delete bill." });
    }
  }
);

export default router;