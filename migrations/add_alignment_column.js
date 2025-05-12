// Migration to add alignment column to characters table
import { pool } from '../server/db';

export async function main() {
  console.log('Starting migration to add alignment column to characters table');
  
  try {
    // Create JSON alignment column
    await pool.query(`
      ALTER TABLE characters
      ADD COLUMN IF NOT EXISTS alignment JSONB,
      ADD COLUMN IF NOT EXISTS law_chaos_value INTEGER,
      ADD COLUMN IF NOT EXISTS good_evil_value INTEGER;
    `);
    
    console.log('Successfully added alignment columns to characters table');
    return true;
  } catch (error) {
    console.error('Error adding alignment columns to characters table:', error);
    throw error;
  }
}

// For direct execution
if (import.meta.url.endsWith(process.argv[1])) {
  main()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}