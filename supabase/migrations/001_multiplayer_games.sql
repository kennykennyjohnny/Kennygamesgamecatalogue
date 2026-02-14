-- ============================================================================
-- KENNYGAMES PARTY - Multiplayer Games Schema
-- ============================================================================

-- =============================================================================
-- 1. GAMES TABLE - Stores game sessions
-- =============================================================================
CREATE TABLE IF NOT EXISTS party_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  short_code TEXT UNIQUE NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('sandy', 'liliano', 'lea', 'nour')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  max_players INT NOT NULL DEFAULT 2 CHECK (max_players >= 2 AND max_players <= 10),
  creator_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  winner_id TEXT,
  winner_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_party_games_short_code ON party_games(short_code);
CREATE INDEX IF NOT EXISTS idx_party_games_status ON party_games(status);
CREATE INDEX IF NOT EXISTS idx_party_games_creator ON party_games(creator_id);

-- =============================================================================
-- 2. GAME PLAYERS - Tracks who's in each game
-- =============================================================================
CREATE TABLE IF NOT EXISTS party_game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES party_games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  player_order INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'playing', 'finished')),
  score INT DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_party_game_players_game ON party_game_players(game_id);
CREATE INDEX IF NOT EXISTS idx_party_game_players_user ON party_game_players(user_id);

-- =============================================================================
-- 3. GAME STATE - Stores current game state (JSONB for flexibility)
-- =============================================================================
CREATE TABLE IF NOT EXISTS party_game_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID UNIQUE NOT NULL REFERENCES party_games(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_turn_user_id TEXT,
  turn_number INT DEFAULT 1,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_party_game_state_game ON party_game_state(game_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_party_game_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_party_game_state_timestamp ON party_game_state;
CREATE TRIGGER update_party_game_state_timestamp
BEFORE UPDATE ON party_game_state
FOR EACH ROW
EXECUTE FUNCTION update_party_game_state_timestamp();

-- =============================================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE party_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_game_state ENABLE ROW LEVEL SECURITY;

-- Games: Everyone can read, anyone can create
DROP POLICY IF EXISTS "Anyone can read games" ON party_games;
CREATE POLICY "Anyone can read games" ON party_games
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can create games" ON party_games;
CREATE POLICY "Anyone can create games" ON party_games
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Creator can update game" ON party_games;
CREATE POLICY "Creator can update game" ON party_games
  FOR UPDATE USING (true);

-- Game Players: Everyone can read, anyone can join
DROP POLICY IF EXISTS "Anyone can read game players" ON party_game_players;
CREATE POLICY "Anyone can read game players" ON party_game_players
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can join game" ON party_game_players;
CREATE POLICY "Anyone can join game" ON party_game_players
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Players can update own record" ON party_game_players;
CREATE POLICY "Players can update own record" ON party_game_players
  FOR UPDATE USING (true);

-- Game State: Everyone can read, players can update
DROP POLICY IF EXISTS "Anyone can read game state" ON party_game_state;
CREATE POLICY "Anyone can read game state" ON party_game_state
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can update game state" ON party_game_state;
CREATE POLICY "Anyone can update game state" ON party_game_state
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can modify game state" ON party_game_state;
CREATE POLICY "Anyone can modify game state" ON party_game_state
  FOR UPDATE USING (true);

-- =============================================================================
-- 5. HELPER FUNCTIONS
-- =============================================================================

-- Function to get a game by short code
CREATE OR REPLACE FUNCTION get_game_by_code(code TEXT)
RETURNS TABLE (
  game_id UUID,
  game_type TEXT,
  status TEXT,
  max_players INT,
  creator_id TEXT,
  creator_name TEXT,
  current_players INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    g.id,
    g.game_type,
    g.status,
    g.max_players,
    g.creator_id,
    g.creator_name,
    COUNT(p.id)::INT as current_players
  FROM party_games g
  LEFT JOIN party_game_players p ON p.game_id = g.id
  WHERE g.short_code = code
  GROUP BY g.id;
END;
$$ LANGUAGE plpgsql;

-- Function to get next player turn
CREATE OR REPLACE FUNCTION get_next_player_turn(game_uuid UUID, current_player TEXT)
RETURNS TEXT AS $$
DECLARE
  next_player TEXT;
  current_order INT;
  max_order INT;
BEGIN
  -- Get current player order
  SELECT player_order INTO current_order
  FROM party_game_players
  WHERE game_id = game_uuid AND user_id = current_player;
  
  -- Get max order
  SELECT MAX(player_order) INTO max_order
  FROM party_game_players
  WHERE game_id = game_uuid;
  
  -- Get next player (wrap around if at end)
  IF current_order >= max_order THEN
    SELECT user_id INTO next_player
    FROM party_game_players
    WHERE game_id = game_uuid AND player_order = 1;
  ELSE
    SELECT user_id INTO next_player
    FROM party_game_players
    WHERE game_id = game_uuid AND player_order = current_order + 1;
  END IF;
  
  RETURN next_player;
END;
$$ LANGUAGE plpgsql;
