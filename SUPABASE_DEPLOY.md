# 🚀 Déployer les Edge Functions Supabase pour KennyGames

## Prérequis
- Un compte Supabase avec un projet créé
- Supabase CLI installé (déjà fait ✅)
- Les variables d'environnement de ton projet

## 📝 Étapes de déploiement

### 1. **Lier ton projet Supabase**

```bash
supabase link --project-ref <TON_PROJECT_ID>
```

Tu trouveras ton `PROJECT_ID` dans: 
- Supabase Dashboard → Settings → General → Reference ID

### 2. **Configurer les secrets (optionnel)**

Si tu as besoin de secrets (API keys, etc.):

```bash
supabase secrets set MY_SECRET=valeur
```

### 3. **Déployer la fonction**

```bash
supabase functions deploy make-server-3d47e466
```

### 4. **Vérifier le déploiement**

Test de santé:
```bash
curl https://<PROJECT_ID>.supabase.co/functions/v1/make-server-3d47e466/health
```

Devrait retourner: `{"status":"ok"}`

---

## 🔧 Configuration dans le code

Le fichier `/src/utils/api.ts` pointe déjà vers:
```typescript
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-3d47e466`;
```

Assure-toi que `projectId` dans `/src/utils/supabase/info.ts` correspond à ton projet!

---

## 📚 Routes disponibles

### Auth
- `POST /make-server-3d47e466/auth/signup` - Créer un compte
- `POST /make-server-3d47e466/auth/login` - Se connecter
- `GET /make-server-3d47e466/auth/session` - Vérifier session

### Scores
- `POST /make-server-3d47e466/scores/submit` - Soumettre un score
- `GET /make-server-3d47e466/scores/leaderboard/:gameId` - Classement
- `GET /make-server-3d47e466/scores/stats` - Stats utilisateur
- `GET /make-server-3d47e466/scores/rank/:gameId` - Rang utilisateur
- `GET /make-server-3d47e466/scores/kenny-of-day` - GOAT du jour

---

## 🐛 Debugging

Voir les logs en temps réel:
```bash
supabase functions logs make-server-3d47e466
```

---

## 📝 Note importante

L'Edge Function utilise un système KV (clé-valeur) différent de la table `kv_store_3d47e466`.
Tu peux adapter le code pour utiliser directement la table Supabase si tu préfères.

Pour cela, modifie `kv_store.ts` pour utiliser le client Supabase au lieu de Deno.KV.
