// src/models/Message.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    sender: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: { type: String, required: true },
    language: { type: String, default: "en" },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", messageSchema);
