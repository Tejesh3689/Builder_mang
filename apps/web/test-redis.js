const { Redis } = require('ioredis');

async function testRedis() {
  console.log("Connecting to Redis...");
  try {
    const redis = new Redis(process.env.REDIS_URL || 'rediss://default:gQAAAAAAAxlmAAIgcDEzZjYyOGU4ODIwMmY0YTdhYTgwZDU3Y2M0N2QxYWIzNw@excited-raven-203110.upstash.io:6379', {
      tls: { rejectUnauthorized: false }
    });
    
    await redis.set('test-key', 'BMS-Redis-Working', 'EX', 10);
    const val = await redis.get('test-key');
    console.log("Redis Value retrieved:", val);
    
    if (val === 'BMS-Redis-Working') {
      console.log("SUCCESS: Redis connection and operations verified.");
    } else {
      console.log("ERROR: Value mismatch.");
    }
    
    await redis.quit();
  } catch (err) {
    console.error("Redis Connection Failed:", err);
  }
}

testRedis();
