import express from "express";
import {
  sendMessage,
  getConversationMessages,
  getUserConversations,
  sendVisionMessage,
} from "../controllers/chatController.js";
import { protect } from "../middlewares/authMiddleware.js";
import { chatLimiter, visionLimiter } from "../middlewares/rateLimit.js";

const router = express.Router();

// text chat
router.post("/", protect, chatLimiter, sendMessage);

// vision chat
router.post("/vision", protect, visionLimiter, sendVisionMessage);

// list & get conversations
router.get("/", protect, chatLimiter, getUserConversations);
router.get("/:id", protect, chatLimiter, getConversationMessages);

export default router;
