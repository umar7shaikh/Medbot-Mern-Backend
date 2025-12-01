// src/middlewares/rateLimit.js
import rateLimit from 'express-rate-limit';

export const createRateLimiter = (windowMs, maxRequests) => {
  return rateLimit({
    windowMs,
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

// For local dev you can keep these high:
export const authLimiter  = createRateLimiter(15 * 60 * 1000, 100);   // was 10
export const chatLimiter  = createRateLimiter(15 * 60 * 1000, 1000);  // was 50
export const visionLimiter = createRateLimiter(15 * 60 * 1000, 50);   // a bit higher
