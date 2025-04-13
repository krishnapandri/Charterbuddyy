import { db } from "../server/db.ts";
import { sql } from "drizzle-orm";

async function createStudyPlanTables() {
  try {
    console.log("Creating study plan tables...");
    
    // Create study_plans table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS study_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        focus_areas JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        progress INTEGER NOT NULL DEFAULT 0,
        last_updated TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Created study_plans table");
    
    // Create study_plan_items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS study_plan_items (
        id SERIAL PRIMARY KEY,
        plan_id INTEGER NOT NULL REFERENCES study_plans(id),
        topic_id INTEGER NOT NULL REFERENCES topics(id),
        practice_set_id INTEGER REFERENCES practice_sets(id),
        title TEXT NOT NULL,
        description TEXT,
        scheduled_date DATE NOT NULL,
        estimated_duration INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        completed BOOLEAN NOT NULL DEFAULT false,
        completed_at TIMESTAMP,
        priority INTEGER NOT NULL DEFAULT 2
      );
    `);
    console.log("Created study_plan_items table");
    
    console.log("Migrations completed successfully.");
  } catch (error) {
    console.error("Error applying migrations:", error);
    throw error;
  }
}

createStudyPlanTables()
  .then(() => {
    console.log("All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });