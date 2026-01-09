# 🐐 KENNYGAMES

**"Who's the GOAT? You have 30 seconds"**

KENNYGAMES est un studio de mini-jeux web premium axé sur la compétition sociale. Un compte unique, des classements en temps réel, et un objectif : devenir le **GOAT** (Greatest Of All Time) en dominant tous les jeux.

---

## 🎮 Concept

### L'Idée
6 mini-jeux de 30 secondes chacun, conçus pour tester les réflexes et le calcul mental. Chaque joueur accumule des points à travers ses meilleurs scores, et le joueur avec le score total le plus élevé devient le **GOAT**.

### Les Termes

- **GOAT (Greatest Of All Time)** : Le meilleur joueur basé sur le cumul des meilleurs scores de chaque jeu
- **GOAT of All Time** : Le champion absolu depuis le lancement de la plateforme
- **GOAT of the Day** : Le meilleur joueur de la journée
- **Score total** : Somme des meilleurs scores personnels sur les 6 jeux (pas de cumul multi-parties)
- **Classement** : Position globale basée sur le score total

---

## 🕹️ Les 6 Jeux

Tous les jeux durent **exactement 30 secondes**.

### 1. **VIF** ⚡
- **Type** : Réflexes
- **Principe** : Clique sur des cercles qui apparaissent aléatoirement
- **Points** : Basé sur la précision (cliquer au centre = plus de points)
- **Combos** : x3 de points après 3 clics précis consécutifs

### 2-6. **PLUS / MOINS / MULTI / DIV / MIX** 🔢
- **Type** : Calcul mental
- **Principe** : Résoudre des opérations mathématiques le plus rapidement possible
- **Difficulté** : 8 choix de réponses (au lieu de 4) pour forcer le calcul
- **MIX** : Mélange aléatoire de toutes les opérations

---

## 🎨 Design

### Palette de Couleurs

#### Mode Clair
- **Fond** : `#F5F1E8` (Beige élégant)
- **Primaire** : `#2D6A4F` (Vert forêt)
- **Accent** : `#B87333` (Cuivre)
- **Cartes** : `#FFFFFF`

#### Mode Sombre
- **Fond** : `#0A1F14` (Vert sapin très foncé)
- **Primaire** : `#52B788` (Vert émeraude)
- **Accent** : `#D4A574` (Cuivre clair)
- **Texte** : `#E8DCC8` (Beige sable chaud)

### Identité Visuelle
- **Logo** : Tête de chèvre de profil (minimaliste, géométrique)
- **Style** : Flat design, épuré, premium
- **Navigation** : iOS Liquid Glass (effet glassmorphism avec blur)

---

## 🏗️ Architecture Technique

### Stack
- **Frontend** : React + TypeScript + Tailwind CSS v4
- **Backend** : Supabase Edge Functions (Deno) + Hono
- **Base de données** : Supabase PostgreSQL
- **Auth** : Supabase Auth
- **Hosting** : Supabase

### Structure des Données

#### Users (Supabase Auth)
```typescript
{
  id: string,
  email: string,
  user_metadata: {
    name: string
  }
}
```

#### kv_store_3d47e466 (Table principale)
```typescript
// Scores utilisateur
{
  key: `user_${userId}`,
  value: {
    totalGames: number,
    totalScore: number,
    gameScores: {
      [gameId]: {
        bestScore: number,
        totalGames: number,
        lastPlayed: timestamp
      }
    }
  }
}

// Classements quotidiens
{
  key: `daily_${date}`,
  value: {
    date: string,
    players: Array<{
      userId: string,
      userName: string,
      totalScore: number
    }>
  }
}

// GOAT of All Time
{
  key: `goat_alltime`,
  value: {
    userId: string,
    userName: string,
    totalScore: number,
    updatedAt: timestamp
  }
}
```

---

## 📂 Structure du Projet

```
/
├── App.tsx                          # Point d'entrée principal + navigation
├── components/
│   ├── AuthForm.tsx                 # Formulaire connexion/inscription
│   ├── GoatLogo.tsx                # Logo de chèvre SVG
│   ├── FriendsTab.tsx              # Onglet amis + comparaison scores
│   ├── ProfileTab.tsx              # Profil utilisateur + badges
│   ├── games/
│   │   ├── VifGame.tsx            # Jeu de réflexes
│   │   ├── MathGameTemplate.tsx   # Template pour jeux de calcul
│   │   ├── PlusGame.tsx           # Additions
│   │   ├── MoinsGame.tsx          # Soustractions
│   │   ├── MultiGame.tsx          # Multiplications
│   │   ├── DivGame.tsx            # Divisions
│   │   └── MixGame.tsx            # Opérations mélangées
│   └── ui/                         # Composants UI réutilisables
├── supabase/functions/server/
│   ├── index.tsx                   # Serveur Hono principal
│   └── kv_store.tsx               # Utilitaires KV (protégé)
├── utils/
│   ├── api.ts                      # Client API frontend
│   └── supabase/info.tsx          # Config Supabase (protégé)
└── styles/
    └── globals.css                 # Thème Tailwind v4 + CSS variables
```

