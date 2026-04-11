// ============================================================
// src/models/Payment.js
// ============================================================
// Records each payment made by a homeowner.
// ============================================================
import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    // ── Consumer ──────────────────────────────────────────────
    consumerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consumer",
      required: true,
    },

    // ── Bill being paid ───────────────────────────────────────
    billId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
    },

    // ── Payment Details ───────────────────────────────────────
    amount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: 0,
    },

    // ── Payment Method ────────────────────────────────────────
    method: {
      type: String,
      enum: ["cash", "gcash", "bank_transfer", "online", "other"],
      default: "cash",
    },

    // ── Reference Number (for online/bank payments) ───────────
    referenceNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Payment Date ──────────────────────────────────────────
    paymentDate: {
      type: Date,
      default: Date.now,
    },

    // ── Status ────────────────────────────────────────────────
    status: {
      type: String,
      enum: ["confirmed", "pending", "rejected"],
      default: "confirmed",
    },

    // ── Notes ─────────────────────────────────────────────────
    notes: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Recorded by (Staff or Admin) ──────────────────────────
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ── Receipt Number ────────────────────────────────────────
    receiptNumber: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Auto-generate receipt number before saving
paymentSchema.pre("save", async function (next) {
  if (!this.receiptNumber) {
    const count = await mongoose.model("Payment").countDocuments();
    const date = new Date();
    this.receiptNumber = `REC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
export default Payment;