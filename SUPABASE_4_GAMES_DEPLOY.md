# 🚀 GUIDE DÉPLOIEMENT SUPABASE - KENNYGAMES 4 JEUX

## ✅ CE QUI EXISTE DÉJÀ

Ton projet a déjà une base Supabase configurée avec :
- ✅ Tables `party_games`, `party_game_players`, `party_game_state`
- ✅ RLS (Row Level Security) activé
- ✅ Fonctions helpers (get_game_by_code, get_next_player_turn)

## 🆕 CE QU'IL FAUT AJOUTER

### Migration SQL à Exécuter

Le fichier `supabase/migrations/003_four_games_integration.sql` contient tout ce qu'il faut !

**Ça ajoute :**
- ✅ Support des 4 nouveaux types de jeux
- ✅ Table `party_game_moves` pour l'historique
- ✅ Fonctions helper pour gérer les jeux
- ✅ Vue `game_full_state` pour récupérer tout l'état
- ✅ Indexes de performance

---

## 📋 ÉTAPES DE DÉPLOIEMENT

### Option 1 : Via Supabase CLI (Recommandé)

```bash
# 1. Installer Supabase CLI si pas déjà fait
npm install -g supabase

# 2. Login Supabase
supabase login

# 3. Link ton projet
supabase link --project-ref TON_PROJECT_REF

# 4. Push les migrations
supabase db push

# OU appliquer juste la nouvelle migration
supabase migration up
```

### Option 2 : Via Dashboard Supabase

1. **Aller sur** : https://supabase.com/dashboard/project/TON_PROJECT/editor
2. **SQL Editor** → New Query
3. **Copier-coller** le contenu de `supabase/migrations/003_four_games_integration.sql`
4. **Run** ▶️
5. **Vérifier** qu'il n'y a pas d'erreurs

### Option 3 : Via Script

```bash
# Créer un script deploy
chmod +x deploy-db.sh

# Exécuter
./deploy-db.sh
```

---

## 🧪 VÉRIFICATION POST-DÉPLOIEMENT

### 1. Vérifier les Tables

```sql
-- Dans SQL Editor Supabase
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'party%';

-- Devrait retourner:
-- party_games
-- party_game_players  
-- party_game_state
-- party_game_moves (nouveau!)
```

### 2. Tester la Contrainte game_type

```sql
-- Devrait réussir
INSERT INTO party_games (short_code, game_type, creator_id, creator_name)
VALUES ('TEST01', 'leanav', 'test_user', 'Test User');

-- Devrait échouer (type invalide)
INSERT INTO party_games (short_code, game_type, creator_id, creator_name)
VALUES ('TEST02', 'invalid_game', 'test_user', 'Test User');
```

### 3. Tester les Fonctions Helper

```sql
-- Créer un jeu de test
SELECT create_test_game('nourarchery');

-- Récupérer l'état complet
SELECT * FROM game_full_state LIMIT 1;
```

### 4. Tester Realtime

```javascript
// Dans ton code frontend
const channel = supabase
  .channel('game:GAME_ID')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'party_game_state',
    filter: `game_id=eq.GAME_ID`
  }, (payload) => {
    console.log('Game state updated:', payload);
  })
  .subscribe();
```

---

## 🔧 CONFIGURATION FRONTEND

### 1. Variables d'Environnement

Créer `.env.local` (si pas déjà fait) :

```bash
# .env.local
VITE_SUPABASE_URL=https://ton-projet.supabase.co
VITE_SUPABASE_ANON_KEY=ton_anon_key_ici
```

### 2. Client Supabase

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10 // Pour éviter le throttling
    }
  }
});
```

### 3. Hook useGame

```typescript
// src/hooks/useGame.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useGame(gameId: string) {
  const [gameState, setGameState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Charger l'état initial
    loadGameState();

    // S'abonner aux changements
    const channel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'party_game_state',
        filter: `game_id=eq.${gameId}`
      }, (payload) => {
        setGameState(payload.new.state);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const loadGameState = async () => {
    const { data, error } = await supabase
      .from('game_full_state')
      .select('*')
      .eq('game_id', gameId)
      .single();

    if (data) {
      setGameState(data.game_state);
    }
    setIsLoading(false);
  };

  const saveMove = async (moveType: string, moveData: any, result?: any) => {
    // Enregistrer le coup
    await supabase.rpc('record_game_move', {
      game_uuid: gameId,
      player_id_param: currentUserId,
      player_name_param: currentUserName,
      move_type_param: moveType,
      move_data_param: moveData,
      result_param: result
    });

    // Mettre à jour l'état
    const newState = computeNewState(gameState, moveData, result);
    
    await supabase
      .from('party_game_state')
      .update({ 
        state: newState,
        current_turn_user_id: getNextPlayer()
      })
      .eq('game_id', gameId);
  };

  return { gameState, isLoading, saveMove };
}
```

---

## 🎮 INTÉGRATION PAR JEU

### LéaNaval (Bataille Navale)

```typescript
// Dans LeanavGame.tsx
const { gameState, saveMove } = useGame(gameId);

