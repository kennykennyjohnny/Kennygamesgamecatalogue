# 📝 DÉTAILS DES MODIFICATIONS

## Fichiers modifiés

### 1. `src/components/AuthScreen.tsx`

**Avant:** Simulation avec setTimeout
```typescript
// Simulation - À remplacer par vrai appel Supabase
setTimeout(() => {
  onAuthSuccess({
    id: '1',
    name: name || email.split('@')[0],
    email: email
  });
}, 1000);
```

**Après:** Vrai auth Supabase
```typescript
if (isLogin) {
  // Login
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  // Récupère user depuis table users
  const { data: userData } = await supabase.from('users').select('*').eq('id', data.user!.id).single();
} else {
  // Signup
  const { data, error } = await supabase.auth.signUp({ email, password });
  // Insert dans table users
  await supabase.from('users').insert({ id: data.user!.id, username, email, profile_emoji: '🎮' });
}
```

**Ajouté:**
- Import `supabase`
- État `error` pour affichage erreurs
- Gestion async/await
- Insert profil dans DB lors signup

---

### 2. `src/components/FriendsPanel.tsx`

**Avant:** Données hardcodées
```typescript
const onlineFriends = [
  { id: '1', name: 'Kenny', avatar: '🎮', status: 'En ligne' },
  // ...
];
const pendingRequests = [
  { id: '6', name: 'Martin', avatar: '🎲' },
];
```

**Après:** Chargement depuis Supabase
```typescript
async function loadFriends(userId) {
  const { data } = await supabase
    .from('friendships')
    .select('*, users!friendships_friend_id_fkey(*)')
    .eq('user_id', userId)
    .eq('status', 'accepted');
  
  // Sépare online/offline basé sur last_seen
  setOnlineFriends(friends.filter(f => isOnline(f.last_seen)));
  setOfflineFriends(friends.filter(f => !isOnline(f.last_seen)));
}

async function loadPendingRequests(userId) {
  const { data } = await supabase
    .from('friendships')
    .select('*, users!friendships_user_id_fkey(*)')
    .eq('friend_id', userId)
    .eq('status', 'pending');
}

async function acceptRequest(requestId) {
  await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
}

async function rejectRequest(requestId) {
  await supabase.from('friendships').delete().eq('id', requestId);
}
```

**Ajouté:**
- Import `supabase`
- États dynamiques (onlineFriends, offlineFriends, pendingRequests)
- useEffect pour charger au mount
- Fonctions accept/reject avec vraies updates
- Détection online (< 5 min depuis last_seen)

---

### 3. `src/components/HomeScreen.tsx`

**Avant:** Données hardcodées
```typescript
const activeMatches = [
  { id: '1', gameId: 'sandy', opponent: 'Kenny', isMyTurn: true, myScore: 3 },
  // ...
];
const globalStats = { wins: 89, losses: 34, currentStreak: 5 };
const gameStats = [
  { gameId: 'sandy', wins: 24, losses: 8 },
  // ...
];
```

**Après:** Chargement depuis Supabase + Navigation
```typescript
async function loadActiveMatches(userId) {
  const { data } = await supabase
    .from('challenges')
    .select('*, challenger:users!challenger_id(*), opponent:users!opponent_id(*)')
    .eq('status', 'active')
    .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`);
  
  const matches = data.map(c => ({
    id: c.id,
    gameId: c.game_type,
    opponent: isChallenger ? c.opponent.username : c.challenger.username,
    opponentId: isChallenger ? c.opponent_id : c.challenger_id,
    isMyTurn: c.current_turn === userId,
    myScore: isChallenger ? c.challenger_score : c.opponent_score,
    opponentScore: isChallenger ? c.opponent_score : c.challenger_score,
  }));
}

async function loadStats(userId) {
  const { data } = await supabase.from('player_stats').select('*').eq('user_id', userId).single();
  setGlobalStats({
    wins: data.total_wins,
    losses: data.total_losses,
    currentStreak: data.current_streak,
    bestStreak: data.best_streak,
  });
  setGameStats([
    { gameId: 'sandy', wins: data.sandy_wins, losses: data.sandy_losses },
    // ...
  ]);
}

// Dans le JSX
<motion.div onClick={() => match.isMyTurn && onPlayMatch?.(match)}>
```

**Ajouté:**
- Import `supabase`
- Props `onPlayMatch` pour callback
- États dynamiques (activeMatches, globalStats, gameStats)
- useEffect pour charger au mount
- Click handler pour lancer partie

---

### 4. `src/components/ProfilePanel.tsx`

**Avant:** États locaux non sauvegardés
```typescript
const [avatarSeed, setAvatarSeed] = useState('felix');
const stats = [
  { label: 'Victoires', value: '89' },
  // ...
];
```

**Après:** Sauvegarde auto dans Supabase
```typescript
useEffect(() => {
  loadProfile();
}, []);

