import Redis from 'ioredis';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('No REDIS_URL');
  const redis = new Redis(url);
  await redis.del('platform:config');
  console.log('Deleted platform:config key');
  redis.quit();
}

run().catch(console.error);
