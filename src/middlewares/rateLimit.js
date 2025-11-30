// src/middlewares/rateLimit.js
import rateLimit from 'express-rate-limit';

export const createRateLimiter = (windowMs, maxRequests) => {
  return rateLimit({
    windowMs, // ms
    max: maxRequests,
    message: {
      message: `Too many requests. Try again in ${Math.round(windowMs / 60000)} minutes.`,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        message: `Rate limit exceeded. Try again in ${Math.round(windowMs / 60000)} minutes.`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Specific limits
export const authLimiter = createRateLimiter(15 * 60 * 1000, 10);     // 10 requests per 15 min
export const chatLimiter = createRateLimiter(15 * 60 * 1000, 50);     // 50 requests per 15 min
export const visionLimiter = createRateLimiter(15 * 60 * 1000, 10);   // 10 requests per 15 min (expensive)
