const CLEANUP_INTERVAL = 300_000;
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of inMemoryStore) {
      if (now > entry.resetAt) inMemoryStore.delete(key);
    }
  }, CLEANUP_INTERVAL);
  if (timer && typeof timer.unref === "function") timer.unref();
}

export async function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000,
): Promise<boolean> {
  const now = Date.now();
  const entry = inMemoryStore.get(key);
  if (!entry || now > entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  const nextCount = entry.count + 1;
  entry.count = nextCount;
  return nextCount <= maxRequests;
}
