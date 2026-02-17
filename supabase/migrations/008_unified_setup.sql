-- ============================================================================
-- KENNYGAMES — Unified Setup Script
-- Run this in Supabase SQL Editor to create/fix all tables
-- This is safe to run multiple times (uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- ============================================================================

-- =============================================================================
-- 1. USER PROFILES TABLE (main user table)
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  avatar_seed TEXT DEFAULT substring(md5(random()::text), 1, 10),
  profile_emoji TEXT DEFAULT '🎮',
  user_theme TEXT DEFAULT 'emerald' CHECK (user_theme IN ('emerald', 'blue', 'purple', 'pink')),
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'in_game')),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist yet (for existing installations)
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS avatar_seed TEXT DEFAULT substring(md5(random()::text), 1, 10);
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS profile_emoji TEXT DEFAULT '🎮';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS user_theme TEXT DEFAULT 'emerald';

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Public profiles are viewable by everyone') THEN
    CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can update own profile') THEN
    CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'Users can insert own profile') THEN
    CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- =============================================================================
-- 2. FRIENDSHIPS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can view their friendships') THEN
    CREATE POLICY "Users can view their friendships" ON friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can create friendship requests') THEN
    CREATE POLICY "Users can create friendship requests" ON friendships FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can update their friendships') THEN
    CREATE POLICY "Users can update their friendships" ON friendships FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
  END IF;
END $$;

-- =============================================================================
-- 3. CHALLENGES TABLE
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
  CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_challenges_from_user ON challenges(from_user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_to_user ON challenges(to_user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_current_turn ON challenges(current_turn_user_id);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'Users can view their challenges') THEN
    CREATE POLICY "Users can view their challenges" ON challenges FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'Users can create challenges') THEN
    CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = from_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenges' AND policyname = 'Challenge participants can update') THEN
    CREATE POLICY "Challenge participants can update" ON challenges FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
  END IF;
END $$;

-- Enable realtime for challenges (for live game updates)
ALTER PUBLICATION supabase_realtime ADD TABLE challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE friendships;

-- =============================================================================
-- 4. USER STATS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  sandy_wins INTEGER DEFAULT 0,
  sandy_losses INTEGER DEFAULT 0,
  sandy_games INTEGER DEFAULT 0,
  lea_wins INTEGER DEFAULT 0,
  lea_losses INTEGER DEFAULT 0,
  lea_games INTEGER DEFAULT 0,
  liliano_wins INTEGER DEFAULT 0,
  liliano_losses INTEGER DEFAULT 0,
  liliano_games INTEGER DEFAULT 0,
  nour_wins INTEGER DEFAULT 0,
  nour_losses INTEGER DEFAULT 0,
  nour_games INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_wins ON user_stats(total_wins DESC);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can view all stats') THEN
    CREATE POLICY "Users can view all stats" ON user_stats FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can update own stats') THEN
    CREATE POLICY "Users can update own stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_stats' AND policyname = 'Users can insert own stats') THEN
    CREATE POLICY "Users can insert own stats" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- =============================================================================
-- 5. NOTIFICATIONS TABLE
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
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  from_user_id UUID
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications') THEN
    CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications') THEN
    CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'System can insert notifications') THEN
    CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- =============================================================================
-- DONE! All tables created.
-- =============================================================================
SELECT 'Setup complete! Tables: user_profiles, friendships, challenges, user_stats, notifications' AS status;
