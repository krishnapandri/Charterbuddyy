import { errorLogs } from '../shared/schema';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function createErrorLogTable() {
  try {
    console.log('Creating error_logs table...');
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS error_logs (
        id SERIAL PRIMARY KEY,
        error_message TEXT NOT NULL,
        error_stack TEXT,
        user_id INTEGER,
        metadata JSONB,
        route TEXT,
        method TEXT,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('Successfully created error_logs table');
  } catch (error) {
    console.error('Error creating error_logs table:', error);
  }
}

// Run the migration
createErrorLogTable()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });