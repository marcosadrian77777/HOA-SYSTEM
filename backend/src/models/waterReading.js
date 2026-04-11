// ============================================================
// src/models/WaterReading.js
// ============================================================
// Monthly water meter readings recorded by Staff.
// ============================================================
import mongoose from "mongoose";

const waterReadingSchema = new mongoose.Schema(
  {
    // ── Which consumer ────────────────────────────────────────
    consumerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Consumer",
      required: true,
    },

    // ── Billing Period ────────────────────────────────────────
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },

    // ── Meter Readings ────────────────────────────────────────
    previousReading: {
      type: Number,
      required: true,
      default: 0,
    },
    currentReading: {
      type: Number,
      required: true,
    },

    // ── Computed Consumption (currentReading - previousReading)
    consumption: {
      type: Number,
    },

    // ── Recorded by (Staff) ───────────────────────────────────
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ── Reading Date ──────────────────────────────────────────
    readingDate: {
      type: Date,
      default: Date.now,
    },

    // ── Notes ─────────────────────────────────────────────────
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Auto-compute consumption before saving
waterReadingSchema.pre("save", function (next) {
  this.consumption = this.currentReading - this.previousReading;
  if (this.consumption < 0) this.consumption = 0;
  next();
});

const WaterReading = mongoose.models.WaterReading || mongoose.model("WaterReading", waterReadingSchema);
export default WaterReading;