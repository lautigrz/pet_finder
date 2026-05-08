import IORedis from 'ioredis';

export const redisConnection = new IORedis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    maxRetriesPerRequest: null, // reintentos indefinidos
})