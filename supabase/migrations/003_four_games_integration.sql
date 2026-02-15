-- ============================================================================
-- KENNYGAMES - 4 GAMES INTEGRATION (LéaNaval, NourArchery, SandyPong, LilianoThunder)
-- Migration pour ajouter le support des 4 nouveaux jeux
-- ============================================================================

-- =============================================================================
-- 1. METTRE À JOUR LES TYPES DE JEUX
-- =============================================================================

-- Supprimer l'ancienne contrainte
ALTER TABLE party_games DROP CONSTRAINT IF EXISTS party_games_game_type_check;

-- Ajouter la nouvelle contrainte avec les 4 jeux
ALTER TABLE party_games ADD CONSTRAINT party_games_game_type_check 
  CHECK (game_type IN ('sandy', 'liliano', 'lea', 'nour', 'leanav', 'nourarchery', 'sandypong', 'lianothunder'));

-- Créer un type ENUM pour plus de clarté (optionnel mais recommandé)
DO $$ BEGIN
  CREATE TYPE game_type_enum AS ENUM (
    'leanav',        -- 🍾 LéaNaval (Bataille Navale)
    'nourarchery',   -- 🎯 NourArchery (Tir à l'Arc)
    'sandy',         -- 🍷 SandyPong (Beer Pong) - Alias pour compatibilité
    'sandypong',     -- 🍷 SandyPong (Beer Pong)
    'liliano',       -- ⚡ LilianoThunder (Tanks) - Alias pour compatibilité
    'lianothunder'   -- ⚡ LilianoThunder (Tanks)
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. TABLE GAME_MOVES - Historique des coups joués
-- =============================================================================

CREATE TABLE IF NOT EXISTS party_game_moves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES party_games(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  move_number INT NOT NULL,
  move_type TEXT NOT NULL, -- 'fire', 'place_bottle', 'shoot', etc.
  move_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB, -- Résultat du coup (hit, miss, score, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_party_game_moves_game ON party_game_moves(game_id);
CREATE INDEX IF NOT EXISTS idx_party_game_moves_player ON party_game_moves(player_id);
CREATE INDEX IF NOT EXISTS idx_party_game_moves_created ON party_game_moves(created_at DESC);

-- RLS pour game_moves
ALTER TABLE party_game_moves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read game moves" ON party_game_moves;
CREATE POLICY "Anyone can read game moves" ON party_game_moves
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players can create moves" ON party_game_moves;
CREATE POLICY "Players can create moves" ON party_game_moves
  FOR INSERT WITH CHECK (true);

-- =============================================================================
-- 3. AJOUTER DES COLONNES SPÉCIFIQUES PAR JEU DANS game_state
-- =============================================================================

-- La table party_game_state existe déjà avec une colonne JSONB flexible
-- On va juste documenter la structure attendue pour chaque jeu

COMMENT ON COLUMN party_game_state.state IS 
'Structure JSONB flexible pour stocker l''état de chaque jeu:

LEANAV (Bataille Navale):
{
  "playerBottles": [...],     // Positions des bouteilles du joueur
  "opponentBottles": [...],    // Positions des bouteilles adverses
  "playerHits": [...],         // Cases touchées chez le joueur
  "opponentHits": [...],       // Cases touchées chez l''adversaire
  "phase": "setup|playing|finished"
}

NOURARCHERY (Tir à l''Arc):
{
  "round": 1,                  // Round actuel (1-3)
  "scores": [8, 10, 7],        // Scores par round
  "wind": { "speed": 5.2, "direction": "right" },
  "phase": "aiming|shooting|result|gameover"
}

SANDYPONG (Beer Pong):
{
  "playerCups": [...],         // État des verres du joueur
  "opponentCups": [...],       // État des verres adverses
  "consecutiveHits": 0,        // Pour la règle balls back
  "ballsBackActive": false,
  "phase": "aiming|shooting|result|gameover"
}

LIANOTHUNDER (Tanks):
{
  "player1": { "x": 150, "y": 200, "hp": 100, "angle": 45, "power": 50 },
  "player2": { "x": 650, "y": 200, "hp": 85, "angle": 135, "power": 60 },
  "terrain": [...],            // Points du terrain
  "phase": "aiming|shooting|explosion|gameover"
}
';

-- =============================================================================
-- 4. FONCTION POUR INITIALISER UN JEU
-- =============================================================================

CREATE OR REPLACE FUNCTION initialize_game_state(
  game_uuid UUID,
  game_type_param TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Insérer l'état initial basé sur le type de jeu
  INSERT INTO party_game_state (game_id, state, current_turn_user_id, turn_number)
  VALUES (
    game_uuid,
    CASE game_type_param
      WHEN 'leanav' THEN '{"phase": "setup", "playerBottles": [], "opponentBottles": []}'::jsonb
      WHEN 'nourarchery' THEN '{"round": 1, "scores": [], "phase": "aiming"}'::jsonb
      WHEN 'sandy', 'sandypong' THEN '{"phase": "aiming", "consecutiveHits": 0, "ballsBackActive": false}'::jsonb
      WHEN 'liliano', 'lianothunder' THEN '{"phase": "aiming"}'::jsonb
      ELSE '{}'::jsonb
    END,
    (SELECT user_id FROM party_game_players WHERE game_id = game_uuid ORDER BY player_order LIMIT 1),
    1
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. FONCTION POUR ENREGISTRER UN COUP
-- =============================================================================

CREATE OR REPLACE FUNCTION record_game_move(
  game_uuid UUID,
  player_id_param TEXT,
  player_name_param TEXT,
  move_type_param TEXT,
  move_data_param JSONB,
  result_param JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  move_uuid UUID;
  move_num INT;
BEGIN
  -- Obtenir le numéro du prochain coup
  SELECT COALESCE(MAX(move_number), 0) + 1 INTO move_num
  FROM party_game_moves
  WHERE game_id = game_uuid;
  
  -- Insérer le coup
  INSERT INTO party_game_moves (
    game_id, 
    player_id, 
    player_name, 
    move_number, 
    move_type, 
    move_data, 
    result
  )
  VALUES (
    game_uuid,
    player_id_param,
    player_name_param,
    move_num,
    move_type_param,
    move_data_param,
    result_param
  )
  RETURNING id INTO move_uuid;
  
  RETURN move_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 6. FONCTION POUR METTRE À JOUR LE SCORE
-- =============================================================================

CREATE OR REPLACE FUNCTION update_player_score(
  game_uuid UUID,
  player_id_param TEXT,
  score_increment INT
)
RETURNS VOID AS $$
BEGIN
  UPDATE party_game_players
  SET score = score + score_increment
  WHERE game_id = game_uuid AND user_id = player_id_param;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 7. FONCTION POUR TERMINER UN JEU
-- =============================================================================

CREATE OR REPLACE FUNCTION finish_game(
  game_uuid UUID,
  winner_id_param TEXT,
  winner_name_param TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Mettre à jour le jeu
  UPDATE party_games
  SET 
    status = 'finished',
    finished_at = NOW(),
    winner_id = winner_id_param,
    winner_name = winner_name_param
  WHERE id = game_uuid;
  
  -- Mettre à jour le statut des joueurs
  UPDATE party_game_players
  SET status = 'finished'
  WHERE game_id = game_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. VUE POUR RÉCUPÉRER L'ÉTAT COMPLET D'UN JEU
-- =============================================================================

CREATE OR REPLACE VIEW game_full_state AS
SELECT 
  g.id as game_id,
  g.short_code,
  g.game_type,
  g.status,
  g.max_players,
  g.creator_id,
  g.creator_name,
  g.created_at,
  g.started_at,
  g.finished_at,
  g.winner_id,
  g.winner_name,
  
  -- État du jeu
  gs.state as game_state,
  gs.current_turn_user_id,
  gs.turn_number,
  gs.updated_at as state_updated_at,
  
  -- Joueurs (agrégés en JSON)
  (
    SELECT json_agg(
      json_build_object(
        'user_id', p.user_id,
        'user_name', p.user_name,
        'player_order', p.player_order,
        'status', p.status,
        'score', p.score,
        'joined_at', p.joined_at
      ) ORDER BY p.player_order
    )
    FROM party_game_players p
    WHERE p.game_id = g.id
  ) as players,
  
  -- Nombre de joueurs
  (
    SELECT COUNT(*)
    FROM party_game_players p
    WHERE p.game_id = g.id
  ) as player_count,
  
  -- Derniers coups (5 derniers)
  (
    SELECT json_agg(
      json_build_object(
        'player_id', m.player_id,
        'player_name', m.player_name,
        'move_type', m.move_type,
        'move_data', m.move_data,
        'result', m.result,
        'created_at', m.created_at
      ) ORDER BY m.created_at DESC
    )
    FROM (
      SELECT * FROM party_game_moves
      WHERE game_id = g.id
      ORDER BY created_at DESC
      LIMIT 5
    ) m
  ) as recent_moves

FROM party_games g
LEFT JOIN party_game_state gs ON gs.game_id = g.id;

-- =============================================================================
-- 9. INDEXES SUPPLÉMENTAIRES POUR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_party_games_type_status ON party_games(game_type, status);
CREATE INDEX IF NOT EXISTS idx_party_game_state_turn ON party_game_state(current_turn_user_id);

-- =============================================================================
-- 10. DONNÉES DE TEST (Optionnel - à supprimer en production)
-- =============================================================================

-- Fonction pour créer un jeu de test
CREATE OR REPLACE FUNCTION create_test_game(game_type_param TEXT)
RETURNS UUID AS $$
DECLARE
  game_uuid UUID;
  short_code_val TEXT;
BEGIN
  -- Générer un code court
  short_code_val := substring(md5(random()::text), 1, 6);
  
  -- Créer le jeu
  INSERT INTO party_games (short_code, game_type, creator_id, creator_name)
  VALUES (short_code_val, game_type_param, 'test_user_1', 'Test Player 1')
  RETURNING id INTO game_uuid;
  
  -- Ajouter le créateur comme joueur
  INSERT INTO party_game_players (game_id, user_id, user_name, player_order)
  VALUES (game_uuid, 'test_user_1', 'Test Player 1', 1);
  
  -- Initialiser l'état
  PERFORM initialize_game_state(game_uuid, game_type_param);
  
  RAISE NOTICE 'Test game created: % (code: %)', game_uuid, short_code_val;
  
  RETURN game_uuid;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MIGRATION TERMINÉE
-- =============================================================================

-- Pour tester :
-- SELECT create_test_game('leanav');
-- SELECT create_test_game('nourarchery');
-- SELECT create_test_game('sandy');
-- SELECT create_test_game('liliano');
