// src/server.js
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'

import { connectDB } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import chatRoutes from './routes/chatRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import { authLimiter } from './middlewares/rateLimit.js'
import { requestLogger } from './middlewares/requestLogger.js'
import logger from './utils/logger.js'
import voiceRoutes from './routes/voiceRoutes.js'
import appointmentRoutes from './routes/appointmentRoutes.js'
import doctorRoutes from './routes/doctorRoutes.js'
import medicationRoutes from './routes/medicationRoutes.js'

const app = express()

// Security headers
app.use(helmet())

// CORS with env-based origins (Render/Vercel friendly)
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      // allow tools like Postman / server-to-server with no origin
      if (!origin) return callback(null, true)
      if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)

// Other middlewares
app.use(requestLogger)
app.use(express.json({ limit: '50mb' })) // allow base64 payloads
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Static for any saved images if you choose to store them
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/voice', voiceRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/medications', medicationRoutes)

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MedBot backend running' })
})

// Start server only after DB is connected
const PORT = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()
    logger.info('✅ MongoDB connected')
    app.listen(PORT, () => {
      logger.info(`🚀 Server listening on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Failed to start server', { error: error.message })
    process.exit(1)
  }
}

startServer()
