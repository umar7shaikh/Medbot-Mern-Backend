// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6 },
    preferredLanguage: { type: String, default: "en" },

    // NEW: role-based access
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },

    // Optional: doctor-specific status and basic profile fields
    doctorStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    specialization: { type: String, trim: true },
    clinicName: { type: String, trim: true },
  },
  { timestamps: true }
);

// hash password manually in controller

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model("User", userSchema);
