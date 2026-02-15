# 🎮 KennyGames - 4 Jeux Multijoueurs Adaptés !

## 🎉 Tous les jeux sont prêts !

KennyGames dispose maintenant de **4 jeux complets** adaptés depuis des projets open source de qualité.

---

## 📋 Liste des Jeux

### 🍾 1. LéaNaval - Bataille de Cave
**Genre:** Stratégie, Tour par tour  
**Durée:** 10-15 minutes  
**Description:** Bataille navale revisitée avec des bouteilles de vin. Placez vos bouteilles (Piccolo, Magnum, Jéroboam...) et coulez la cave de votre adversaire !

**Règle spéciale:** Les bouteilles ne peuvent pas se toucher (adjacence)

**Fichiers:**
- `src/components/games/leanav/LeanavGame.tsx`
- `src/components/games/leanav/lib/game.js`

---

### 🎯 2. NourArchery - Tir à l'Arc Cyber
**Genre:** Adresse, Best of 3  
**Durée:** 5-10 minutes  
**Description:** Tir à l'arc futuriste dans un univers Matrix. Le vent change à chaque round et affecte votre trajectoire. Visez le bullseye pour 10 points !

**Règle spéciale:** Le vent aléatoire (-15 à +15) dévie vos flèches

**Fichiers:**
- `src/components/games/nourarchery/NourarcheryGame.tsx`
- `src/components/games/nourarchery/lib/game.js`

---

### 🍷 3. SandyPong - Beer Pong Rosé
**Genre:** Arcade, Physique  
**Durée:** 10-15 minutes  
**Description:** Beer pong sur une terrasse d'été avec du rosé ! Éliminez les 10 verres adverses avec des règles pro : rerack, balls back, et bonus bounce.

**Règles spéciales:**
- Rerack automatique à 6, 3, 2 verres
- Balls back si 2 tirs consécutifs réussis
- Bonus si la balle rebondit avant d'entrer

**Fichiers:**
- `src/components/games/sandy/SandyGame.tsx`
- `src/components/games/sandy/lib/game.js`

---

### ⚡ 4. LilianoThunder - Guitar Tanks
**Genre:** Artillerie, Destructible  
**Durée:** 15-20 minutes  
**Description:** Combat de guitares volantes dans un univers néon 80s. Ajustez angle et puissance pour détruire l'adversaire avec des éclairs. Le terrain se détruit à chaque explosion !

**Règle spéciale:** Le terrain est destructible, les joueurs tombent si le sol disparaît

**Fichiers:**
- `src/components/games/liliano/LilianoGame.tsx`
- `src/components/games/liliano/lib/game.js`

---

## 🛠️ Installation & Utilisation

### Prérequis
```bash
Node.js >= 18
npm ou pnpm
```

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```

### Build Production
```bash
npm run build
```

---

## 📦 Structure du Code

```
src/components/games/
├── index.ts                 # Export central de tous les jeux
├── leanav/                  # Bataille Navale
│   ├── LeanavGame.tsx       # Interface React
│   ├── LeanavGame.css       # Styles cave à vin
│   └── lib/
│       └── game.js          # Logique du jeu
├── nourarchery/             # Tir à l'Arc
│   ├── NourarcheryGame.tsx
│   ├── NourarcheryGame.css  # Styles cyber néon
│   └── lib/
│       └── game.js
├── sandy/                   # Beer Pong
│   ├── SandyGame.tsx
│   ├── SandyGame.css        # Styles rosé
│   └── lib/
│       └── game.js
└── liliano/                 # Tanks
    ├── LilianoGame.tsx
    ├── LilianoGame.css      # Styles néon 80s
    └── lib/
        └── game.js
```

---

## 🎨 Intégration dans l'App

### Import d'un jeu

```tsx
import { LeanavGame, NourarcheryGame, SandyGame, LilianoGame } from '@/components/games';

