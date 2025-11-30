// src/routes/authRoutes.js
import express from "express";
import { register, login } from "../controllers/authController.js";
import { authLimiter } from "../middlewares/rateLimit.js";

const router = express.Router();

router.post("/login", authLimiter, login);
router.post("/register", authLimiter, register);

export default router;
