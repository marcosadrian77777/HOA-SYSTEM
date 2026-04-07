// ============================================================
// src/models/bill.js
// ============================================================
// Blueprint for how a water bill is saved in MongoDB.
// Each bill belongs to one homeowner for one billing period.
// ============================================================

import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    // ── Who this bill belongs to ──────────────────────────────
    homeowner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Homeowner is required"],
    },

    // ── Unit / House info (denormalized for quick display) ────
    unitNumber: {
      type: String,
      required: [true, "Unit number is required"],
      trim: true,
    },

    // ── Billing Period ────────────────────────────────────────
    billingMonth: {
      type: Number, // 1–12
      required: [true, "Billing month is required"],
      min: 1,
      max: 12,
    },
    billingYear: {
      type: Number,
      required: [true, "Billing year is required"],
    },

    // ── Meter Readings ────────────────────────────────────────
    previousReading: {
      type: Number,
      required: [true, "Previous meter reading is required"],
      min: 0,
    },
    currentReading: {
      type: Number,
      required: [true, "Current meter reading is required"],
      min: 0,
    },

    // ── Computed Fields (set automatically) ──────────────────
    consumption: {
      type: Number, // in cubic meters (m³)
      min: 0,
    },
    ratePerCubicMeter: {
      type: Number,
      default: 35, // ₱35 per m³ — change to your HOA's actual rate
    },
    waterCharge: {
      type: Number,
      min: 0,
    },

    // ── Additional Fees ───────────────────────────────────────
    maintenanceFee: {
      type: Number,
      default: 0,
    },
    penaltyFee: {
      type: Number,
      default: 0,
    },

    // ── Total ─────────────────────────────────────────────────
    totalAmountDue: {
      type: Number,
      min: 0,
    },

    // ── Payment Status ────────────────────────────────────────
    status: {
      type: String,
      enum: ["unpaid", "paid", "overdue", "disputed"],
      default: "unpaid",
    },
    paidAt: {
      type: Date,
      default: null,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },

    // ── Due Date ──────────────────────────────────────────────
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },

    // ── Who created this bill ────────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ── Notes ─────────────────────────────────────────────────
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// ── Auto-compute consumption and charges before saving ───────
billSchema.pre("save", function (next) {
  // Consumption = current - previous reading
  this.consumption = Math.max(0, this.currentReading - this.previousReading);

  // Water charge = consumption × rate
  this.waterCharge = this.consumption * this.ratePerCubicMeter;

  // Total = water charge + fees
  this.totalAmountDue =
    this.waterCharge + (this.maintenanceFee || 0) + (this.penaltyFee || 0);

  next();
});

// ── Prevent duplicate bills for same unit + same period ──────
billSchema.index(
  { homeowner: 1, billingMonth: 1, billingYear: 1 },
  { unique: true }
);

// ── Helper: return safe bill object for API responses ────────
billSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    homeowner: this.homeowner,
    unitNumber: this.unitNumber,
    billingPeriod: `${this.billingMonth}/${this.billingYear}`,
    billingMonth: this.billingMonth,
    billingYear: this.billingYear,
    previousReading: this.previousReading,
    currentReading: this.currentReading,
    consumption: this.consumption,
    ratePerCubicMeter: this.ratePerCubicMeter,
    waterCharge: this.waterCharge,
    maintenanceFee: this.maintenanceFee,
    penaltyFee: this.penaltyFee,
    totalAmountDue: this.totalAmountDue,
    status: this.status,
    paidAt: this.paidAt,
    paidAmount: this.paidAmount,
    dueDate: this.dueDate,
    notes: this.notes,
    createdAt: this.createdAt,
  };
};

const Bill = mongoose.models.Bill || mongoose.model("Bill", billSchema);
export default Bill;