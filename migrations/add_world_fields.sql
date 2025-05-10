-- Add is_active and is_main_world columns to everdice_world table
ALTER TABLE everdice_world 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS is_main_world BOOLEAN DEFAULT FALSE;

-- Set the first world (if exists) as the main world
UPDATE everdice_world
SET is_main_world = TRUE
WHERE id = (SELECT id FROM everdice_world ORDER BY id LIMIT 1);