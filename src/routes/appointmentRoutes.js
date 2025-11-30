// src/routes/appointmentRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createAppointment,
  getMyAppointments,
  getDoctorAppointments,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";

const router = express.Router();

// patient books & views own appointments
router.post("/", protect, createAppointment);
router.get("/my", protect, getMyAppointments);

// doctor views their appointments
router.get("/doctor", protect, getDoctorAppointments);

// doctor/admin updates appointment status
router.patch("/:id/status", protect, updateAppointmentStatus);

export default router;
