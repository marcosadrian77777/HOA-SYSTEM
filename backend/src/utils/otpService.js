// ============================================================
// src/models/OTP.js
// ============================================================
// Stores OTP codes for login verification.
// Each OTP expires after 5 minutes.
// ============================================================
import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    // ── Which user this OTP belongs to ────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── The 6-digit OTP code ──────────────────────────────────
    code: {
      type: String,
      required: true,
    },

    // ── OTP type ──────────────────────────────────────────────
    type: {
      type: String,
      enum: ["sms", "email"],
      required: true,
    },

    // ── Has this OTP been used already ────────────────────────
    isUsed: {
      type: Boolean,
      default: false,
    },

    // ── Expiry — auto delete after 5 minutes ──────────────────
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      index: { expires: 0 }, // MongoDB TTL index auto-deletes
    },
  },
  { timestamps: true }
);

const OTP = mongoose.models.OTP || mongoose.model("OTP", otpSchema);
export default OTP;