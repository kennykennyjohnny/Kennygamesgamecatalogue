-- ============================================================================
-- KENNYGAMES - Script SQL Complet pour Supabase
-- À exécuter dans: Supabase Dashboard > SQL Editor > New Query
-- ============================================================================

-- =============================================================================
-- 1. SUPPRIMER ET RECRÉER LA TABLE kv_store (TABLE PRINCIPALE)
-- =============================================================================
-- Désactiver RLS temporairement
ALTER TABLE IF EXISTS kv_store_3d47e466 DISABLE ROW LEVEL SECURITY;

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Public read access" ON kv_store_3d47e466;
DROP POLICY IF EXISTS "Users can read all kv data" ON kv_store_3d47e466;
DROP POLICY IF EXISTS "Users can write their own data" ON kv_store_3d47e466;
DROP POLICY IF EXISTS "Users can update their own data" ON kv_store_3d47e466;
DROP POLICY IF EXISTS "Service role can do everything" ON kv_store_3d47e466;

-- Supprimer la table existante (si elle existe)
DROP TABLE IF EXISTS kv_store_3d47e466 CASCADE;

-- Créer la table avec la bonne structure
CREATE TABLE kv_store_3d47e466 (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances de recherche par préfixe
CREATE INDEX IF NOT EXISTS idx_kv_key_prefix ON kv_store_3d47e466 (key text_pattern_ops);

-- Index pour les timestamps
CREATE INDEX IF NOT EXISTS idx_kv_created_at ON kv_store_3d47e466 (created_at);
CREATE INDEX IF NOT EXISTS idx_kv_updated_at ON kv_store_3d47e466 (updated_at);

-- =============================================================================
-- 2. FONCTION POUR METTRE À JOUR updated_at AUTOMATIQUEMENT
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour kv_store
DROP TRIGGER IF EXISTS update_kv_store_updated_at ON kv_store_3d47e466;
CREATE TRIGGER update_kv_store_updated_at
BEFORE UPDATE ON kv_store_3d47e466
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 3. DONNÉES DE RÉFÉRENCE POUR LES JEUX
-- =============================================================================
-- Stocke les métadonnées des jeux dans la KV store
INSERT INTO kv_store_3d47e466 (key, value)
VALUES (
  'game_metadata',
  '{
    "games": [
      {"id": "vif", "name": "VIF", "type": "reflex", "duration": 30, "description": "Clique sur les cercles"},
      {"id": "plus", "name": "PLUS", "type": "math", "duration": 30, "description": "Additions"},
      {"id": "moins", "name": "MOINS", "type": "math", "duration": 30, "description": "Soustractions"},
      {"id": "multi", "name": "MULTI", "type": "math", "duration": 30, "description": "Multiplications"},
      {"id": "div", "name": "DIV", "type": "math", "duration": 30, "description": "Divisions"},
      {"id": "mix", "name": "MIX", "type": "math", "duration": 30, "description": "Opérations mélangées"}
    ]
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- =============================================================================
-- 4. INITIALISATION DES GOATS
-- =============================================================================
-- GOAT of All Time (sera mis à jour dynamiquement)
INSERT INTO kv_store_3d47e466 (key, value)
VALUES (
  'goat_alltime',
  '{
    "userId": null,
    "userName": "Aucun champion",
    "totalScore": 0,
    "updatedAt": null
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- =============================================================================
-- 5. POLICIES RLS (Row Level Security)
-- =============================================================================
-- Activer RLS sur kv_store
ALTER TABLE kv_store_3d47e466 ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire (pour les classements publics)
DROP POLICY IF EXISTS "Public read access" ON kv_store_3d47e466;
CREATE POLICY "Public read access" ON kv_store_3d47e466
FOR SELECT
TO public
USING (true);

-- Policy: Les utilisateurs authentifiés peuvent lire toutes les données
DROP POLICY IF EXISTS "Users can read all kv data" ON kv_store_3d47e466;
CREATE POLICY "Users can read all kv data" ON kv_store_3d47e466
FOR SELECT
TO authenticated
USING (true);

-- Policy: Les utilisateurs ne peuvent écrire que leurs propres données
DROP POLICY IF EXISTS "Users can write their own data" ON kv_store_3d47e466;
CREATE POLICY "Users can write their own data" ON kv_store_3d47e466
FOR INSERT
TO authenticated
WITH CHECK (
  key LIKE 'user_' || auth.uid() || '%'
);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres données
DROP POLICY IF EXISTS "Users can update their own data" ON kv_store_3d47e466;
CREATE POLICY "Users can update their own data" ON kv_store_3d47e466
FOR UPDATE
TO authenticated
USING (
  key LIKE 'user_' || auth.uid() || '%'
);

-- Policy: Service role a tous les droits (pour les Edge Functions)
DROP POLICY IF EXISTS "Service role can do everything" ON kv_store_3d47e466;
CREATE POLICY "Service role can do everything" ON kv_store_3d47e466
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================================================
-- 6. FONCTIONS UTILITAIRES
-- =============================================================================

-- Fonction pour obtenir le GOAT du jour
CREATE OR REPLACE FUNCTION get_goat_of_day(target_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  goat_data JSONB;
  goat_key TEXT;
BEGIN
  goat_key := 'goat_daily_' || target_date::TEXT;
  
  SELECT value INTO goat_data
  FROM kv_store_3d47e466
  WHERE key = goat_key;
  
  IF goat_data IS NULL THEN
    RETURN '{"userName": "Aucun GOAT aujourd''hui", "totalScore": 0}'::jsonb;
  END IF;
  
  RETURN goat_data;
END;
$$;

-- Fonction pour obtenir le top N joueurs
CREATE OR REPLACE FUNCTION get_top_players(limit_count INTEGER DEFAULT 100)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  players JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'userId', SUBSTRING(key FROM 6),
      'userName', value->>'userName',
      'totalScore', (value->>'totalScore')::INTEGER,
      'rank', ROW_NUMBER() OVER (ORDER BY (value->>'totalScore')::INTEGER DESC)
    )
    ORDER BY (value->>'totalScore')::INTEGER DESC
  )
  INTO players
  FROM kv_store_3d47e466
  WHERE key LIKE 'user_%'
    AND key NOT LIKE '%daily%'
    AND key NOT LIKE '%friends%'
  LIMIT limit_count;
  
  RETURN COALESCE(players, '[]'::jsonb);
END;
$$;

-- Fonction pour calculer et mettre à jour le GOAT All Time
CREATE OR REPLACE FUNCTION update_goat_alltime()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  top_player RECORD;
  goat_data JSONB;
BEGIN
  -- Trouver le meilleur joueur
  SELECT 
    SUBSTRING(key FROM 6) as user_id,
    value->>'userName' as user_name,
    (value->>'totalScore')::INTEGER as total_score
  INTO top_player
  FROM kv_store_3d47e466
  WHERE key LIKE 'user_%'
    AND key NOT LIKE '%daily%'
    AND key NOT LIKE '%friends%'
  ORDER BY (value->>'totalScore')::INTEGER DESC
  LIMIT 1;
  
  IF top_player IS NULL THEN
    RETURN '{"userId": null, "userName": "Aucun champion", "totalScore": 0}'::jsonb;
  END IF;
  
  goat_data := jsonb_build_object(
    'userId', top_player.user_id,
    'userName', top_player.user_name,
    'totalScore', top_player.total_score,
    'updatedAt', CURRENT_TIMESTAMP
  );
  
  -- Mettre à jour dans la KV store
  INSERT INTO kv_store_3d47e466 (key, value)
  VALUES ('goat_alltime', goat_data)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
  
  RETURN goat_data;
END;
$$;

-- =============================================================================
-- 7. VÉRIFICATION FINALE
-- =============================================================================
-- Affiche un résumé de ce qui a été créé

SELECT 'Table créée: kv_store_3d47e466' as status;

SELECT 'Total indexes: ' || COUNT(*)::TEXT as status
FROM pg_indexes
WHERE tablename = 'kv_store_3d47e466';

SELECT 'Total functions: ' || COUNT(*)::TEXT as status
FROM pg_proc
WHERE proname IN ('get_goat_of_day', 'get_top_players', 'update_goat_alltime', 'update_updated_at_column');

SELECT 'Total policies: ' || COUNT(*)::TEXT as status
FROM pg_policies
WHERE tablename = 'kv_store_3d47e466';

SELECT 'Total données initiales: ' || COUNT(*)::TEXT as status
FROM kv_store_3d47e466;
