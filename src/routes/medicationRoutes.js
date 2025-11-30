// src/routes/medicationRoutes.js
import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createMedication,
  getMyMedications,
  getPatientMedications,
  updateMedicationStatus,
} from "../controllers/medicationController.js";

const router = express.Router();

// doctor creates prescriptions
router.post("/", protect, createMedication);

// patient sees own meds
router.get("/my", protect, getMyMedications);

// doctor sees a patient's meds
router.get("/patient/:patientId", protect, getPatientMedications);

// doctor or patient updates status
router.patch("/:id/status", protect, updateMedicationStatus);

export default router;
