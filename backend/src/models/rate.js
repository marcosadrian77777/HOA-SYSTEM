// ============================================================
// src/models/Rate.js
// ============================================================
// Stores the water billing rates set by HOA Admin.
// ============================================================
import mongoose from "mongoose";

const rateSchema = new mongoose.Schema(
  {
    // ── Rate Name ─────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Rate name is required"],
      trim: true,
      default: "Standard Rate",
    },

    // ── Base Charge (flat fee regardless of usage) ────────────
    baseCharge: {
      type: Number,
      required: true,
      default: 50,
    },

    // ── Rate per cubic meter ──────────────────────────────────
    ratePerCubicMeter: {
      type: Number,
      required: true,
      default: 15,
    },

    // ── Monthly Dues (HOA fee) ────────────────────────────────
    monthlyDues: {
      type: Number,
      required: true,
      default: 200,
    },

    // ── Penalty for late payment ──────────────────────────────
    penaltyRate: {
      type: Number,
      default: 50,
      comment: "Fixed penalty amount in pesos for late payment",
    },

    // ── Effective Date ────────────────────────────────────────
    effectiveDate: {
      type: Date,
      default: Date.now,
    },

    // ── Active rate ───────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Set by ───────────────────────────────────────────────
    setBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Rate = mongoose.models.Rate || mongoose.model("Rate", rateSchema);
export default Rate;