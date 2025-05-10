-- Add the last_active_at column to campaign_characters if it doesn't exist
ALTER TABLE campaign_characters
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add other missing columns if they don't exist
ALTER TABLE campaign_characters
ADD COLUMN IF NOT EXISTS turn_status TEXT NOT NULL DEFAULT 'waiting';

ALTER TABLE campaign_characters
ADD COLUMN IF NOT EXISTS is_zombie_mode BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE campaign_characters
ADD COLUMN IF NOT EXISTS zombie_mode_since TIMESTAMP;

ALTER TABLE campaign_characters
ADD COLUMN IF NOT EXISTS can_take_damage BOOLEAN NOT NULL DEFAULT true;