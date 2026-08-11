import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({
  url: redisUrl,
});

redis.on('error', (err) => {
  // Avoid crashing in environments where Redis isn't running immediately
  console.warn('Redis Client Connection Warning/Error:', err.message);
});

if (!redis.isOpen && process.env.NODE_ENV !== 'test') {
  redis.connect().catch((err) => {
    console.error('Failed to connect to Redis:', err);
  });
}

export default redis;
