// src/middlewares/requestLogger.js
import logger from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?._id,
      contentLength: req.headers['content-length']
    });
  });
  
  next();
};
