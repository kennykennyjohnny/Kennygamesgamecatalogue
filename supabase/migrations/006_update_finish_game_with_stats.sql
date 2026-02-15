-- Migration 003b: Update finish_game to call stats
-- Remplace la fonction finish_game existante avec appel aux stats

CREATE OR REPLACE FUNCTION finish_game(
  p_game_id UUID,
  p_winner_user_id TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_game RECORD;
  v_game_type TEXT;
  v_result JSONB;
BEGIN
  -- Récupère les infos de la partie
  SELECT * INTO v_game
  FROM party_games
  WHERE id = p_game_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found: %', p_game_id;
  END IF;
  
  v_game_type := v_game.game_type;
  
  -- Marque la partie comme terminée
  UPDATE party_games
  SET 
    status = 'completed',
    finished_at = NOW(),
    winner_id = p_winner_user_id
  WHERE id = p_game_id;
  
  -- Met à jour le statut des joueurs
  UPDATE party_game_players
  SET status = 'finished'
  WHERE game_id = p_game_id;
  
  -- Met à jour les stats de tous les joueurs
  PERFORM update_user_stats_after_game(
    player.user_id,
    v_game_type,
    player.user_id = p_winner_user_id  -- true si c'est le gagnant
  )
  FROM party_game_players player
  WHERE player.game_id = p_game_id;
  
  v_result := jsonb_build_object(
    'success', true,
    'game_id', p_game_id,
    'winner_id', p_winner_user_id,
    'finished_at', NOW()
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION finish_game(UUID, TEXT) IS 'Termine une partie et met à jour les stats des joueurs';
