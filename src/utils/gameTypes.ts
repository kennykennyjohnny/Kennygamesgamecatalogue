// Game type definitions for KennyGames Party

export type GameType = 'sandy' | 'liliano' | 'lea' | 'nour' | 'emma';

export type GameStatus = 'waiting' | 'active' | 'finished';
export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'finished';

export interface PartyGame {
  id: string;
  short_code: string;
  game_type: GameType;
  status: GameStatus;
  max_players: number;
  current_player_id?: string;
  creator_id: string;
  creator_name: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  winner_id?: string;
  winner_name?: string;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  user_name: string;
  avatar_seed?: string;
  player_order: number;
  status: PlayerStatus;
  score: number;
  joined_at: string;
}

export interface GameState {
  id: string;
  game_id: string;
  state: any; // Game-specific state (JSONB)
  current_turn_user_id?: string;
  turn_number: number;
  updated_at: string;
}

// Game metadata
export const GAMES_META = {
  sandy: {
    id: 'sandy' as GameType,
    name: 'SANDYGAMES',
    subtitle: 'Beer Pong Rosé',
    emoji: '🍹',
    color: '#e8879f',
    gradient: 'linear-gradient(135deg, #e8527a 0%, #f4b0c3 50%, #d4a053 100%)',
    minPlayers: 2,
    maxPlayers: 2,
    description: 'Lance la balle, vise les verres de rosé !',
  },
  liliano: {
    id: 'liliano' as GameType,
    name: 'LILIANOGAMES',
    subtitle: 'Artillerie Punk',
    emoji: '💥',
    color: '#d946ef',
    gradient: 'linear-gradient(135deg, #a21caf 0%, #d946ef 50%, #00ffff 100%)',
    minPlayers: 2,
    maxPlayers: 2,
    description: 'Détruis le tank adverse à coups de canon !',
  },
  lea: {
    id: 'lea' as GameType,
    name: 'LÉAGAMES',
    subtitle: 'Bataille Navale',
    emoji: '⚓',
    color: '#9b1b48',
    gradient: 'linear-gradient(135deg, #5a0a20 0%, #9b1b48 50%, #c9a050 100%)',
    minPlayers: 2,
    maxPlayers: 2,
    description: 'Coule les bouteilles cachées dans la cave !',
  },
  nour: {
    id: 'nour' as GameType,
    name: 'NOURGAMES',
    subtitle: 'Tir aux Pigeons',
    emoji: '🎯',
    color: '#e8762a',
    gradient: 'linear-gradient(135deg, #c45a20 0%, #e8762a 50%, #4a90d9 100%)',
    minPlayers: 2,
    maxPlayers: 2,
    description: 'Vise et tire sur les pigeons d\'argile !',
  },
  emma: {
    id: 'emma' as GameType,
    name: 'EMMAGAMES',
    subtitle: 'Basket Street Art',
    emoji: '🏀',
    color: '#ff6b35',
    gradient: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ffcc02 100%)',
    minPlayers: 2,
    maxPlayers: 2,
    description: 'Marque un max de paniers en 30 secondes !',
  },
} as const;
