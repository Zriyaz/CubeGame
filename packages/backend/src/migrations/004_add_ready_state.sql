-- Add is_ready column to game_participants table
ALTER TABLE game_participants 
ADD COLUMN IF NOT EXISTS is_ready BOOLEAN NOT NULL DEFAULT FALSE;

-- Update existing participants to be ready (since they're in games already)
UPDATE game_participants 
SET is_ready = TRUE 
WHERE is_active = TRUE AND is_ready IS NULL;

