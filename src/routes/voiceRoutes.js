import express from "express";
import multer from "multer";
import fs from "fs";
import { protect } from "../middlewares/authMiddleware.js";
import { transcribeAudioFile } from "../services/groqAudioService.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `voice-${Date.now()}.webm`);
  },
});

const upload = multer({ storage });

router.post("/transcribe", protect, upload.single("audio"), async (req, res) => {
  console.log("HIT /api/voice/transcribe");

  try {
    console.log("req.user:", req.user);
    console.log("req.file:", req.file);

    if (!req.file) {
      console.log("NO FILE RECEIVED");
      return res.status(400).json({ message: "audio file is required (field name: audio)" });
    }

    console.log("Calling transcribeAudioFile with:", req.file.path);
    const text = await transcribeAudioFile(req.file.path);
    console.log("Whisper text:", text);

    // FIXED: make unlink non-blocking
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Cleanup failed:', err);
    });

    console.log("SENDING RESPONSE:", { text }); // Add this log
    return res.json({ text });
  } catch (err) {
    console.error("Voice transcribe error FULL:", err);
    return res.status(500).json({ message: "Transcription failed" });
  }
});



export default router;
