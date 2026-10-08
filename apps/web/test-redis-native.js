const { createClient } = require('redis');

async function testRedis() {
  const redisUrl = process.env.REDIS_URL || 'rediss://default:gQAAAAAAAxlmAAIgcDEzZjYyOGU4ODIwMmY0YTdhYTgwZDU3Y2M0N2QxYWIzNw@excited-raven-203110.upstash.io:6379';
  const isTls = redisUrl.startsWith('rediss://');
  
  const client = createClient({
    url: redisUrl,
    socket: isTls ? { tls: true, rejectUnauthorized: false } : undefined,
  });

  client.on('error', (err) => console.log('Redis Client Error', err));

  try {
    await client.connect();
    await client.set('test-key', 'BMS-Redis-Working', { EX: 10 });
    const val = await client.get('test-key');
    console.log("Redis Value retrieved:", val);
    
    if (val === 'BMS-Redis-Working') {
      console.log("SUCCESS: Redis connection and operations verified.");
    } else {
      console.log("ERROR: Value mismatch.");
    }
  } catch(e) {
    console.error("Connection Failed:", e.message);
  } finally {
    await client.quit();
  }
}

testRedis();
