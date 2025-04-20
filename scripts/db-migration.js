// Database migration script to add subscription and payment functionality
import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';
dotenv.config();

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    console.log('Starting database migration...');
    
    // 1. Add is_premium and razorpay_customer_id to users table
    console.log('Adding is_premium and razorpay_customer_id to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT
    `);
    
    // 2. Create payments table if it doesn't exist
    console.log('Creating payments table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL DEFAULT 'INR',
        razorpay_payment_id TEXT,
        razorpay_order_id TEXT NOT NULL,
        razorpay_signature TEXT,
        metadata JSONB,
        plan_type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    
    // 3. Create subscriptions table if it doesn't exist
    console.log('Creating subscriptions table if not exists...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'active',
        plan_type TEXT NOT NULL,
        metadata JSONB,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        end_date TIMESTAMP WITH TIME ZONE NOT NULL,
        auto_renew BOOLEAN NOT NULL DEFAULT false,
        last_payment_id INTEGER REFERENCES payments(id),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    
    // Commit all the changes
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
    
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
    // Close the pool
    await pool.end();
  }
}

// Run the migration
runMigration()
  .then(() => console.log('Migration script completed'))
  .catch(err => {
    console.error('Migration script failed:', err);
    process.exit(1);
  });

// Add this for ES modules
export { runMigration };