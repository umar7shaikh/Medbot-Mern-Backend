// src/utils/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import fs from 'fs';
import path from 'path';

const logDir = './logs';

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom production format
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata(),
  winston.format.json()
);

// Custom development format
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    const meta = metadata ? JSON.stringify(metadata) : '';
    return `${timestamp} [${level}]: ${message} ${meta}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  defaultMeta: { service: 'medbot-api' },
  transports: [
    // Daily rotating file logs
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE-.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
    // Error logs separate
    new DailyRotateFile({
      level: 'error',
      filename: path.join(logDir, 'error-%DATE-.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxFiles: '30d'
    })
  ]
});

// Console transport
logger.add(new winston.transports.Console({
  format: process.env.NODE_ENV === 'production' 
    ? winston.format.simple() 
    : developmentFormat
}));

export default logger;
