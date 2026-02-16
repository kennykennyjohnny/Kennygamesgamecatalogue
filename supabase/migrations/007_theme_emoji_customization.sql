-- ============================================================================
-- KENNYGAMES - THEME & EMOJI PROFILE CUSTOMIZATION
-- Migration pour ajouter la personnalisation du thème et emoji de profil
-- ============================================================================

-- =============================================================================
-- 1. AJOUTER COLONNES user_theme ET profile_emoji À LA TABLE users
-- =============================================================================

-- Ajouter la colonne pour le thème de l'utilisateur
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_theme TEXT DEFAULT 'emerald'
  CHECK (user_theme IN ('emerald', 'blue', 'purple', 'pink'));

-- Ajouter la colonne pour l'emoji de profil
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_emoji TEXT DEFAULT '🎮';

-- =============================================================================
-- 2. FONCTION POUR METTRE À JOUR LE THÈME
-- =============================================================================

CREATE OR REPLACE FUNCTION update_user_theme(
  user_id_param TEXT,
  new_theme TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Vérifier que le thème est valide
  IF new_theme NOT IN ('emerald', 'blue', 'purple', 'pink') THEN
    RAISE EXCEPTION 'Invalid theme. Must be one of: emerald, blue, purple, pink';
  END IF;

  UPDATE users
  SET user_theme = new_theme,
      updated_at = NOW()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. FONCTION POUR METTRE À JOUR L'EMOJI DE PROFIL
-- =============================================================================

CREATE OR REPLACE FUNCTION update_profile_emoji(
  user_id_param TEXT,
  new_emoji TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Vérifier que l'emoji n'est pas vide
  IF new_emoji IS NULL OR LENGTH(new_emoji) = 0 THEN
    RAISE EXCEPTION 'Profile emoji cannot be empty';
  END IF;

  UPDATE users
  SET profile_emoji = new_emoji,
      updated_at = NOW()
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. INDEX POUR PERFORMANCE (optionnel mais utile pour les stats)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_users_theme ON users(user_theme);

-- =============================================================================
-- 5. COMMENTAIRES
-- =============================================================================

COMMENT ON COLUMN users.user_theme IS 
'Thème de couleur choisi par l''utilisateur. 
Options: emerald (vert), blue (bleu), purple (violet), pink (rose).
Ce thème personnalise l''interface pour chaque utilisateur.';

COMMENT ON COLUMN users.profile_emoji IS 
'Emoji de profil choisi par l''utilisateur.
Peut être n''importe quel emoji Unicode.
Par défaut: 🎮 (manette de jeu).';

-- =============================================================================
-- 6. METTRE À JOUR LES USERS EXISTANTS AVEC DES VALEURS PAR DÉFAUT
-- =============================================================================

-- Assigner des thèmes aléatoires aux users existants pour plus de fun
UPDATE users 
SET user_theme = CASE 
  WHEN user_theme IS NULL THEN (
    CASE (RANDOM() * 4)::INT
      WHEN 0 THEN 'emerald'
      WHEN 1 THEN 'blue'
      WHEN 2 THEN 'purple'
      ELSE 'pink'
    END
  )
  ELSE user_theme
END
WHERE user_theme IS NULL;

-- Assigner des emojis par défaut si NULL
UPDATE users 
SET profile_emoji = COALESCE(profile_emoji, '🎮')
WHERE profile_emoji IS NULL OR profile_emoji = '';

-- =============================================================================
-- 7. RLS POLICIES (si nécessaire)
-- =============================================================================

-- Les policies existantes sur users permettent déjà:
-- - Lecture publique (SELECT)
-- - Update par le user lui-même
-- Donc pas besoin de nouvelles policies spécifiques

-- =============================================================================
-- MIGRATION TERMINÉE ✅
-- =============================================================================

-- Pour tester:
-- SELECT id, username, user_theme, profile_emoji FROM users;
-- SELECT update_user_theme('test_kenny', 'purple');
-- SELECT update_profile_emoji('test_kenny', '👑');