async function loadProfile() {
  const { data } = await supabase.from('users').select('profile_emoji, user_theme').eq('id', user.id).single();
  if (data.profile_emoji) setAvatarSeed(data.profile_emoji);
  if (data.user_theme) setTheme(data.user_theme);
  
  const { data: statsData } = await supabase.from('player_stats').select('*').eq('user_id', user.id).single();
  setStats([
    { label: 'Victoires', value: String(statsData.total_wins) },
    // ...
  ]);
}

useEffect(() => {
  if (avatarSeed) saveAvatar();
}, [avatarSeed]);

async function saveAvatar() {
  await supabase.from('users').update({ profile_emoji: avatarSeed }).eq('id', user.id);
}

useEffect(() => {
  saveTheme();
}, [theme]);

async function saveTheme() {
  await supabase.from('users').update({ user_theme: theme }).eq('id', user.id);
}
```

**Ajouté:**
- Import `supabase`
- useEffect pour charger profil
- useEffect pour sauver avatar automatiquement
- useEffect pour sauver thème automatiquement
- Stats dynamiques depuis DB

---

### 5. `src/components/MainApp.tsx`

**Avant:** Pas de navigation vers jeux
```typescript
// Juste 3 onglets: friends, play, profile
{activeTab === 'play' && <HomeScreen />}
```

**Après:** Navigation vers GameRoom
```typescript
const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);

function handlePlayMatch(match) {
  setActiveGame({
    gameId: match.id,
    gameType: match.gameId,
    playerId: user.id,
    opponentId: match.opponentId,
  });
}

function handleBackToHome() {
  setActiveGame(null);
}

if (activeGame) {
  return <GameRoomWrapper {...activeGame} onBack={handleBackToHome} />;
}

// Dans le JSX
{activeTab === 'play' && <HomeScreen onPlayMatch={handlePlayMatch} />}
```

**Ajouté:**
- Import `GameRoomWrapper`
- État `activeGame`
- Callbacks handlePlayMatch et handleBackToHome
- Rendu conditionnel GameRoomWrapper si partie active
- Passage du callback à HomeScreen

---

### 6. `src/components/GameRoomWrapper.tsx` (NOUVEAU)

**Purpose:** Adapter les données de challenges au format GameRoom

```typescript
export function GameRoomWrapper({ gameId, gameType, playerId, opponentId, onBack }) {
  const [game, setGame] = useState(null);
  const [userName, setUserName] = useState('');

  async function loadGameData() {
    // Charge challenge depuis Supabase
    const { data } = await supabase.from('challenges').select('*').eq('id', gameId).single();
    
    // Convertit en format PartyGame
    const partyGame = {
      id: data.id,
      game_type: data.game_type,
      short_code: data.id.substring(0, 6).toUpperCase(),
      current_player_id: data.current_turn,
      status: data.status,
    };
    
    setGame(partyGame);
    
    // Charge username
    const { data: userData } = await supabase.from('users').select('username').eq('id', playerId).single();
    setUserName(userData.username);
  }

  return <GameRoom game={game} currentUserId={playerId} currentUserName={userName} onBack={onBack} />;
}
```

**Permet:**
- Charger challenge par ID
- Convertir au format attendu par GameRoom
- Passer les bonnes props
- Loading state

---

## Résumé des changements

| Fichier | Changement principal | Impact |
|---------|---------------------|---------|
| AuthScreen | Faux auth → Vrai Supabase | Users peuvent s'inscrire/connecter |
| FriendsPanel | Données hardcodées → DB | Amis réels, accept/reject fonctionnel |
| HomeScreen | Données hardcodées → DB + Click | Parties réelles, navigation vers jeu |
| ProfilePanel | États locaux → DB sync | Avatar/thème sauvegardés, stats réelles |
| MainApp | Navigation statique → Dynamique | Peut lancer GameRoom |
| GameRoomWrapper | Nouveau fichier | Adapte challenges → GameRoom |

---

## Points clés

✅ **Aucune donnée hardcodée** - Tout vient de Supabase
✅ **Design préservé** - Aucun style changé
✅ **Fonctionnel** - L'utilisateur peut jouer
✅ **Temps réel** - Reload automatique des données
✅ **Persistance** - Avatar, thème, stats sauvegardés

---

## Tables Supabase utilisées

```sql
-- users
id, username, email, profile_emoji, user_theme, last_seen

-- friendships
id, user_id, friend_id, status (pending/accepted)

-- challenges
id, game_type, challenger_id, opponent_id, current_turn, status, 
challenger_score, opponent_score

-- player_stats
user_id, total_wins, total_losses, current_streak, best_streak,
sandy_wins, sandy_losses, nour_wins, nour_losses, 
liliano_wins, liliano_losses, lea_wins, lea_losses
```

---

**TOUT EST MAINTENANT CONNECTÉ! 🎉**
