// src/models/Appointment.js
import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    // patient who booked
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // doctor assigned to this appointment
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // when the appointment starts
    startAt: {
      type: Date,
      required: true,
    },

    // duration in minutes (e.g. 30)
    durationMinutes: {
      type: Number,
      default: 30,
      min: 5,
    },

    // basic info about the visit
    reason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    locationType: {
      type: String,
      enum: ["online", "clinic"],
      default: "clinic",
    },

    // appointment status lifecycle
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export const Appointment = mongoose.model("Appointment", appointmentSchema);
