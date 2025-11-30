// src/controllers/medicationController.js
import { Medication } from "../models/Medication.js";
import { User } from "../models/User.js";
import { Appointment } from "../models/Appointment.js";

const ensureRole = (user, roles) => roles.includes(user.role);

// POST /api/medications
// doctor prescribes medication for a patient
export const createMedication = async (req, res) => {
  try {
    if (!ensureRole(req.user, ["doctor"])) {
      return res
        .status(403)
        .json({ message: "Only doctors can create medications" });
    }

    const {
      patientId,
      appointmentId,
      drugName,
      dosage,
      frequencyPerDay,
      timesOfDay,
      route,
      startDate,
      endDate,
      instructions,
    } = req.body;

    if (
      !patientId ||
      !drugName ||
      !dosage ||
      !frequencyPerDay ||
      !timesOfDay ||
      !startDate
    ) {
      return res.status(400).json({
        message:
          "patientId, drugName, dosage, frequencyPerDay, timesOfDay, and startDate are required",
      });
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(400).json({ message: "Invalid patient" });
    }

    if (appointmentId) {
      const appt = await Appointment.findById(appointmentId);
      if (!appt) {
        return res.status(400).json({ message: "Invalid appointmentId" });
      }
    }

    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ message: "Invalid startDate" });
    }

    let end = null;
    if (endDate) {
      end = new Date(endDate);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid endDate" });
      }
      if (end < start) {
        return res
          .status(400)
          .json({ message: "endDate cannot be before startDate" });
      }
    }

    const med = await Medication.create({
      patient: patientId,
      doctor: req.user._id,
      appointment: appointmentId || undefined,
      drugName,
      dosage,
      frequencyPerDay,
      timesOfDay,
      route: route || "oral",
      startDate: start,
      endDate: end || undefined,
      instructions,
      status: "active",
    });

    return res.status(201).json(med);
  } catch (err) {
    console.error("Create medication error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/medications/my
// patient views own medications
export const getMyMedications = async (req, res) => {
  try {
    if (!ensureRole(req.user, ["patient"])) {
      return res.status(403).json({ message: "Only patients can view this" });
    }

    const { status } = req.query; // optional filter
    const filter = { patient: req.user._id };
    if (status) filter.status = status;

    const meds = await Medication.find(filter)
      .populate("doctor", "name email")
      .sort({ createdAt: -1 });

    return res.json(meds);
  } catch (err) {
    console.error("Get my medications error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/medications/patient/:patientId
// doctor views medications for a specific patient
export const getPatientMedications = async (req, res) => {
  try {
    if (!ensureRole(req.user, ["doctor"])) {
      return res
        .status(403)
        .json({ message: "Only doctors can view patient medications" });
    }

    const { patientId } = req.params;
    const { status } = req.query;

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(400).json({ message: "Invalid patient" });
    }

    const filter = { patient: patientId };
    if (status) filter.status = status;

    const meds = await Medication.find(filter)
      .populate("doctor", "name email")
      .sort({ createdAt: -1 });

    return res.json(meds);
  } catch (err) {
    console.error("Get patient medications error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/medications/:id/status
// doctor or patient updates status (e.g., active -> completed/stopped)
export const updateMedicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "completed", "stopped"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const med = await Medication.findById(id);
    if (!med) {
      return res.status(404).json({ message: "Medication not found" });
    }

    const isDoctorOwner =
      req.user.role === "doctor" &&
      med.doctor.toString() === req.user._id.toString();
    const isPatientOwner =
      req.user.role === "patient" &&
      med.patient.toString() === req.user._id.toString();

    if (!isDoctorOwner && !isPatientOwner) {
      return res.status(403).json({ message: "Not allowed to update" });
    }

    med.status = status;
    await med.save();

    return res.json(med);
  } catch (err) {
    console.error("Update medication status error:", err.message);
    return res.status(500).json({ message: "Server error" });
  }
};