// Ou import individuel
import LeanavGame from '@/components/games/leanav/LeanavGame';
```

### Utilisation dans GameRoom

```tsx
function GameRoom({ gameId, gameType }) {
  const GameComponent = {
    leanav: LeanavGame,
    nourarchery: NourarcheryGame,
    sandy: SandyGame,
    liliano: LilianoGame
  }[gameType];

  return (
    <GameComponent
      gameId={gameId}
      playerId={currentUserId}
      opponentId={opponentId}
      isPlayerTurn={isMyTurn}
      onMove={(moveData) => {
        // Envoyer le coup à Supabase
        saveMove(gameId, moveData);
      }}
      onGameOver={(winner) => {
        // Gérer la fin de partie
        updateGameStatus(gameId, winner);
      }}
    />
  );
}
```

---

## 🔌 Intégration Supabase

### Schema Recommandé

```sql
-- Table games (si pas déjà existante)
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_type TEXT NOT NULL, -- 'leanav', 'nourarchery', 'sandy', 'liliano'
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  current_turn UUID, -- player1_id ou player2_id
  status TEXT DEFAULT 'waiting', -- 'waiting', 'playing', 'finished'
  winner_id UUID,
  game_state JSONB, -- État du jeu
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table game_moves (historique)
CREATE TABLE IF NOT EXISTS game_moves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id),
  player_id UUID REFERENCES users(id),
  move_data JSONB, -- Données du coup joué
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_players ON games(player1_id, player2_id);
CREATE INDEX idx_game_moves_game ON game_moves(game_id);
```

### Hooks Supabase

```typescript
// hooks/useGame.ts
export function useGame(gameId: string) {
  const [gameState, setGameState] = useState(null);
  
  useEffect(() => {
    // Subscribe to game updates
    const channel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${gameId}` },
        (payload) => {
          setGameState(payload.new.game_state);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);
  
  const saveMove = async (moveData: any) => {
    // Sauvegarder le coup
    await supabase.from('game_moves').insert({
      game_id: gameId,
      player_id: currentUserId,
      move_data: moveData
    });
    
    // Mettre à jour l'état du jeu
    await supabase.from('games').update({
      game_state: newState,
      current_turn: opponentId,
      updated_at: new Date()
    }).eq('id', gameId);
  };
  
  return { gameState, saveMove };
}
```

---

## 🎯 Prochaines Étapes

### 1. Tester Localement
```bash
npm run dev
# Ouvrir http://localhost:3000
# Tester chaque jeu individuellement
```

### 2. Ajouter Assets
- Images pour chaque jeu (bouteilles, guitares, flèches, verres)
- Sons (facultatif mais cool)
- Icônes UI

### 3. Intégrer Multiplayer
- Connecter à Supabase Realtime
- Gérer tour par tour
- Notifications push
- Historique des parties

### 4. Polish UI/UX
- Animations de transition
- Feedback visuel/sonore
- Loading states
- Error handling

### 5. Tests
- Tests unitaires (logique des jeux)
- Tests d'intégration (React components)
- Tests E2E (multiplayer flow)

### 6. Deploy
```bash
npm run build
vercel deploy --prod
```

---

## 📜 Crédits

Tous les jeux sont adaptés de projets open source. Voir [GAME_CREDITS.md](./GAME_CREDITS.md) pour la liste complète des attributions.

**Original Authors:**
- **LéaNaval**: Based on work by Ania Kubów
- **NourArchery**: Based on work by Adnan Zawad Toky (MIT)
- **SandyPong**: Based on work by FrBosquet
- **LilianoThunder**: Based on work by webermn15

**Adaptations par:** KennyGames Team

---

## 📞 Support

Pour toute question:
- GitHub Issues: [kennygames/issues]
- Email: kennygames@example.com

---

## 📄 License

**Original Projects:** Voir leurs licences respectives dans GAME_CREDITS.md  
**KennyGames Adaptations:** MIT License

---

**🎉 Bon jeu sur KennyGames ! 🎮**
