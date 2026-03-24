// ============================================================
// src/utils/encryption.js
// ============================================================
// Scrambles sensitive data before saving to the database.
// Uses AES-256-GCM — the same encryption used by banks.
// Node.js has this built in — no extra package needed.
//
// Usage anywhere in your project:
//   import { encrypt, decrypt } from "../utils/encryption.js";
//
//   const safe = encrypt("09171234567");   // before saving to DB
//   const real = decrypt(safe);            // when reading from DB
// ============================================================

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;

const getKey = () => {
  const rawKey = process.env.AES_SECRET_KEY || "fallback_key_change_in_production!";
  return crypto.createHash("sha256").update(rawKey).digest();
};

// Scrambles plain text → unreadable encrypted string
export const encrypt = (plainText) => {
  if (!plainText) return null;

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(String(plainText), "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  // Stored as: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

// Converts encrypted string back to readable text
export const decrypt = (encryptedText) => {
  if (!encryptedText) return null;

  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getKey();

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;

  } catch (error) {
    console.error("❌ Decryption failed:", error.message);
    return null;
  }
};