// Quand le joueur place ses bateaux
const onShipsPlaced = async (bottles) => {
  await saveMove('place_bottles', { 
    bottles: bottles 
  });
};

// Quand le joueur tire
const onFire = async (squareId, result) => {
  await saveMove('fire', { 
    squareId 
  }, { 
    hit: result.hit, 
    sunk: result.sunk 
  });
};
```

### NourArchery

```typescript
const onShoot = async (angle, power, wind, score) => {
  await saveMove('shoot', { 
    angle, 
    power, 
    wind 
  }, { 
    score, 
    distance: result.distance 
  });
};
```

### SandyPong

```typescript
const onShot = async (aimData, result) => {
  await saveMove(
    result.hit ? 'shot_made' : 'shot_missed', 
    { aimData }, 
    { hit: result.hit, cupIndex: result.cupIndex }
  );
};
```

### LilianoThunder

```typescript
const onFire = async (angle, power, damage) => {
  await saveMove('fire', { 
    angle, 
    power, 
    explosionX: result.x, 
    explosionY: result.y 
  }, { 
    damage, 
    targetHit: result.targetHit 
  });
};
```

---

## 📊 REALTIME SUBSCRIPTIONS

### Pattern Général

```typescript
// Pour chaque jeu
useEffect(() => {
  const channel = supabase
    .channel(`game:${gameId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'party_game_state',
      filter: `game_id=eq.${gameId}`
    }, (payload) => {
      // Recharger l'état du jeu
      if (payload.eventType === 'UPDATE') {
        game.loadGameState(payload.new.state);
      }
    })
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'party_game_moves',
      filter: `game_id=eq.${gameId}`
    }, (payload) => {
      // Nouveau coup joué
      showNotification(`${payload.new.player_name} a joué!`);
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [gameId]);
```

---

## 🔒 SÉCURITÉ RLS

Les policies sont déjà configurées dans la migration. Elles permettent :

✅ Tout le monde peut lire les jeux (public)
✅ N'importe qui peut créer un jeu (anonymous)
✅ Joueurs peuvent mettre à jour leur propre état
✅ Historique des coups accessible à tous

**Si tu veux restreindre :**

```sql
-- Exemple: Seuls les joueurs du jeu peuvent voir l'état
DROP POLICY "Anyone can read game state" ON party_game_state;
CREATE POLICY "Only game players can read state" ON party_game_state
  FOR SELECT USING (
    game_id IN (
      SELECT game_id FROM party_game_players 
      WHERE user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );
```

---

## 🐛 TROUBLESHOOTING

### Erreur: "relation does not exist"

```bash
# Vérifier que les migrations sont appliquées
supabase migration list

# Réappliquer si nécessaire
supabase db reset
```

### Erreur: RLS Policy

```sql
-- Désactiver temporairement RLS pour debug
ALTER TABLE party_game_state DISABLE ROW LEVEL SECURITY;

-- NE PAS FAIRE EN PRODUCTION!
```

### Realtime ne fonctionne pas

1. Vérifier que Realtime est activé dans Dashboard
2. Vérifier les publications :

```sql
-- Activer publication pour les tables
ALTER PUBLICATION supabase_realtime ADD TABLE party_game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE party_game_moves;
```

---

## 📞 COMMANDES UTILES

```bash
# Status des migrations
supabase migration list

# Créer nouvelle migration
supabase migration new nom_migration

# Reset DB (DANGER: efface tout)
supabase db reset

# Dump schema
supabase db dump -f schema.sql

# Backup données
supabase db dump --data-only -f data.sql
```

---

## ✅ CHECKLIST FINALE

- [ ] Migration 003 appliquée avec succès
- [ ] Tables `party_game_moves` existe
- [ ] Contrainte `game_type` inclut les 4 jeux
- [ ] Fonctions helper testées
- [ ] Vue `game_full_state` fonctionne
- [ ] Realtime activé pour les tables
- [ ] Client Supabase configuré frontend
- [ ] Hook `useGame` créé
- [ ] Tests sur jeu réel effectués

---

**🎉 UNE FOIS FAIT, TU ES PRÊT À JOUER ! 🎮**