---

## 🚀 Setup Supabase

### 1. Créer le projet Supabase
```bash
# Installer la CLI Supabase
npm install -g supabase

# Se connecter
supabase login

# Initialiser le projet (déjà fait dans ce repo)
supabase init
```

### 2. Variables d'environnement
Les variables suivantes sont automatiquement disponibles dans les Edge Functions :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

### 3. Déployer les Edge Functions
```bash
# Déployer la fonction serveur
supabase functions deploy server

# Vérifier les logs
supabase functions logs server
```

### 4. Configuration Auth
Dans le dashboard Supabase :
1. Aller dans **Authentication > Providers**
2. Activer **Email** provider
3. Désactiver l'email de confirmation (ou configurer un SMTP)

---

## 🔌 API Routes

Toutes les routes sont préfixées par `/make-server-3d47e466`.

### Auth
```typescript
POST /make-server-3d47e466/signup
Body: { name: string, email: string, password: string }
Response: { success: boolean, userId: string }

POST /make-server-3d47e466/login
Body: { email: string, password: string }
Response: { success: boolean, token: string, user: User }
```

### Scores
```typescript
POST /make-server-3d47e466/submit-score
Headers: { Authorization: "Bearer <token>" }
Body: { gameId: string, score: number }
Response: { success: boolean, isBestScore: boolean }

GET /make-server-3d47e466/user-stats
Headers: { Authorization: "Bearer <token>" }
Response: { success: boolean, stats: UserStats }
```

### Classements
```typescript
GET /make-server-3d47e466/goat-of-day
Response: { success: boolean, goat: { userName: string, totalScore: number } }

GET /make-server-3d47e466/leaderboard?limit=100
Response: { success: boolean, players: Player[] }
```

---

## 🎯 Features Actuelles

✅ 6 jeux fonctionnels (VIF + 5 jeux de calcul)  
✅ Système d'authentification  
✅ Sauvegarde des scores  
✅ Calcul du GOAT of the Day  
✅ Classements globaux  
✅ Onglet Amis avec comparaison  
✅ Profil avec badges de récompense  
✅ Mode sombre/clair  
✅ Navigation iOS Liquid Glass  
✅ Design responsive mobile-first  

---

## 🎯 Roadmap

### Phase 1 : Backend Réel (En cours)
- [ ] Remplacer les données fictives par Supabase
- [ ] Implémenter l'API complète dans `/supabase/functions/server/index.tsx`
- [ ] Tester les classements en temps réel
- [ ] Système d'amis (ajouter/accepter/supprimer)

### Phase 2 : Social
- [ ] Demandes d'amis
- [ ] Notifications (nouveau GOAT, ami vous a battu, etc.)
- [ ] Partage de scores sur réseaux sociaux

### Phase 3 : Gamification
- [ ] Plus de badges/récompenses
- [ ] Streaks quotidiennes
- [ ] Défis hebdomadaires
- [ ] Saisons avec récompenses

### Phase 4 : Nouveaux Jeux
- [ ] MEMO (mémoire)
- [ ] LOGIQUE (puzzles)
- [ ] RAPIDE (typing speed)

---

## 🛠️ Développement Local

```bash
# Installer les dépendances
npm install

# Lancer le serveur de dev
npm run dev

# Lancer Supabase localement
supabase start

# Lancer les Edge Functions localement
supabase functions serve
```

---

## 📱 Mobile-First

L'application est conçue mobile-first avec :
- Scroll vertical optimisé (`WebkitOverflowScrolling: 'touch'`)
- Scroll horizontal pour les scores d'amis
- Navigation tactile
- Tailles adaptatives (texte, icônes, cartes)

---

## 🎨 Principes de Design

1. **Minimaliste** : Pas de fioritures, focus sur l'essentiel
2. **Rapide** : 30 secondes par jeu, résultats instantanés
3. **Compétitif** : Tout tourne autour du classement
4. **Social** : Comparaison avec les amis en temps réel
5. **Premium** : Couleurs raffinées, animations fluides, détails soignés

---

## 📝 Notes Importantes

### Sécurité
- Ne jamais exposer `SUPABASE_SERVICE_ROLE_KEY` au frontend
- Toutes les opérations sensibles passent par le serveur
- Validation des tokens JWT pour chaque requête protégée

### Performance
- Pas d'animations sur la page d'accueil (choix délibéré pour fluidité)
- Animations uniquement sur hover et interactions
- Optimisation du scroll mobile

### Conventions
- Game IDs : `vif`, `plus`, `moins`, `multi`, `div`, `mix`
- Tous les jeux durent 30 secondes
- Score = nombre de bonnes réponses (sauf VIF où c'est des points)
- Classement basé sur le cumul des **meilleurs** scores (pas le cumul de toutes les parties)

---

## 🤝 Contribution

Pour l'instant, projet personnel. Si tu veux contribuer plus tard :
1. Fork le repo
2. Crée une branche feature
3. Commit tes changements
4. Push et ouvre une PR

---

## 📄 Licence

Propriétaire - Tous droits réservés

---

**Deviens le GOAT ! 🐐**
