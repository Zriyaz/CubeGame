import pg from 'pg';
import { logger } from '../utils/logger';

const { Pool } = pg;

let pool: pg.Pool;

export const connectDatabase = async (): Promise<void> => {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    await pool.query('SELECT 1');
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed:', error);
    // Don't exit for now, just log the error
    // In production, you might want to retry or exit
  }
};

export const getPool = (): pg.Pool => {
  if (!pool) {
    throw new Error('Database not initialized. Call connectDatabase first.');
  }
  return pool;
};

export const disconnectDatabase = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    logger.info('Database disconnected');
  }
};