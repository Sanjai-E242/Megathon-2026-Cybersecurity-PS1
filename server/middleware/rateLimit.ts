import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(key);
    }
  }
}, 300000);

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
}

/**
 * Lightweight sliding-window in-memory rate limiter middleware.
 */
export function createRateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || 60000; // 1 minute window
  const maxRequests = options.maxRequests || 120; // 120 requests per minute

  return (req: Request, res: Response, next: NextFunction): void => {
    // Key by authenticated principal ID or IP address
    const clientKey =
      req.authenticatedPrincipal?.principal_id ||
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'anonymous_client';

    const now = Date.now();
    const existing = rateLimitMap.get(clientKey);

    if (!existing || now > existing.resetAt) {
      rateLimitMap.set(clientKey, {
        count: 1,
        resetAt: now + windowMs,
      });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next();
    }

    if (existing.count >= maxRequests) {
      const retryAfterSec = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${retryAfterSec} seconds.`,
      });
      return;
    }

    existing.count += 1;
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - existing.count);
    return next();
  };
}
