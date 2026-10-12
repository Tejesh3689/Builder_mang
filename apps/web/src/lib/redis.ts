/**
 * Redis client configuration module.
 *
 * This module creates a Redis client using the `redis` library based on the
 * `REDIS_URL` environment variable. It supports TLS connections when the URL
 * starts with `rediss://` and applies a connection timeout of 5 seconds to
 * prevent the application from hanging if Redis is unavailable.
 *
 * The client disables the offline queue so that commands fail fast when the
 * connection is down. Errors are logged as warnings, and a mock fallback is
 * exported to keep the rest of the codebase functional during development or
 * when Redis cannot be reached.
 */
import { createClient, RedisClientType } from 'redis';

/**
 * Exported Redis client instance (or a mock implementation when the client
 * cannot be initialized). Consumers can use `redis.get`, `redis.set`, etc.
 */const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let client: RedisClientType | null = null;

try {
  const isTls = redisUrl.startsWith('rediss://');
  
  client = createClient({
    url: redisUrl,
    socket: isTls ? {
      tls: true,
      rejectUnauthorized: false,
      connectTimeout: 5000,
    } : {
      connectTimeout: 5000,
    },
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
