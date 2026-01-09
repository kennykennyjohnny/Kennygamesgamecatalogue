# 🚀 GUIDE DE SETUP KENNYGAMES

Ce guide te montre **exactement** comment mettre en place KENNYGAMES avec Supabase, du début à la fin.

---

## 📋 Prérequis

- Un compte Supabase (gratuit) : https://supabase.com
- Node.js installé
- Git installé
- Ce code sur ton ordinateur

---

## 🗂️ ÉTAPE 1 : Comprendre l'Architecture

### Structure des Fichiers Importants

```
Kennygames/
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  ← SCRIPT SQL À EXÉCUTER
│   └── functions/server/
│       ├── index.tsx                ← SERVEUR PRINCIPAL
│       └── kv_store.tsx            ← UTILITAIRES (NE PAS MODIFIER)
├── utils/
│   ├── api.ts                       ← CLIENT API FRONTEND
│   └── supabase/info.tsx           ← CONFIG (NE PAS MODIFIER)
└── components/                      ← TON CODE REACT
```

### Les 3 Couches

1. **Frontend** (React) → Appelle l'API
2. **Server** (Edge Functions) → Traite les requêtes
3. **Database** (PostgreSQL) → Stocke les données

---

## 🛠️ ÉTAPE 2 : Créer le Projet Supabase

### 2.1 Créer le Projet

1. Va sur https://supabase.com
2. Clique sur "New Project"
3. Nom du projet : `kennygames`
4. Mot de passe de base de données : **GARDE-LE PRÉCIEUSEMENT**
5. Région : Choisis la plus proche (ex: `West EU (London)`)
6. Clique sur "Create new project"
7. **Attends 2-3 minutes** que le projet soit prêt

### 2.2 Récupérer les Variables d'Environnement

Une fois le projet créé :

1. Va dans **Settings** (icône engrenage en bas à gauche)
2. Clique sur **API**
3. Tu vas voir :
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon public** key (commence par `eyJ...`)
   - **service_role** key (commence par `eyJ...`) ⚠️ **SECRET!**

**GARDE CES 3 VALEURS**, tu en auras besoin !

---

## 🗄️ ÉTAPE 3 : Exécuter les Scripts SQL

### 3.1 Où est le Script ?

Le script SQL complet est dans : `/supabase/migrations/001_initial_schema.sql`

### 3.2 Comment l'Exécuter ?

1. Va sur ton projet Supabase
2. Clique sur **SQL Editor** (icône `</>` dans la barre de gauche)
3. Clique sur **New query**
4. **Copie-colle TOUT le contenu** de `/supabase/migrations/001_initial_schema.sql`
5. Clique sur **Run** (ou Ctrl+Enter)
6. Tu devrais voir des messages de succès

### 3.3 Ce que le Script Fait

✅ Crée des index sur la table `kv_store_3d47e466`  
✅ Active Row Level Security (RLS)  
✅ Crée les policies d'accès  
✅ Crée des fonctions SQL utiles :
   - `get_goat_of_day()` : Récupère le GOAT du jour
   - `get_top_players()` : Récupère le top 100
   - `update_goat_alltime()` : Calcule le meilleur joueur

✅ Insère les métadonnées des jeux  
✅ Initialise le GOAT All Time

### 3.4 Vérifier que ça a Marché

Dans le SQL Editor, exécute :

```sql
-- Vérifier les index
SELECT * FROM pg_indexes WHERE tablename = 'kv_store_3d47e466';

-- Vérifier les policies
SELECT * FROM pg_policies WHERE tablename = 'kv_store_3d47e466';

-- Vérifier les données initiales
SELECT * FROM kv_store_3d47e466 WHERE key = 'game_metadata';
```

Tu devrais voir des résultats !

---

## ⚙️ ÉTAPE 4 : Configurer l'Authentification

### 4.1 Dans Supabase

1. Va dans **Authentication** > **Providers**
2. Active **Email** provider (normalement déjà activé)
3. **IMPORTANT** : Pour les tests, désactive la confirmation d'email :
   - Va dans **Authentication** > **URL Configuration**
   - Coche "Disable email confirmations" (pour le développement)

### 4.2 (Optionnel) Activer Google OAuth

Si tu veux le login Google :

1. Va dans **Authentication** > **Providers**
2. Active **Google**
3. Suis le guide : https://supabase.com/docs/guides/auth/social-login/auth-google
4. ⚠️ Ne pas oublier de configurer les URLs de redirection !

---

## 🚀 ÉTAPE 5 : Déployer les Edge Functions

### 5.1 Installer la CLI Supabase

```bash
npm install -g supabase
```

### 5.2 Se Connecter

```bash
supabase login
```

Un navigateur va s'ouvrir, connecte-toi avec ton compte Supabase.

### 5.3 Lier le Projet

```bash
# Dans le dossier Kennygames
supabase link --project-ref <PROJECT_REF>
```

**Où trouver PROJECT_REF ?**  
Dans l'URL de ton projet Supabase : `https://supabase.com/dashboard/project/<PROJECT_REF>`

Ou va dans **Settings** > **General**, c'est le "Reference ID".

### 5.4 Déployer la Fonction Serveur

```bash
supabase functions deploy server
```

Tu devrais voir :

```
Deploying server (size: XX KB)...
server deployed successfully
```

### 5.5 Vérifier que ça Fonctionne

```bash
supabase functions logs server --follow
```

Laisse cette commande tourner dans un terminal pour voir les logs en temps réel.

---

## 🔗 ÉTAPE 6 : Configurer le Frontend

### 6.1 Les Variables sont Déjà Configurées !

Les fichiers suivants sont **protégés** et auto-configurés :
- `/utils/supabase/info.tsx`
- `/supabase/functions/server/kv_store.tsx`

