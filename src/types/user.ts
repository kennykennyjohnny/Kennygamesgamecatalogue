export interface User {
  id: string;
  username: string;
  email: string;
  avatar_seed: string;
  created_at?: string;
  updated_at?: string;
}

export interface Player extends User {
  score?: number;
  ready?: boolean;
  status?: 'waiting' | 'ready' | 'playing' | 'finished';
  player_order?: number;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  user_id: string;
  user_name: string;
  avatar_seed: string;
  player_order: number;
  status: 'waiting' | 'ready' | 'playing' | 'finished';
  score: number;
  joined_at: string;
}
