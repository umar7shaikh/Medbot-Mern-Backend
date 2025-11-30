// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { authLimiter } from "./middlewares/rateLimit.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import logger from "./utils/logger.js";
import voiceRoutes from "./routes/voiceRoutes.js";


const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(requestLogger);
app.use(express.json({ limit: "50mb" })); // allow base64 payloads
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// static for any saved images if you choose to store them
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"))
);

// routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/voice", voiceRoutes);


// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "MedBot backend running" });
});

// Start server only after DB is connected
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    logger.info('✅ MongoDB connected');
    app.listen(PORT, () => {
      logger.info(`🚀 Server listening on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

startServer();
