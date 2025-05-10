-- Add createdBy column to everdice_world table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'everdice_world' 
        AND column_name = 'created_by'
    ) THEN
        ALTER TABLE everdice_world ADD COLUMN created_by INTEGER;
    END IF;
END $$;

-- Create world_access table if it doesn't exist
CREATE TABLE IF NOT EXISTS world_access (
    id SERIAL PRIMARY KEY,
    world_id INTEGER NOT NULL REFERENCES everdice_world(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_level TEXT NOT NULL DEFAULT 'player',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(world_id, user_id)
);

-- Add multiworld support to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS world_id INTEGER REFERENCES everdice_world(id);

-- Update everdice_world table to ensure one main world
UPDATE everdice_world SET is_main_world = true WHERE id = (SELECT MIN(id) FROM everdice_world);