import { Redis } from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis;

export const connectRedis = async (): Promise<void> => {
  try {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('error', (error) => {
      logger.error('Redis error:', error);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    // Test the connection
    await redisClient.ping();
  } catch (error) {
    logger.error('Redis connection failed:', error);
    // Don't exit for now, just log the error
  }
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call connectRedis first.');
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis disconnected');
  }
};