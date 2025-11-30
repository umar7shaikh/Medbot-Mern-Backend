// src/models/Conversation.js
import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New conversation" },
    language: { type: String, default: "en" },
    tokensUsed: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    visionCount: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const Conversation = mongoose.model(
  "Conversation",
  conversationSchema
);
