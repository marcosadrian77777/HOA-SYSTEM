// ============================================================
// src/routes/paymentRoutes.js
// ============================================================
// Record and view payments
// ============================================================
import express from "express";
import Payment from "../models/Payment.js";
import Bill from "../models/Bill.js";
import Consumer from "../models/Consumer.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// ── POST /api/payments ────────────────────────────────────────
// Record a payment for a bill (Admin and Staff)
router.post("/", protect, restrictTo("hoa_admin", "staff_admin"), async (req, res) => {
  try {
    const { billId, amount, method, referenceNumber, notes } = req.body;

    if (!billId || !amount) {
      return res.status(400).json({ success: false, message: "billId and amount are required." });
    }

    const bill = await Bill.findById(billId);
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found." });
    if (bill.status === "paid") return res.status(400).json({ success: false, message: "Bill is already fully paid." });

    const payment = await Payment.create({
      consumerId: bill.consumerId,
      billId,
      amount,
      method: method || "cash",
      referenceNumber,
      notes,
      recordedBy: req.user._id,
      status: "confirmed",
    });

    // Update bill payment status
    bill.amountPaid = (bill.amountPaid || 0) + amount;
    if (bill.amountPaid >= bill.totalAmount) {
      bill.status = "paid";
    } else {
      bill.status = "partial";
    }
    await bill.save();

    // Update consumer outstanding balance
    await Consumer.findByIdAndUpdate(bill.consumerId, {
      $inc: { outstandingBalance: -amount },
    });

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully.",
      payment,
      receiptNumber: payment.receiptNumber,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to record payment." });
  }
});

// ── GET /api/payments ─────────────────────────────────────────
// Get all payments (Admin and Staff)
router.get("/", protect, restrictTo("hoa_admin", "staff_admin"), async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate({ path: "consumerId", populate: { path: "userId", select: "firstName lastName email" } })
      .populate("billId", "billingPeriod totalAmount")
      .populate("recordedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch payments." });
  }
});

// ── GET /api/payments/my ──────────────────────────────────────
// Homeowner gets their own payment history
router.get("/my", protect, async (req, res) => {
  try {
    const consumer = await Consumer.findOne({ userId: req.user._id });
    if (!consumer) return res.status(404).json({ success: false, message: "Consumer profile not found." });

    const payments = await Payment.find({ consumerId: consumer._id })
      .populate("billId", "billingPeriod totalAmount month year")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: payments.length, payments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch payment history." });
  }
});

// ── GET /api/payments/summary ─────────────────────────────────
// Get total collections this month (Admin)
router.get("/summary", protect, restrictTo("hoa_admin"), async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const payments = await Payment.find({
      paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: "confirmed",
    });

    const totalCollections = payments.reduce((sum, p) => sum + p.amount, 0);

    const unpaidBills = await Bill.countDocuments({ status: { $in: ["unpaid", "overdue"] } });

    res.status(200).json({
      success: true,
      summary: {
        totalCollectionsThisMonth: totalCollections,
        totalPaymentsThisMonth: payments.length,
        unpaidBillsCount: unpaidBills,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch summary." });
  }
});

export default router;