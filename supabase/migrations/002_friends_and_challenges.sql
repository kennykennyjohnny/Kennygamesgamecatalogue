-- ============================================================================
-- KENNYGAMES PARTY - Friends & Challenges System
-- Migration 002: Friends, Challenges, Notifications
-- ============================================================================

-- =============================================================================
-- 1. FRIENDSHIPS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- RLS Policies for friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendships"
  ON friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- =============================================================================
-- 2. CHALLENGES TABLE (remplace party_games pour les défis directs)
-- =============================================================================
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('sandy', 'liliano', 'lea', 'nour')),
  status TEXT NOT NULL CHECK (status IN ('sent', 'accepted', 'declined', 'playing', 'finished', 'cancelled')),
  current_turn_user_id UUID,
  winner_id UUID,
  game_state JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CHECK (from_user_id != to_user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_challenges_from_user ON challenges(from_user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_to_user ON challenges(to_user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_current_turn ON challenges(current_turn_user_id);

-- RLS Policies for challenges
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their challenges"
  ON challenges FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create challenges"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Challenge participants can update"
  ON challenges FOR UPDATE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- =============================================================================
-- 3. NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('challenge_received', 'challenge_accepted', 'your_turn', 'challenge_won', 'challenge_lost', 'friend_request')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optional references
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  from_user_id UUID
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- RLS Policies for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- =============================================================================
-- 4. USERS TABLE (simple user profiles)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'in_game')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for username search
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- RLS Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =============================================================================
-- 5. HELPER FUNCTIONS
-- =============================================================================

-- Function to get friends list (both directions)
CREATE OR REPLACE FUNCTION get_friends(p_user_id UUID)
RETURNS TABLE (
  friend_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  status TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  friendship_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE 
      WHEN f.user_id = p_user_id THEN f.friend_id 
      ELSE f.user_id 
    END as friend_id,
    up.username,
    up.display_name,
    up.avatar_url,
    up.status,
    up.last_seen,
    f.status as friendship_status
  FROM friendships f
  JOIN user_profiles up ON (
    CASE 
      WHEN f.user_id = p_user_id THEN f.friend_id 
      ELSE f.user_id 
    END = up.id
  )
  WHERE (f.user_id = p_user_id OR f.friend_id = p_user_id)
    AND f.status = 'accepted'
  ORDER BY up.status DESC, up.last_seen DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a challenge and send notification
CREATE OR REPLACE FUNCTION create_challenge(
  p_from_user_id UUID,
  p_to_user_id UUID,
  p_game_type TEXT
)
RETURNS UUID AS $$
DECLARE
  v_challenge_id UUID;
  v_from_username TEXT;
BEGIN
  -- Get challenger username
  SELECT username INTO v_from_username 
  FROM user_profiles 
  WHERE id = p_from_user_id;
  
  -- Create challenge
  INSERT INTO challenges (from_user_id, to_user_id, game_type, status, current_turn_user_id)
  VALUES (p_from_user_id, p_to_user_id, p_game_type, 'sent', p_from_user_id)
  RETURNING id INTO v_challenge_id;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, link, challenge_id, from_user_id)
  VALUES (
    p_to_user_id,
    'challenge_received',
    'Nouveau défi !',
    v_from_username || ' t''a défié sur ' || 
      CASE p_game_type
        WHEN 'sandy' THEN 'SandyGames 🍷'
        WHEN 'liliano' THEN 'LilianoGames ⚡'
        WHEN 'lea' THEN 'LéaGames 🍾'
        WHEN 'nour' THEN 'NourGames 💻'
      END,
    '/challenge/' || v_challenge_id,
    v_challenge_id,
    p_from_user_id
  );
  
  RETURN v_challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 6. MIGRATE EXISTING DATA (optional - if needed)
-- =============================================================================
-- If you have existing party_games, you can migrate them here
-- For now, we'll keep party_games table for reference but use challenges going forward

-- =============================================================================
-- DONE! 
-- Run this in Supabase SQL Editor
-- =============================================================================
