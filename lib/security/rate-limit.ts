type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit = 60, refillMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key) || { tokens: limit, lastRefill: now };

  const elapsed = now - bucket.lastRefill;
  if (elapsed >= refillMs) {
    bucket.tokens = limit;
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}
