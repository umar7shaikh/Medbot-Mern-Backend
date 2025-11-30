// src/config/db.js
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error("MONGO_URI is not defined in .env");
    }

    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // stop the app if DB fails
  }
};
