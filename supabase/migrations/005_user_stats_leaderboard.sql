-- Migration 005: User Stats & Leaderboard System
-- Description: Tables et fonctions pour tracker les statistiques des joueurs

-- ============================================================================
-- 1. TABLE: user_stats
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Stats globales
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  
  -- Stats par jeu
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
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_wins ON user_stats(total_wins DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_current_streak ON user_stats(current_streak DESC);

-- ============================================================================
-- 2. FONCTION: Initialiser les stats d'un utilisateur
-- ============================================================================
CREATE OR REPLACE FUNCTION initialize_user_stats(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. FONCTION: Mettre à jour les stats après une partie
-- ============================================================================
CREATE OR REPLACE FUNCTION update_user_stats_after_game(
  p_user_id UUID,
  p_game_type TEXT,
  p_won BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_game_col_prefix TEXT;
  v_current_streak INTEGER;
BEGIN
  -- Initialiser les stats si elles n'existent pas
  PERFORM initialize_user_stats(p_user_id);
  
  -- Détermine les colonnes à mettre à jour selon le jeu
  v_game_col_prefix := CASE p_game_type
    WHEN 'sandy' THEN 'sandy'
    WHEN 'lea' THEN 'lea'
    WHEN 'liliano' THEN 'liliano'
    WHEN 'nour' THEN 'nour'
    ELSE NULL
  END;
  
  IF v_game_col_prefix IS NULL THEN
    RAISE EXCEPTION 'Invalid game type: %', p_game_type;
  END IF;
  
  -- Récupère la streak actuelle
  SELECT current_streak INTO v_current_streak
  FROM user_stats
  WHERE user_id = p_user_id;
  
  -- Met à jour les stats
  IF p_won THEN
    -- Victoire
    EXECUTE format('
      UPDATE user_stats
      SET 
        total_games = total_games + 1,
        total_wins = total_wins + 1,
        current_streak = current_streak + 1,
        best_streak = GREATEST(best_streak, current_streak + 1),
        %I_games = %I_games + 1,
        %I_wins = %I_wins + 1,
        updated_at = NOW()
      WHERE user_id = $1
    ', v_game_col_prefix, v_game_col_prefix, v_game_col_prefix, v_game_col_prefix)
    USING p_user_id;
  ELSE
    -- Défaite
    EXECUTE format('
      UPDATE user_stats
      SET 
        total_games = total_games + 1,
        total_losses = total_losses + 1,
        current_streak = 0,
        %I_games = %I_games + 1,
        %I_losses = %I_losses + 1,
        updated_at = NOW()
      WHERE user_id = $1
    ', v_game_col_prefix, v_game_col_prefix, v_game_col_prefix, v_game_col_prefix)
    USING p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. VUE: Leaderboard global
-- ============================================================================
CREATE OR REPLACE VIEW leaderboard_global AS
SELECT 
  u.id AS user_id,
  u.username,
  u.avatar_seed,
  us.total_games,
  us.total_wins,
  us.total_losses,
  CASE 
    WHEN us.total_games > 0 
    THEN ROUND((us.total_wins::NUMERIC / us.total_games::NUMERIC) * 100, 1)
    ELSE 0
  END AS win_rate,
  us.current_streak,
  us.best_streak,
  ROW_NUMBER() OVER (ORDER BY us.total_wins DESC, us.current_streak DESC) AS rank
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE us.total_games > 0
ORDER BY us.total_wins DESC, us.current_streak DESC
LIMIT 100;

-- ============================================================================
-- 5. VUE: Leaderboard par jeu
-- ============================================================================
CREATE OR REPLACE VIEW leaderboard_by_game AS
SELECT 
  u.id AS user_id,
  u.username,
  u.avatar_seed,
  'sandy' AS game_type,
  us.sandy_games AS games,
  us.sandy_wins AS wins,
  us.sandy_losses AS losses,
  CASE 
    WHEN us.sandy_games > 0 
    THEN ROUND((us.sandy_wins::NUMERIC / us.sandy_games::NUMERIC) * 100, 1)
    ELSE 0
  END AS win_rate
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE us.sandy_games > 0

UNION ALL

SELECT 
  u.id AS user_id,
  u.username,
  u.avatar_seed,
  'lea' AS game_type,
  us.lea_games AS games,
  us.lea_wins AS wins,
  us.lea_losses AS losses,
  CASE 
    WHEN us.lea_games > 0 
    THEN ROUND((us.lea_wins::NUMERIC / us.lea_games::NUMERIC) * 100, 1)
    ELSE 0
  END AS win_rate
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE us.lea_games > 0

UNION ALL

SELECT 
  u.id AS user_id,
  u.username,
  u.avatar_seed,
  'liliano' AS game_type,
  us.liliano_games AS games,
  us.liliano_wins AS wins,
  us.liliano_losses AS losses,
  CASE 
    WHEN us.liliano_games > 0 
    THEN ROUND((us.liliano_wins::NUMERIC / us.liliano_games::NUMERIC) * 100, 1)
    ELSE 0
  END AS win_rate
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE us.liliano_games > 0

UNION ALL

SELECT 
  u.id AS user_id,
  u.username,
  u.avatar_seed,
  'nour' AS game_type,
  us.nour_games AS games,
  us.nour_wins AS wins,
  us.nour_losses AS losses,
  CASE 
    WHEN us.nour_games > 0 
    THEN ROUND((us.nour_wins::NUMERIC / us.nour_games::NUMERIC) * 100, 1)
    ELSE 0
  END AS win_rate
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE us.nour_games > 0;

-- ============================================================================
-- 6. TRIGGER: Auto-initialiser stats pour nouveaux users
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_initialize_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM initialize_user_stats(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_initialize_user_stats
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION trigger_initialize_user_stats();

-- ============================================================================
-- 7. FONCTION: Obtenir les stats d'un joueur
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
  total_games INTEGER,
  total_wins INTEGER,
  total_losses INTEGER,
  win_rate NUMERIC,
  current_streak INTEGER,
  best_streak INTEGER,
  
  sandy_wins INTEGER,
  sandy_losses INTEGER,
  sandy_games INTEGER,
  
  lea_wins INTEGER,
  lea_losses INTEGER,
  lea_games INTEGER,
  
  liliano_wins INTEGER,
  liliano_losses INTEGER,
  liliano_games INTEGER,
  
  nour_wins INTEGER,
  nour_losses INTEGER,
  nour_games INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.total_games,
    us.total_wins,
    us.total_losses,
    CASE 
      WHEN us.total_games > 0 
      THEN ROUND((us.total_wins::NUMERIC / us.total_games::NUMERIC) * 100, 1)
      ELSE 0
    END AS win_rate,
    us.current_streak,
    us.best_streak,
    us.sandy_wins,
    us.sandy_losses,
    us.sandy_games,
    us.lea_wins,
    us.lea_losses,
    us.lea_games,
    us.liliano_wins,
    us.liliano_losses,
    us.liliano_games,
    us.nour_wins,
    us.nour_losses,
    us.nour_games
  FROM user_stats us
  WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTAIRES
-- ============================================================================
COMMENT ON TABLE user_stats IS 'Statistiques détaillées par utilisateur et par jeu';
COMMENT ON FUNCTION initialize_user_stats(UUID) IS 'Initialise les stats pour un nouvel utilisateur';
COMMENT ON FUNCTION update_user_stats_after_game(UUID, TEXT, BOOLEAN) IS 'Met à jour les stats après une partie (appelé depuis finish_game)';
COMMENT ON VIEW leaderboard_global IS 'Classement global des meilleurs joueurs';
COMMENT ON VIEW leaderboard_by_game IS 'Classement par jeu spécifique';
