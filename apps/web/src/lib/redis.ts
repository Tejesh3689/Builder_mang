import { createClient, RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let client: RedisClientType | null = null;

try {
  const isTls = redisUrl.startsWith('rediss://');
  
  client = createClient({
    url: redisUrl,
    socket: isTls ? {
      tls: true,
      rejectUnauthorized: false
    } : undefined,
    // Fail commands immediately while disconnected instead of queueing them forever
    // (a queued GET used to hang every login when Redis was down).
    disableOfflineQueue: true,
  });

  client.on('error', (err) => {
    // Avoid crashing in environments where Redis isn't running immediately
    console.warn('Redis Client Connection Warning/Error:', err.message);
  });

  if (process.env.NODE_ENV !== 'test') {
    client.connect().catch((err) => {
      console.error('Failed to connect to Redis:', err);
    });
  }
} catch (error) {
  console.error('Failed to initialize Redis client:', error);
  client = null as any; // We'll return null to let downstream degrade gracefully
}

// Export a proxy or just the client. Since downstream uses redis.isOpen or redis.get,
// let's export a mock interface if client is null to avoid crashing downstream.
export const redis = client || {
  isOpen: false,
  isReady: false,
  get: async () => null,
  set: async () => null,
  incr: async () => 1,
  expire: async () => null,
  del: async () => null,
  connect: async () => null,
  on: () => null,
} as any;

export default redis;
