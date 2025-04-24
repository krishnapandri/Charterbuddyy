import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve('.env') });

// Ensure DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function addNotificationPreferencesColumn() {
  try {
    const client = await pool.connect();
    
    try {
      // Begin transaction
      await client.query('BEGIN');
      
      console.log('Adding notification_preferences column to users table...');
      
      // Check if column already exists
      const checkColumnResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='users' AND column_name='notification_preferences'
      `);
      
      if (checkColumnResult.rows.length === 0) {
        // Add the column if it doesn't exist
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN notification_preferences JSONB DEFAULT '{"practiceReminders": true, "newContentAlerts": true, "progressUpdates": false}'
        `);
        console.log('Column added successfully!');
      } else {
        console.log('Column already exists, skipping creation.');
      }
      
      // Commit transaction
      await client.query('COMMIT');
      console.log('Migration completed successfully!');
    } catch (error) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Migration failed:', error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
addNotificationPreferencesColumn().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});