import dotenv from 'dotenv';
dotenv.config();
import IORedis from 'ioredis';

export const redisPublisher = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});