Ils récupèrent automatiquement :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (côté serveur uniquement)

⚠️ **NE JAMAIS MODIFIER CES FICHIERS !**

### 6.2 Tester l'App Localement

```bash
npm install
npm run dev
```

Ouvre http://localhost:3000

---

## 📊 ÉTAPE 7 : Comprendre le Flux de Données

### 7.1 Quand un Utilisateur S'Inscrit

```
Frontend → api.signup()
   ↓
Server → /make-server-3d47e466/signup
   ↓
Supabase Auth → Crée l'utilisateur
   ↓
Server → Crée user_{userId} dans kv_store
   ↓
Frontend ← Reçoit le token
```

### 7.2 Quand un Utilisateur Joue

```
Frontend → Jeu VIF → Score = 720
   ↓
api.submitScore('vif', 720)
   ↓
Server → /make-server-3d47e466/submit-score
   ↓
Server → Met à jour user_{userId} dans kv_store
   ↓
Server → Vérifie si nouveau record
   ↓
Server → Update GOAT du jour si besoin
   ↓
Frontend ← { success: true, isBestScore: true }
```

### 7.3 Quand on Affiche le GOAT

```
Frontend → loadGoats()
   ↓
Server → /make-server-3d47e466/goat-of-day
   ↓
Server → SELECT FROM kv_store WHERE key = 'goat_daily_2025-01-10'
   ↓
Frontend ← { userName: "SuperKenny", totalScore: 850 }
```

---

## 🔍 ÉTAPE 8 : Débugger

### 8.1 Voir les Logs du Serveur

```bash
supabase functions logs server --follow
```

### 8.2 Tester une Route Directement

```bash
curl https://<PROJECT_REF>.supabase.co/functions/v1/make-server-3d47e466/health \
  -H "Authorization: Bearer <ANON_KEY>"
```

Devrait retourner : `{"status":"ok"}`

### 8.3 Voir les Données dans la Base

1. Va dans **Table Editor**
2. Sélectionne la table `kv_store_3d47e466`
3. Tu verras toutes les clés/valeurs

### 8.4 Problèmes Courants

#### "401 Unauthorized"
→ Token invalide ou expiré. Re-login.

#### "Row Level Security policy violation"
→ Les policies RLS bloquent. Vérifie que tu utilises `service_role` key dans le serveur.

#### "Function not found"
→ Edge Function pas déployée. Re-deploy avec `supabase functions deploy server`.

#### "CORS error"
→ Vérifie que le serveur retourne bien les headers CORS (déjà fait dans `/supabase/functions/server/index.tsx`).

---

## 📁 ÉTAPE 9 : Structure des Données KV

### Format des Clés

```typescript
// Stats utilisateur
"user_{userId}" → {
  userName: string,
  email: string,
  totalGames: number,
  totalScore: number,
  gameScores: {
    vif: { bestScore: number, totalGames: number, lastPlayed: timestamp },
    plus: { ... },
    moins: { ... },
    multi: { ... },
    div: { ... },
    mix: { ... }
  }
}

// GOAT du jour
"goat_daily_2025-01-10" → {
  date: "2025-01-10",
  userId: string,
  userName: string,
  totalScore: number
}

// GOAT All Time
"goat_alltime" → {
  userId: string,
  userName: string,
  totalScore: number,
  updatedAt: timestamp
}

// Amis (future feature)
"user_{userId}_friends" → {
  friends: [userId1, userId2],
  pendingRequests: [userId3]
}
```

---

## 🎯 ÉTAPE 10 : Remplacer les Données Fictives

### Dans le Code Actuel

Tous les éléments fictifs commencent par `FAKE_` :
- `FAKE_LEADERBOARD`
- `FAKE_GAME_LEADERS`
- `FAKE_FRIENDS`
- etc.

### Comment les Remplacer

1. **Ouvre `/utils/api.ts`**
2. Remplace les `return { success: true, ... }` par de vrais appels API
3. Exemple :

```typescript
// AVANT (fictif)
export const getUserStats = async (token: string) => {
  return { success: true, stats: FAKE_STATS };
};

// APRÈS (réel)
export const getUserStats = async (token: string) => {
  const response = await fetch(
    `${API_URL}/user-stats`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};
```

4. **Implémente les routes dans `/supabase/functions/server/index.tsx`**

---

## ✅ CHECKLIST FINALE

- [ ] Projet Supabase créé
- [ ] Script SQL `001_initial_schema.sql` exécuté
- [ ] Auth configurée (Email activé)
- [ ] CLI Supabase installée
- [ ] Projet linké avec `supabase link`
- [ ] Edge Function déployée avec `supabase functions deploy server`
- [ ] Frontend testé avec `npm run dev`
- [ ] Premier compte créé et testé
- [ ] Premier score enregistré
- [ ] GOAT affiché correctement
- [ ] Logs serveur vérifiés avec `supabase functions logs server`

---

## 🆘 Besoin d'Aide ?

### Documentation Supabase
- Auth : https://supabase.com/docs/guides/auth
- Edge Functions : https://supabase.com/docs/guides/functions
- Database : https://supabase.com/docs/guides/database

### Vérifier que Tout Marche

Exécute ce script SQL dans le SQL Editor :

```sql
-- Compte le nombre d'utilisateurs
SELECT COUNT(*) FROM kv_store_3d47e466 WHERE key LIKE 'user_%';

-- Affiche le GOAT All Time
SELECT * FROM kv_store_3d47e466 WHERE key = 'goat_alltime';

-- Affiche les 10 meilleurs joueurs
SELECT * FROM get_top_players(10);
```

---

**Bonne chance ! Deviens le GOAT ! 🐐**
