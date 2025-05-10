import { db } from "../server/db.js";
import { characters } from "../shared/schema.js";
import { sql } from "drizzle-orm";

// Run this migration to add the new character progression fields
(async () => {
  try {
    console.log("Starting migration to add character progression fields...");
    
    // Add experience column
    await db.execute(sql`
      ALTER TABLE characters 
      ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0
    `);
    console.log("Added experience column");
    
    // Add milestones column as JSON
    await db.execute(sql`
      ALTER TABLE characters 
      ADD COLUMN IF NOT EXISTS milestones JSONB DEFAULT '[]'::jsonb
    `);
    console.log("Added milestones column");
    
    // Add achievements column as JSON
    await db.execute(sql`
      ALTER TABLE characters 
      ADD COLUMN IF NOT EXISTS achievements JSONB DEFAULT '[]'::jsonb
    `);
    console.log("Added achievements column");
    
    // Add progression column as JSON
    await db.execute(sql`
      ALTER TABLE characters 
      ADD COLUMN IF NOT EXISTS progression JSONB DEFAULT '[]'::jsonb
    `);
    console.log("Added progression column");
    
    console.log("Migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
})();