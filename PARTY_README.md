# KennyGames Party 🎮

**Pivot vers un système de mini-jeux multijoueurs tour par tour**

## Changements principaux

### ✅ Ce qui a été fait

1. **Architecture multijoueur**
   - Nouvelles tables Supabase (`party_games`, `party_game_players`, `party_game_state`)
   - Système de codes courts pour partager les parties (6 caractères)
   - Realtime sync via Supabase channels

2. **Nouveau flow utilisateur**
   - Écran d'accueil "Party" avec 2 options : Créer / Rejoindre
   - Sélection de jeu (4 jeux disponibles)
   - Lobby (SAS) avec liste de joueurs et statuts "Prêt"
   - Jeu tour par tour asynchrone

3. **Premier jeu implémenté : SandyGames (Beer Pong Rosé)**
   - Jeu 2 joueurs
   - 10 verres en pyramide par joueur
   - Swipe pour lancer le bouchon
   - Tour par tour : 2 lancers par tour
   - Détection de victoire

4. **Direction artistique conservée**
   - Palette beige/vert sapin maintenue
   - GoatLogo et style existant préservé
   - Dark mode fonctionnel

### 🚧 À finaliser

1. **Base de données**
   - Exécuter la migration SQL : `supabase/migrations/001_multiplayer_games.sql`
   - Dans Supabase Dashboard > SQL Editor

2. **Physique réaliste**
   - Intégrer Matter.js pour trajectoires balistiques
   - Collisions et rebonds réalistes

3. **Autres jeux**
   - LilianoGames (Tanks Guitares) ⚡
   - LéaGames (Bataille Navale) 🍾
   - NourGames (Archery IT) 💻

4. **Features avancées**
   - Notifications push (Web Push API)
   - Système de scores/Goat du jour adapté au multijoueur
   - Historique des parties
   - Animations de victoire (confetti)

## Structure du projet

```
src/
├── AppParty.tsx           # Nouvelle App avec routing Party
├── App.tsx                # Ancienne version (préservée)
├── components/
│   ├── party/
│   │   └── GameLobby.tsx  # Salle d'attente (SAS)
│   ├── games/
│   │   └── sandy/
│   │       └── SandyGame.tsx  # Beer Pong
│   ├── PartyHome.tsx      # Écran d'accueil Party
│   ├── GameSelection.tsx  # Choix du jeu
│   └── JoinGame.tsx       # Rejoindre via code
├── utils/
│   ├── gameTypes.ts       # Types TypeScript + metadata jeux
│   ├── partyApi.ts        # API calls Supabase
│   ├── shortCode.ts       # Génération codes courts
│   └── client.ts          # Supabase client
└── supabase/
    └── migrations/
        └── 001_multiplayer_games.sql
```

## Pour tester localement

1. **Lancer le SQL dans Supabase**
   ```bash
   # Copie le contenu de supabase/migrations/001_multiplayer_games.sql
   # Colle dans Supabase Dashboard > SQL Editor > New Query
   # Execute
   ```

2. **Démarrer l'app**
   ```bash
   npm run dev
   ```

3. **Flow de test**
   - Connecte-toi (compte existant)
   - Clique "Créer une partie"
   - Choisis "SANDYGAMES"
   - Copie le code (ex: ABC123)
   - Dans un autre onglet/navigateur :
     - Connecte-toi avec un autre compte
     - Clique "Rejoindre"
     - Entre le code
   - Dans le lobby, les 2 joueurs cliquent "Prêt"
   - Le créateur lance la partie
   - Jouez tour par tour (swipe vers le haut pour lancer)

## Notes techniques

### Réaltime Supabase
Les lobbies se mettent à jour en temps réel via :
```typescript
partyApi.subscribeToGame(gameId, callback)
```

### Codes courts
Format : 6 caractères alphanumériques (sans caractères confusants)
```
URL: kennygames.com/g/ABC123
```

### État de jeu
Stocké en JSONB dans `party_game_state.state`
Structure flexible selon le jeu :
```typescript
// Sandy
{
  cupsPlayer1: [1,2,3,4...],
  cupsPlayer2: [1,2,3,4...],
  currentPlayer: "userId",
  throwsLeft: 2,
  turnNumber: 1
}
```

## Roadmap

### Phase 1 (MVP) - ✅ Fait
- [x] Architecture DB
- [x] Lobby fonctionnel
- [x] SandyGames basique jouable

### Phase 2 - En cours
- [ ] Physique réaliste (Matter.js)
- [ ] Améliorer gameplay Sandy
- [ ] 2e jeu (Liliano Tanks)

### Phase 3
- [ ] 3e et 4e jeux (Léa, Nour)
- [ ] Notifications push
- [ ] Système de scoring adapté

### Phase 4
- [ ] Nettoyage ancien code
- [ ] PWA manifest
- [ ] Déploiement final

---

**Note:** L'ancienne version est préservée dans `App.tsx`. Pour revenir à l'ancienne version, change `main.tsx` pour importer `App` au lieu de `AppParty`.
