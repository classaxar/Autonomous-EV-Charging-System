const { error } = require('../utils/envelope');

/**
 * In-memory IP rate limiter
 * Limit: 100 requests per minute per IP per TASKBOOK A-11
 */
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const maxRequests = options.max || 100; // 100 requests
  const ipHits = new Map();

  // Periodically clean up expired entries every minute
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipHits.entries()) {
      if (now - record.startTime > windowMs) {
        ipHits.delete(ip);
      }
    }
  }, windowMs);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let record = ipHits.get(clientIp);

    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      ipHits.set(clientIp, record);
    } else {
      record.count += 1;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil((record.startTime + windowMs) / 1000));

    if (record.count > maxRequests) {
      return error(res, 'Rate limit exceeded: maximum 100 requests per minute per IP', 429);
    }

    next();
  };
}

module.exports = {
  createRateLimiter,
  defaultRateLimiter: createRateLimiter({ windowMs: 60 * 1000, max: 100 })
};
