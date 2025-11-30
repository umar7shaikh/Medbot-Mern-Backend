// src/routes/doctorRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  upsertMyAvailability,
  getDoctorAvailabilityForDate,
} from "../controllers/doctorController.js";

const router = express.Router();

// doctor manages own availability
router.post("/me/availability", protect, upsertMyAvailability);

// patients/doctors read availability for a specific doctor
router.get("/:id/availability", protect, getDoctorAvailabilityForDate);

export default router;
