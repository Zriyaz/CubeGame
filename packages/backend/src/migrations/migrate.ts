import 'dotenv/config';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { connectDatabase, getPool, disconnectDatabase } from '../config/database';
import { logger } from '../utils/logger';

interface Migration {
  id: number;
  filename: string;
  applied_at: Date;
}

async function runMigrations() {
  try {
    logger.info('Starting database migrations...');
    
    // Connect to database
    await connectDatabase();
    const pool = getPool();
    
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get list of applied migrations
    const appliedResult = await pool.query<Migration>('SELECT filename FROM migrations');
    const appliedMigrations = new Set(appliedResult.rows.map(row => row.filename));
    
    // Get list of migration files
    const migrationsDir = __dirname;
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (!appliedMigrations.has(file)) {
        logger.info(`Running migration: ${file}`);
        
        const filePath = join(migrationsDir, file);
        const sql = readFileSync(filePath, 'utf-8');
        
        // Start transaction
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // Run migration
          await client.query(sql);
          
          // Record migration
          await client.query(
            'INSERT INTO migrations (filename) VALUES ($1)',
            [file]
          );
          
          await client.query('COMMIT');
          logger.info(`Migration ${file} completed successfully`);
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      } else {
        logger.info(`Migration ${file} already applied, skipping...`);
      }
    }
    
    logger.info('All migrations completed successfully');
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };