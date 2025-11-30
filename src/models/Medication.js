// src/models/Medication.js
import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
    },

    drugName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true }, // e.g. "500 mg"
    frequencyPerDay: { type: Number, required: true, min: 1 }, // e.g. 3
    timesOfDay: {
      type: [String], // ["08:00","14:00","20:00"]
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: "timesOfDay must have at least one time",
      },
    },
    route: {
      type: String,
      enum: ["oral", "injection", "topical", "inhalation", "other"],
      default: "oral",
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date }, // optional, for ongoing meds

    instructions: { type: String, trim: true, maxlength: 500 },

    status: {
      type: String,
      enum: ["active", "completed", "stopped"],
      default: "active",
    },
  },
  { timestamps: true }
);

export const Medication = mongoose.model("Medication", medicationSchema);
