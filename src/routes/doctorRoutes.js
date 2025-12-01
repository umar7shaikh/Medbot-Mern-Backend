// src/routes/doctorRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  upsertMyAvailability,
  getDoctorAvailabilityForDate,
  getDoctors, getMyAvailability, 
} from "../controllers/doctorController.js";

const router = express.Router();

// doctor gets own weekly schedule
router.get("/me/availability", protect, getMyAvailability);

// doctor manages own availability
router.post("/me/availability", protect, upsertMyAvailability);

// patients/doctors read availability for a specific doctor
router.get("/:id/availability", protect, getDoctorAvailabilityForDate);

router.get("/", protect, getDoctors);

export default router;
