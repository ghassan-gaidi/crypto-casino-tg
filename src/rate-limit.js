"use strict";
// ── In-memory sliding-window rate limiter ──
// Works on Vercel because function instances are reused within a region.
// Not perfect across cold starts but effective against abuse.

const windows = new Map(); // key → { count, resetTime }
const CLEANUP_INTERVAL = 60_000; // purge expired entries every 60s
let lastCleanup = Date.now();

function cleanup(now) {
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of windows) {
    if (now > entry.resetTime) windows.delete(key);
  }
}

/**
 * Check rate limit for a key.
 * @param {string} key - unique identifier (IP, userId, etc.)
 * @param {number} maxRequests - max allowed in window
 * @param {number} windowMs - window duration in ms
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  cleanup(now);

  const entry = windows.get(key);
  if (!entry || now > entry.resetTime) {
    // New window
    windows.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, retryAfterMs: entry.resetTime - now };
  }
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 };
}

/**
 * Apply rate limit headers and return 429 if exceeded.
 * @param {object} res - HTTP response object
 * @param {string} key - rate limit key
 * @param {number} maxRequests
 * @param {number} windowMs
 * @returns {boolean} true if request should continue, false if 429 sent
 */
function rateLimit(res, key, maxRequests, windowMs) {
  const { allowed, remaining, retryAfterMs } = checkRateLimit(key, maxRequests, windowMs);
  res.setHeader('X-RateLimit-Limit', String(maxRequests));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil((Date.now() + windowMs) / 1000)));
  if (!allowed) {
    res.setHeader('Retry-After', String(Math.ceil(retryAfterMs / 1000)));
    res.status(429).json({
      error: 'Too many requests',
      retryAfterMs,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    });
    return false;
  }
  return true;
}

/**
 * Extract client IP from request.
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return first.split(',')[0].trim();
  }
  return req.headers['x-real-ip'] || 'unknown';
}

/**
 * Pre-configured limiters for different endpoint types.
 */
const limiters = {
  // General API: 60 requests per minute per IP
  general: (res, req) => {
    const ip = getClientIp(req);
    return rateLimit(res, `general:${ip}`, 60, 60_000);
  },
  // Game plays: 10 per minute per user (stricter)
  game: (res, req, userId) => {
    const key = userId ? `game:u${userId}` : `game:ip:${getClientIp(req)}`;
    return rateLimit(res, key, 10, 60_000);
  },
  // Deposit/withdraw: 5 per minute per user (very strict)
  financial: (res, req, userId) => {
    const key = userId ? `fin:u${userId}` : `fin:ip:${getClientIp(req)}`;
    return rateLimit(res, key, 5, 60_000);
  },
  // Auth endpoints: 10 per minute per IP
  auth: (res, req) => {
    const ip = getClientIp(req);
    return rateLimit(res, `auth:${ip}`, 10, 60_000);
  },
};

module.exports = { checkRateLimit, rateLimit, getClientIp, limiters };
