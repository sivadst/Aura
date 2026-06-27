import Redis from "ioredis";

// Rate limiting utility
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
export const redis = new Redis(redisUrl);

export async function rateLimit(key: string, limit: number, windowSecs: number) {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSecs);
  }
  return {
    success: current <= limit,
    current,
    limit,
    remaining: Math.max(0, limit - current)
  };
}
