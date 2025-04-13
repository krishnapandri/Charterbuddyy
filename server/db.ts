import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "../shared/schema.ts";
import dotenv from 'dotenv';
dotenv.config();
const { Pool } = pkg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a drizzle client with our schema
export const db = drizzle(pool, { schema });

// For use in direct SQL queries when needed
export { pool };