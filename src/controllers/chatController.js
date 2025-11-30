// src/controllers/chatController.js
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import {
  generateTextReply,
  generateVisionReply,
} from "../services/groqService.js";
import logger from "../utils/logger.js";
import { elevenTextToSpeechBuffer } from "../services/elevenTtsService.js";

export const sendMessage = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { message, language, conversationId } = req.body;
    const userId = req.user._id;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        user: userId,
      });
    }

    const effectiveLang =
      language || conversation?.language || req.user.preferredLanguage || "en";

    if (!conversation) {
      conversation = await Conversation.create({
        user: userId,
        language: effectiveLang,
        title: message.slice(0, 40),
      });
    }

    const userMsg = await Message.create({
      conversation: conversation._id,
      sender: "user",
      content: message,
      language: effectiveLang,
    });

    const replyText = await generateTextReply({
      message,
      language: effectiveLang,
      user: req.user,
    });

    const assistantMsg = await Message.create({
      conversation: conversation._id,
      sender: "assistant",
      content: replyText,
      language: effectiveLang,
    });

    const estimatedTokens = Math.ceil((message.length + replyText.length) / 4);
    conversation.messageCount += 1;
    conversation.tokensUsed += estimatedTokens;
    conversation.lastActivity = new Date();
    await conversation.save();

    let audioBuffer = null;
    try {
      audioBuffer = await elevenTextToSpeechBuffer(replyText);
    } catch (e) {
      logger.error("TTS error (chat)", {
        error: e.message,
        userId: req.user?._id,
      });
      // still return text even if TTS fails
    }

    return res.status(201).json({
      conversationId: conversation._id,
      messages: [userMsg, assistantMsg],
      audioBase64: audioBuffer ? audioBuffer.toString("base64") : null,
      audioMimeType: audioBuffer ? "audio/mpeg" : null, // if ElevenLabs returns mp3
    });
  } catch (err) {
    logger.error("Chat error", {
      error: err.message,
      userId: req.user?._id,
    });
    return res.status(500).json({ message: "Server error" });
  }
};

export const sendVisionMessage = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const {
      imageBase64,
      mimeType,
      message,
      language,
      conversationId,
    } = req.body;
    const userId = req.user._id;

    if (!imageBase64) {
      return res.status(400).json({ message: "imageBase64 is required" });
    }

    let conversation;

    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        user: userId,
      });
    }

    const effectiveLang =
      language || conversation?.language || req.user.preferredLanguage || "en";

    if (!conversation) {
      conversation = await Conversation.create({
        user: userId,
        language: effectiveLang,
        title: (message || "Image conversation").slice(0, 40),
      });
    }

    const userMsg = await Message.create({
      conversation: conversation._id,
      sender: "user",
      content: message || "[Image only]",
      language: effectiveLang,
    });

    const replyText = await generateVisionReply({
      message,
      imageBase64,
      mimeType: req.imageInfo?.mimeType || mimeType || "image/jpeg",
      language: effectiveLang,
      user: req.user,
    });

    const assistantMsg = await Message.create({
      conversation: conversation._id,
      sender: "assistant",
      content: replyText,
      language: effectiveLang,
    });

    const estimatedTokens = Math.ceil(
      (replyText.length + (message?.length || 0)) / 4
    );
    conversation.messageCount += 1;
    conversation.visionCount += 1;
    conversation.tokensUsed += estimatedTokens;
    conversation.lastActivity = new Date();
    await conversation.save();

    let audioBuffer = null;
    try {
      audioBuffer = await elevenTextToSpeechBuffer(replyText);
    } catch (e) {
      logger.error("TTS error (vision)", {
        error: e.message,
        userId: req.user?._id,
      });
      // return text even if TTS fails
    }

    return res.status(201).json({
      conversationId: conversation._id,
      messages: [userMsg, assistantMsg],
      audioBase64: audioBuffer ? audioBuffer.toString("base64") : null,
      audioMimeType: audioBuffer ? "audio/mpeg" : null,
    });
  } catch (err) {
    logger.error("Vision chat error", {
      error: err.message,
      userId: req.user?._id,
    });
    return res.status(500).json({ message: "Server error" });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const conversation = await Conversation.findOne({
      _id: id,
      user: userId,
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversation: id }).sort({
      createdAt: 1,
    });

    return res.json({ conversation, messages });
  } catch (err) {
    logger.error("Get conversation error", {
      error: err.message,
      userId: req.user?._id,
      conversationId: req.params.id,
    });
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ user: userId }).sort({
      updatedAt: -1,
    });

    return res.json({ conversations });
  } catch (err) {
    logger.error("List conversations error", {
      error: err.message,
      userId: req.user?._id,
    });
    return res.status(500).json({ message: "Server error" });
  }
};
