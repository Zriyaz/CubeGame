-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create game_status enum type
CREATE TYPE game_status AS ENUM ('waiting', 'in_progress', 'completed', 'cancelled');

-- Create users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    preferred_color VARCHAR(7) DEFAULT '#FF5733',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_color CHECK (preferred_color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Create games table
CREATE TABLE games (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    board_size INTEGER NOT NULL CHECK (board_size >= 4 AND board_size <= 16),
    max_players INTEGER DEFAULT 4 CHECK (max_players >= 2 AND max_players <= 10),
    status game_status DEFAULT 'waiting',
    winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    invite_code VARCHAR(8) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT valid_game_state CHECK (
        (status = 'waiting' AND started_at IS NULL AND ended_at IS NULL) OR
        (status = 'in_progress' AND started_at IS NOT NULL AND ended_at IS NULL) OR
        (status IN ('completed', 'cancelled') AND ended_at IS NOT NULL)
    )
);

-- Create indexes for games
CREATE INDEX idx_games_creator_id ON games(creator_id);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at DESC);
CREATE INDEX idx_games_invite_code ON games(invite_code) WHERE invite_code IS NOT NULL;

-- Create game_participants table
CREATE TABLE game_participants (
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    color VARCHAR(7) NOT NULL,
    cells_owned INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (game_id, user_id),
    CONSTRAINT valid_participant_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT valid_cells_owned CHECK (cells_owned >= 0)
);

-- Create indexes for game_participants
CREATE INDEX idx_participants_user_id ON game_participants(user_id);
CREATE INDEX idx_participants_game_active ON game_participants(game_id) 
    WHERE is_active = true;

-- Create moves table
CREATE TABLE moves (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cell_x INTEGER NOT NULL,
    cell_y INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_cell_position CHECK (cell_x >= 0 AND cell_y >= 0)
);

-- Create indexes for moves
CREATE INDEX idx_moves_game_id_timestamp ON moves(game_id, timestamp);
CREATE INDEX idx_moves_user_id ON moves(user_id);
CREATE INDEX idx_moves_game_cell ON moves(game_id, cell_x, cell_y);

-- Create function to generate invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
DECLARE
    chars VARCHAR(36) := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result VARCHAR(8) := '';
    i INTEGER;
BEGIN
    -- Only generate invite code if not provided
    IF NEW.invite_code IS NULL THEN
        LOOP
            result := '';
            FOR i IN 1..8 LOOP
                result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
            END LOOP;
            
            -- Check if code already exists
            EXIT WHEN NOT EXISTS (SELECT 1 FROM games WHERE invite_code = result);
        END LOOP;
        NEW.invite_code := result;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for invite code generation
CREATE TRIGGER set_invite_code
    BEFORE INSERT ON games
    FOR EACH ROW
    EXECUTE FUNCTION generate_invite_code();

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating user timestamps
CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- Create view for game statistics
CREATE VIEW v_game_statistics AS
SELECT 
    g.id,
    g.name,
    g.board_size,
    g.status,
    g.created_at,
    g.started_at,
    g.ended_at,
    u.name as creator_name,
    w.name as winner_name,
    COUNT(DISTINCT gp.user_id) as player_count,
    COUNT(DISTINCT m.id) as total_moves,
    EXTRACT(EPOCH FROM (g.ended_at - g.started_at))/60 as duration_minutes
FROM games g
LEFT JOIN users u ON g.creator_id = u.id
LEFT JOIN users w ON g.winner_id = w.id
LEFT JOIN game_participants gp ON g.id = gp.game_id
LEFT JOIN moves m ON g.id = m.game_id
GROUP BY g.id, u.name, w.name;

-- Create view for user statistics
CREATE VIEW v_user_stats AS
SELECT 
    u.id,
    u.name,
    COUNT(DISTINCT g.id) as games_created,
    COUNT(DISTINCT gp.game_id) as games_played,
    COUNT(DISTINCT CASE WHEN g2.winner_id = u.id THEN g2.id END) as games_won,
    AVG(gp.cells_owned) as avg_cells_per_game,
    MAX(gp.cells_owned) as max_cells_in_game
FROM users u
LEFT JOIN games g ON u.id = g.creator_id
LEFT JOIN game_participants gp ON u.id = gp.user_id
LEFT JOIN games g2 ON gp.game_id = g2.id
GROUP BY u.id, u.name;