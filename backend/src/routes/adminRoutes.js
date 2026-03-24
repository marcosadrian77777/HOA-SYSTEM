import express from "express";
import User from "../models/user.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = express.Router();

// GET all users — HOA Admin only
router.get("/users", protect, restrictTo("hoa_admin"), async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => u.toSafeObject()),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
});

// PATCH toggle user active/inactive
router.patch("/users/:id/toggle", protect, restrictTo("hoa_admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account." });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
      user: user.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update user status." });
  }
});

// PATCH change user role
router.patch("/users/:id/role", protect, restrictTo("hoa_admin"), async (req, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["homeowner", "staff_admin", "hoa_admin"];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot change your own role." });
    }
    user.role = role;
    await user.save();
    res.status(200).json({
      success: true,
      message: `Role updated to ${role}.`,
      user: user.toSafeObject(),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update role." });
  }
});

// DELETE a user
router.delete("/users/:id", protect, restrictTo("hoa_admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account." });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete user." });
  }
});

export default router;