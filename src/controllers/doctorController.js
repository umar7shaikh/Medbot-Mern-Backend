// src/controllers/doctorController.js
import { DoctorAvailability } from "../models/DoctorAvailability.js";
import { Appointment } from "../models/Appointment.js";

// ensure user has doctor role
const ensureDoctor = (user) => user.role === "doctor";

// doctor sets or replaces their weekly availability
// POST /api/doctors/me/availability
export const upsertMyAvailability = async (req, res) => {
  try {
    if (!ensureDoctor(req.user)) {
      return res.status(403).json({ message: "Only doctors can set availability" });
    }

    const { slotDurationMinutes, days } = req.body;

    if (!Array.isArray(days)) {
      return res.status(400).json({ message: "days must be an array" });
    }

    // basic validation: each dayOfWeek 0–6, times non-empty
    for (const day of days) {
      if (
        typeof day.dayOfWeek !== "number" ||
        day.dayOfWeek < 0 ||
        day.dayOfWeek > 6
      ) {
        return res.status(400).json({ message: "Invalid dayOfWeek value" });
      }
      if (!Array.isArray(day.timeRanges) || day.timeRanges.length === 0) {
        return res
          .status(400)
          .json({ message: "Each day must have at least one time range" });
      }
    }

    const doc = await DoctorAvailability.findOneAndUpdate(
      { doctor: req.user._id },
      {
        doctor: req.user._id,
        slotDurationMinutes: slotDurationMinutes || 30,
        days,
      },
      { upsert: true, new: true }
    );

    return res.json(doc);
  } catch (err) {
    console.error("Upsert availability error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// helper: turn "09:00" + date into Date
const buildDateTime = (dateStr, timeStr) => {
  const [h, m] = timeStr.split(":").map(Number);
  const base = new Date(dateStr);
  base.setUTCHours(h, m, 0, 0);
  return base;
};

// GET /api/doctors/:id/availability?date=YYYY-MM-DD
// returns available time slots for that doctor on that date
export const getDoctorAvailabilityForDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date query param is required" });
    }

    const dayDate = new Date(date);
    if (isNaN(dayDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const dayOfWeek = dayDate.getUTCDay();

    const availability = await DoctorAvailability.findOne({ doctor: id });
    if (!availability) {
      return res.json({ slots: [] });
    }

    const dayConfig = availability.days.find(
      (d) => d.dayOfWeek === dayOfWeek
    );
    if (!dayConfig) {
      return res.json({ slots: [] });
    }

    const slotDuration = availability.slotDurationMinutes || 30;

    // fetch existing appointments for that doctor on that day
    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCHours(23, 59, 59, 999);

    const existing = await Appointment.find({
      doctor: id,
      status: { $in: ["pending", "confirmed"] },
      startAt: { $gte: dayStart, $lte: dayEnd },
    }).select("startAt durationMinutes");

    const takenIntervals = existing.map((a) => {
      const start = a.startAt;
      const end = new Date(start.getTime() + a.durationMinutes * 60000);
      return { start, end };
    });

    const slots = [];

    for (const range of dayConfig.timeRanges) {
      let slotStart = buildDateTime(date, range.startTime);
      const rangeEnd = buildDateTime(date, range.endTime);

      while (slotStart < rangeEnd) {
        const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);

        // skip if beyond working range
        if (slotEnd > rangeEnd) break;

        // check overlap with existing appointments
        const conflict = takenIntervals.some(
          ({ start, end }) => slotStart < end && slotEnd > start
        );

        if (!conflict) {
          slots.push({
            startAt: slotStart.toISOString(),
            endAt: slotEnd.toISOString(),
          });
        }

        slotStart = slotEnd;
      }
    }

    return res.json({ slots });
  } catch (err) {
    console.error("Get availability slots error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
