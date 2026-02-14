// Game type definitions for KennyGames Party

export type GameType = 'sandy' | 'liliano' | 'lea' | 'nour';

export type GameStatus = 'waiting' | 'active' | 'finished';
export type PlayerStatus = 'waiting' | 'ready' | 'playing' | 'finished';

export interface PartyGame {
  id: string;
  short_code: string;
  game_type: GameType;
  status: GameStatus;
  max_players: number;
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
    emoji: '🍷',
    color: '#ffc0cb',
    gradient: 'linear-gradient(135deg, #ff1493 0%, #ffc0cb 100%)',
    minPlayers: 2,
    maxPlayers: 2,
    description: 'Lance le bouchon, élimine les verres !',
  },
  liliano: {
    id: 'liliano' as GameType,
    name: 'LILIANOGAMES',
    subtitle: 'Tanks Guitares',
    emoji: '⚡',
    color: '#ff00ff',
    gradient: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)',
    minPlayers: 2,
    maxPlayers: 2,
    description: 'Détruit la guitare adverse !',
  },
  lea: {
    id: 'lea' as GameType,
    name: 'LÉAGAMES',
    subtitle: 'Bataille Navale Rosé',
    emoji: '🍾',
    color: '#722f37',
    gradient: 'linear-gradient(135deg, #722f37 0%, #d4af37 100%)',
    minPlayers: 2,
    maxPlayers: 2,
    description: 'Coule les bouteilles adverses !',
  },
  nour: {
    id: 'nour' as GameType,
    name: 'NOURGAMES',
    subtitle: 'Archery Labo IT',
    emoji: '💻',
    color: '#00ff41',
    gradient: 'linear-gradient(135deg, #00ff41 0%, #00d9ff 100%)',
    minPlayers: 2,
    maxPlayers: 2,
    description: 'Vise le bullseye Matrix !',
  },
} as const;
