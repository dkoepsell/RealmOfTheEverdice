import { db } from "../server/db.js";

async function main() {
  console.log("Running migration: add_inventory_column");
  
  // Add inventory column to characters table
  await db.execute(`
    ALTER TABLE characters
    ADD COLUMN IF NOT EXISTS inventory JSONB DEFAULT '[]'::jsonb;
  `);
  
  console.log("Migration completed successfully");
}

main().catch((e) => {
  console.error("Migration failed:");
  console.error(e);
  process.exit(1);
});