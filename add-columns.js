import { pool } from './server/db.ts';

async function addColumns() {
  try {
    console.log('Adding alignment columns to characters table...');
    
    await pool.query(`
      ALTER TABLE characters 
      ADD COLUMN IF NOT EXISTS alignment JSONB,
      ADD COLUMN IF NOT EXISTS law_chaos_value INTEGER,
      ADD COLUMN IF NOT EXISTS good_evil_value INTEGER
    `);
    
    console.log('Successfully added alignment columns');
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding columns:', error);
    process.exit(1);
  }
}

addColumns();