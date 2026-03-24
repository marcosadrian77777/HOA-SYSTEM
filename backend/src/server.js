// ============================================================
// src/server.js
// ============================================================
// This is the entry point of the backend.
// It connects to MongoDB then starts the Express server.
// Run with: npm run dev
// ============================================================

import { setServers } from "node:dns/promises";

setServers(["1.1.1.1", "8.8.8.8"]);

import "dotenv/config";           // Loads your .env file
import mongoose from "mongoose";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("⏳ Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
      console.log("\n📌 Available endpoints:");
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/me`);
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("💡 Fix: Check your MONGO_URI in the .env file");
    process.exit(1);
  }
};

startServer();
