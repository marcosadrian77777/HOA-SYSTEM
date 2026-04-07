// ============================================================
// src/routes/dashboardRoutes.js
// ============================================================
// Dashboard summary endpoint.
// Returns different data depending on the logged-in user's role.
//
//   GET /api/dashboard/summary
// ============================================================

import express from "express";
import User from "../models/user.js";
import Bill from "../models/bill.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

// GET /api/dashboard/summary
router.get("/summary", async (req, res) => {
  try {
    const role = req.user.role;

    // ── HOA Admin & Staff Admin view ─────────────────────────
    if (role === "hoa_admin" || role === "staff_admin") {
      const [
        totalUsers,
        totalHomeowners,
        totalBills,
        unpaidBills,
        overdueCount,
        paidBills,
        recentBills,
        recentUsers,
      ] = await Promise.all([
        User.countDocuments({}),
        User.countDocuments({ role: "homeowner" }),
        Bill.countDocuments({}),
        Bill.countDocuments({ status: "unpaid" }),
        Bill.countDocuments({ status: "overdue" }),
        Bill.countDocuments({ status: "paid" }),

        // Last 5 bills created
        Bill.find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("homeowner", "firstName lastName unitNumber"),

        // Last 5 users registered
        User.find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .select("firstName lastName username role createdAt"),
      ]);

      // Sum of all unpaid + overdue amounts
      const outstandingResult = await Bill.aggregate([
        { $match: { status: { $in: ["unpaid", "overdue"] } } },
        { $group: { _id: null, total: { $sum: "$totalAmountDue" } } },
      ]);
      const totalOutstanding = outstandingResult[0]?.total || 0;

      // Sum of all collected payments this month
      const now = new Date();
      const collectedResult = await Bill.aggregate([
        {
          $match: {
            status: "paid",
            billingMonth: now.getMonth() + 1,
            billingYear: now.getFullYear(),
          },
        },
        { $group: { _id: null, total: { $sum: "$paidAmount" } } },
      ]);
      const collectedThisMonth = collectedResult[0]?.total || 0;

      return res.status(200).json({
        success: true,
        role,
        stats: {
          totalUsers,
          totalHomeowners,
          totalBills,
          unpaidBills,
          overdueCount,
          paidBills,
          totalOutstanding,
          collectedThisMonth,
        },
        recentBills: recentBills.map((b) => ({
          id: b._id,
          unitNumber: b.unitNumber,
          homeownerName: b.homeowner
            ? `${b.homeowner.firstName} ${b.homeowner.lastName}`
            : "Unknown",
          billingPeriod: `${b.billingMonth}/${b.billingYear}`,
          totalAmountDue: b.totalAmountDue,
          status: b.status,
          createdAt: b.createdAt,
        })),
        recentUsers: recentUsers.map((u) => ({
          id: u._id,
          name: `${u.firstName} ${u.lastName}`,
          username: u.username,
          role: u.role,
          joinedAt: u.createdAt,
        })),
      });
    }

    // ── Homeowner view ────────────────────────────────────────
    if (role === "homeowner") {
      const [myBills, currentBill] = await Promise.all([
        Bill.find({ homeowner: req.user._id }).sort({
          billingYear: -1,
          billingMonth: -1,
        }),
        Bill.findOne({
          homeowner: req.user._id,
          status: { $in: ["unpaid", "overdue"] },
        }).sort({ billingYear: -1, billingMonth: -1 }),
      ]);

      const totalOwed = myBills
        .filter((b) => b.status !== "paid")
        .reduce((sum, b) => sum + b.totalAmountDue, 0);

      const totalPaid = myBills
        .filter((b) => b.status === "paid")
        .reduce((sum, b) => sum + b.paidAmount, 0);

      return res.status(200).json({
        success: true,
        role,
        stats: {
          totalBills: myBills.length,
          unpaidBills: myBills.filter((b) => b.status === "unpaid").length,
          paidBills: myBills.filter((b) => b.status === "paid").length,
          overdueCount: myBills.filter((b) => b.status === "overdue").length,
          totalOwed,
          totalPaid,
        },
        currentBill: currentBill ? currentBill.toSafeObject() : null,
        recentBills: myBills.slice(0, 5).map((b) => b.toSafeObject()),
      });
    }

    res.status(400).json({ success: false, message: "Unknown role." });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, message: "Failed to load dashboard." });
  }
});

export default router;