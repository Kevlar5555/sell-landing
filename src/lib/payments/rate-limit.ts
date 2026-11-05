type Bucket = { count: number; resetAt: number };

const globalRate = globalThis as unknown as {
  __knotRateLimit?: Map<string, Bucket>;
};

function getBuckets(): Map<string, Bucket> {
  if (!globalRate.__knotRateLimit) {
    globalRate.__knotRateLimit = new Map();
  }
  return globalRate.__knotRateLimit;
}

/** Simple fixed-window limiter. Returns retry-after seconds when blocked. */
export function takeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const buckets = getBuckets();
  const current = buckets.get(key);

  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return { ok: true };
}
