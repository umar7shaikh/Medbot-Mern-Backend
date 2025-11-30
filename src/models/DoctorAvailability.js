// src/models/DoctorAvailability.js
import mongoose from "mongoose";

const timeRangeSchema = new mongoose.Schema(
  {
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "13:00"
  },
  { _id: false }
);

const dayAvailabilitySchema = new mongoose.Schema(
  {
    dayOfWeek: {
      type: Number,
      min: 0,
      max: 6,
      required: true, // 0 = Sunday ... 6 = Saturday
    },
    timeRanges: {
      type: [timeRangeSchema],
      default: [],
    },
  },
  { _id: false }
);

const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
      min: 5,
    },
    days: {
      type: [dayAvailabilitySchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const DoctorAvailability = mongoose.model(
  "DoctorAvailability",
  doctorAvailabilitySchema
);
