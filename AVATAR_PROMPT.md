# 🎨 PROMPT AVATARS DICEBEAR - GUIDE COPILOT

Ce fichier contient le prompt complet à copier-coller dans GitHub Copilot pour implémenter le système d'avatars fun-emoji dans KennyGames.

---

## 📋 PROMPT COMPLET

```
Implémente un système d'avatars DiceBear avec le style "fun-emoji" dans mon projet KennyGames (Next.js 14 App Router + TypeScript + Supabase + Tailwind).

TÂCHES:

1. Installe @dicebear/core et @dicebear/collection

2. Crée components/Avatar.tsx qui:
   - Props: seed (string), size ('sm'|'md'|'lg'), className
   - API: https://api.dicebear.com/9.x/fun-emoji/svg?seed=${seed}
   - Tailles: sm=32px, md=48px, lg=64px
   - Border circulaire orange (#ff6b35)

3. Migration Supabase déjà créée dans supabase/migrations/004_avatars_dicebear.sql

4. Dans lib/auth.ts: génère seed avec Math.random().toString(36).substring(2, 15)

5. Utilise <Avatar seed={user.avatar_seed} size="md" /> dans:
   - SAS/Lobby: liste joueurs avec avatars
   - Scoreboard: avatars + scores
   - Leaderboard: rank + avatar + username + score

6. (Optionnel) Page profil avec bouton "🎲 Nouvel Avatar" pour re-roll

Code minimal:

interface AvatarProps {
  seed: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Avatar({ seed, size = 'md', className = '' }: AvatarProps) {
  const sizes = { sm: 'w-8 h-8', md: 'w-12 h-12', lg: 'w-16 h-16' };
  const url = `https://api.dicebear.com/9.x/fun-emoji/svg?seed=${encodeURIComponent(seed)}`;
  return <img src={url} alt={seed} className={`${sizes[size]} rounded-full border-2 border-orange-500 ${className}`} />;
}

Génère tous les fichiers avec TypeScript propre et Next.js 14 compatible.
```

---

## 📂 FICHIERS CRÉÉS

✅ `supabase/migrations/004_avatars_dicebear.sql` - Migration Supabase
✅ `AVATAR_PROMPT.md` - Ce fichier (guide)

---

## 🚀 DÉPLOIEMENT SUPABASE

### Via CLI (Recommandé)

```bash
# Appliquer la migration
npx supabase migration up

# Ou si tu utilises le CLI Supabase
supabase db push
```

### Via Dashboard

1. Aller sur https://supabase.com/dashboard/project/TON_PROJECT/editor
2. SQL Editor → New Query
3. Copier-coller le contenu de `supabase/migrations/004_avatars_dicebear.sql`
4. Run ▶️

---

## 🧪 TESTS

Après implémentation, teste avec:

```sql
-- Créer des users de test
SELECT create_test_users();

-- Vérifier les seeds
SELECT id, username, avatar_seed FROM users;

-- Régénérer l'avatar de Kenny
SELECT regenerate_user_avatar('test_kenny');
```

Puis vérifie les avatars sur:
- https://api.dicebear.com/9.x/fun-emoji/svg?seed=kenny123
- https://api.dicebear.com/9.x/fun-emoji/svg?seed=sandy456
- https://api.dicebear.com/9.x/fun-emoji/svg?seed=lea789
- https://api.dicebear.com/9.x/fun-emoji/svg?seed=nour012

---

## 📦 COMMANDES

```bash
# Installer DiceBear
npm install @dicebear/core @dicebear/collection

# Appliquer migration
npx supabase migration up

# Lancer dev
npm run dev
```

---

## ✅ CHECKLIST

- [ ] Migration Supabase appliquée
- [ ] DiceBear installé
- [ ] Composant Avatar créé
- [ ] Hook useUser créé
- [ ] Avatars dans SAS/Lobby
- [ ] Avatars dans Scoreboard
- [ ] Avatars dans Leaderboard
- [ ] (Optionnel) Page profil avec re-roll

---

## 🎯 RÉSULTAT ATTENDU

Chaque joueur doit avoir un avatar emoji unique et rigolo qui:
- ✅ Se génère automatiquement à l'inscription
- ✅ Reste cohérent (même seed = même avatar)
- ✅ Peut être régénéré depuis le profil
- ✅ S'affiche partout (lobby, scoreboard, leaderboard)
- ✅ Est performant (API ou self-hosted)

---

**🎨 Profite de tes avatars fun-emoji ! 🎉**
