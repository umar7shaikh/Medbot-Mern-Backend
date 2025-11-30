// src/controllers/appointmentController.js
import { Appointment } from "../models/Appointment.js";
import { User } from "../models/User.js";

// helper: ensure current user has a specific role
const ensureRole = (user, roles) => roles.includes(user.role);

// helper to get start/end of a day for a given date
const getDayRange = (date) => {
  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCHours(23, 59, 59, 999);
  return { dayStart, dayEnd };
};

// max active appointments per patient per day
const MAX_APPOINTMENTS_PER_DAY = 3;

// POST /api/appointments
// patient books a new appointment with a doctor
export const createAppointment = async (req, res) => {
  try {
    const { doctorId, startAt, durationMinutes, reason, locationType } =
      req.body;

    if (!doctorId || !startAt) {
      return res
        .status(400)
        .json({ message: "doctorId and startAt are required" });
    }

    if (!ensureRole(req.user, ["patient"])) {
      return res.status(403).json({ message: "Only patients can book" });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(400).json({ message: "Invalid doctor" });
    }

    const startTime = new Date(startAt);
    if (isNaN(startTime.getTime())) {
      return res.status(400).json({ message: "Invalid startAt date" });
    }

    // 1) prevent booking in the past (allow small 5 minute buffer)
    const now = new Date();
    const bufferMs = 5 * 60 * 1000;
    if (startTime.getTime() < now.getTime() + bufferMs) {
      return res
        .status(400)
        .json({ message: "Cannot book an appointment in the past" });
    }

    const duration = durationMinutes || 30;
    const endTime = new Date(startTime.getTime() + duration * 60000);

    // 2) limit appointments per patient per day
    const { dayStart, dayEnd } = getDayRange(startTime);

    const patientDailyCount = await Appointment.countDocuments({
      patient: req.user._id,
      startAt: { $gte: dayStart, $lte: dayEnd },
      status: { $in: ["pending", "confirmed"] },
    });

    if (patientDailyCount >= MAX_APPOINTMENTS_PER_DAY) {
      return res.status(400).json({
        message: `Daily limit reached: maximum ${MAX_APPOINTMENTS_PER_DAY} active appointments per day`,
      });
    }

    // 3) existing check: prevent double-booking for this doctor
    const conflict = await Appointment.findOne({
      doctor: doctorId,
      status: { $in: ["pending", "confirmed"] },
      startAt: { $lt: endTime },
      $expr: {
        $gt: [
          {
            $add: ["$startAt", { $multiply: ["$durationMinutes", 60000] }],
          },
          startTime,
        ],
      },
    });

    if (conflict) {
      return res
        .status(409)
        .json({ message: "Time slot not available for this doctor" });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      startAt: startTime,
      durationMinutes: duration,
      reason,
      locationType: locationType || "clinic",
      status: "pending",
    });

    return res.status(201).json(appointment);
  } catch (err) {
    console.error("Create appointment error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/appointments/my
// patient gets their own appointments
export const getMyAppointments = async (req, res) => {
  try {
    if (!ensureRole(req.user, ["patient"])) {
      return res.status(403).json({ message: "Only patients can view this" });
    }

    const appointments = await Appointment.find({ patient: req.user._id })
      .populate("doctor", "name email specialization")
      .sort({ startAt: -1 });

    return res.json(appointments);
  } catch (err) {
    console.error("Get my appointments error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/appointments/doctor
// doctor sees appointments assigned to them
export const getDoctorAppointments = async (req, res) => {
  try {
    if (!ensureRole(req.user, ["doctor"])) {
      return res.status(403).json({ message: "Only doctors can view this" });
    }

    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate("patient", "name email")
      .sort({ startAt: -1 });

    return res.json(appointments);
  } catch (err) {
    console.error("Get doctor appointments error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/appointments/:id/status
// doctor/admin update; patients can cancel their own within time window
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const isDoctorOwner =
      req.user.role === "doctor" &&
      appointment.doctor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const isPatientOwner =
      req.user.role === "patient" &&
      appointment.patient.toString() === req.user._id.toString();

    // cancellation window: at least 2 hours before start
    const CANCELLATION_HOURS_BEFORE = 2;

    if (status === "cancelled") {
      if (isPatientOwner) {
        const now = new Date();
        const startTime = appointment.startAt;
        const diffHours =
          (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < CANCELLATION_HOURS_BEFORE) {
          return res.status(400).json({
            message: `Cannot cancel less than ${CANCELLATION_HOURS_BEFORE} hours before start time`,
          });
        }
      } else if (!isDoctorOwner && !isAdmin) {
        return res.status(403).json({ message: "Not allowed to cancel" });
      }
    } else {
      // other status changes (confirm/complete) only by doctor or admin
      if (!isDoctorOwner && !isAdmin) {
        return res.status(403).json({ message: "Not allowed to update" });
      }
    }

    appointment.status = status;
    await appointment.save();

    return res.json(appointment);
  } catch (err) {
    console.error("Update appointment status error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
