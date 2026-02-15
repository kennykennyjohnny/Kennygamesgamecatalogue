-- ============================================================================
-- KENNYGAMES - AVATARS DICEBEAR FUN-EMOJI
-- Migration pour ajouter le système d'avatars
-- ============================================================================

-- =============================================================================
-- 1. AJOUTER COLONNE avatar_seed À LA TABLE users
-- =============================================================================

-- Si la table users n'existe pas encore, la créer
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter la colonne avatar_seed
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_seed TEXT;

-- Générer un seed pour les utilisateurs existants (basé sur leur ID)
UPDATE users 
SET avatar_seed = COALESCE(avatar_seed, substring(md5(id || username), 1, 10))
WHERE avatar_seed IS NULL OR avatar_seed = '';

-- Rendre la colonne NOT NULL après avoir rempli les valeurs
ALTER TABLE users ALTER COLUMN avatar_seed SET NOT NULL;

-- Ajouter une valeur par défaut pour les futurs inserts
ALTER TABLE users ALTER COLUMN avatar_seed SET DEFAULT substring(md5(random()::text), 1, 10);

-- =============================================================================
-- 2. FONCTION HELPER POUR GÉNÉRER UN NOUVEAU SEED
-- =============================================================================

CREATE OR REPLACE FUNCTION generate_avatar_seed()
RETURNS TEXT AS $$
BEGIN
  RETURN substring(md5(random()::text || clock_timestamp()::text), 1, 10);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. FONCTION POUR RÉGÉNÉRER L'AVATAR D'UN USER
-- =============================================================================

CREATE OR REPLACE FUNCTION regenerate_user_avatar(user_id_param TEXT)
RETURNS TEXT AS $$
DECLARE
  new_seed TEXT;
BEGIN
  new_seed := generate_avatar_seed();
  
  UPDATE users
  SET avatar_seed = new_seed,
      updated_at = NOW()
  WHERE id = user_id_param;
  
  RETURN new_seed;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. TRIGGER POUR AUTO-GÉNÉRER SEED À LA CRÉATION
-- =============================================================================

CREATE OR REPLACE FUNCTION auto_generate_avatar_seed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.avatar_seed IS NULL OR NEW.avatar_seed = '' THEN
    NEW.avatar_seed := generate_avatar_seed();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_avatar_seed ON users;
CREATE TRIGGER trigger_auto_avatar_seed
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_avatar_seed();

-- =============================================================================
-- 5. INDEX POUR PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_users_avatar_seed ON users(avatar_seed);

-- =============================================================================
-- 6. COMMENTAIRES
-- =============================================================================

COMMENT ON COLUMN users.avatar_seed IS 
'Seed utilisé pour générer l''avatar DiceBear fun-emoji. 
Changer ce seed génère un nouvel avatar unique.
Format: chaîne alphanumérique de 10 caractères.';

-- =============================================================================
-- 7. RLS (Row Level Security) - Si nécessaire
-- =============================================================================

-- Activer RLS si pas déjà fait
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Tout le monde peut lire les profils publics (username + avatar)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
CREATE POLICY "Public profiles are viewable by everyone" 
  ON users FOR SELECT 
  USING (true);

-- Policy: Les users peuvent update leur propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" 
  ON users FOR UPDATE 
  USING (auth.uid()::text = id);

-- =============================================================================
-- 8. DONNÉES DE TEST (Optionnel - à supprimer en prod)
-- =============================================================================

-- Fonction pour créer des users de test avec avatars
CREATE OR REPLACE FUNCTION create_test_users()
RETURNS VOID AS $$
BEGIN
  INSERT INTO users (id, username, email, avatar_seed)
  VALUES 
    ('test_kenny', 'Kenny', 'kenny@kennygames.com', 'kenny123'),
    ('test_sandy', 'Sandy', 'sandy@kennygames.com', 'sandy456'),
    ('test_lea', 'Léa', 'lea@kennygames.com', 'lea789'),
    ('test_nour', 'Nour', 'nour@kennygames.com', 'nour012')
  ON CONFLICT (id) DO UPDATE SET avatar_seed = EXCLUDED.avatar_seed;
  
  RAISE NOTICE 'Test users created with fun-emoji avatars!';
END;
$$ LANGUAGE plpgsql;

-- Pour créer les users de test:
-- SELECT create_test_users();

-- =============================================================================
-- MIGRATION TERMINÉE ✅
-- =============================================================================

-- Pour tester:
-- SELECT id, username, avatar_seed FROM users;
-- SELECT regenerate_user_avatar('test_kenny');
