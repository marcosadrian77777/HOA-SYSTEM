// ============================================================
// src/middleware/auth.js
// ============================================================
// Security guards for the routes.
//
// protect    → checks if user is logged in (has a valid token)
// restrictTo → checks if user has the right role

// ============================================================

import jwt from "jsonwebtoken";
import User from "../models/user.js";

// ── protect 
// Verifies the JWT token from the frontend.
// If valid, attaches the user to req.user so routes can use it.
export const protect = async (req, res, next) => {
  let token;

  // Token comes in the header like: Authorization: Bearer <token>
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. Please log in first.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account not found or deactivated.",
      });
    }

    req.user = user; // Now available in all routes after this middleware
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired. Please log in again.",
    });
  }
};

// ── restrictTo 
// Checks if the logged-in user has the correct role.
// Always use AFTER protect.
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role (${req.user.role}) cannot do this.`,
      });
    }
    next();
  };
};