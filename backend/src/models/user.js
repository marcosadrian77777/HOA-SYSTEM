// ============================================================
// src/models/User.js
// ============================================================
// Blueprint for how a user is saved in MongoDB.
// ============================================================

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // ── Basic Info ────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },

    // ── Password ──────────────────────────────────────────────
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 8,
      select: false, // Hidden from query results by default (security)
    },

    // ── Role ──────────────────────────────────────────────────
    role: {
      type: String,
      enum: ["homeowner", "staff_admin", "hoa_admin"],
      default: "homeowner",
    },

    // ── Status ────────────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // Auto-adds createdAt and updatedAt
);

// ── Hash password before saving ───────────────────────────────
// Runs every time a user is saved.
// Converts "password123" → "$2a$12$abc...xyz" (cannot be reversed)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Compare passwords during login ───────────────────────────
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ── Return user data without password ────────────────────────
//  Sending user data to the frontend.
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    username: this.username,
    role: this.role,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
  };
};

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;