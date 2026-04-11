// ============================================================
// src/models/Consumer.js
// ============================================================
// Stores homeowner profile and unit details.
// Linked to the User account via userId.
// ============================================================
import mongoose from "mongoose";

const consumerSchema = new mongoose.Schema(
  {
    // ── Linked User Account ───────────────────────────────────
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ── Unit / Address Info ───────────────────────────────────
    unitNumber: {
      type: String,
      required: [true, "Unit number is required"],
      trim: true,
    },
    streetAddress: {
      type: String,
      trim: true,
      default: "",
    },
    blockLot: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Contact Info ──────────────────────────────────────────
    phone: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Meter Info ────────────────────────────────────────────
    meterNumber: {
      type: String,
      trim: true,
      default: "",
    },

    // ── Status ────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Outstanding Balance ───────────────────────────────────
    outstandingBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Safe object to send to frontend
consumerSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    userId: this.userId,
    unitNumber: this.unitNumber,
    streetAddress: this.streetAddress,
    blockLot: this.blockLot,
    phone: this.phone,
    meterNumber: this.meterNumber,
    isActive: this.isActive,
    outstandingBalance: this.outstandingBalance,
    createdAt: this.createdAt,
  };
};

const Consumer = mongoose.models.Consumer || mongoose.model("Consumer", consumerSchema);
export default Consumer;