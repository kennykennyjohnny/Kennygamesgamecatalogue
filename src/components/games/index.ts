/**
 * KennyGames - Game Components Index
 * 
 * Exports all 4 adapted games:
 * - LéaNaval (Battleship — thème vin rouge & peinture)
 * - NourPigeon (Tir aux pigeons d'argile — campagne)
 * - SandyPong (Beer pong — thème rosé & plage chic)
 * - LilianoThunder (Artillerie — thème punk rock)
 */

export { default as LeanavGame } from './leanav/LeanavGame';
export { default as NourarcheryGame } from './nourarchery/NourarcheryGame';
export { default as SandyGame } from './sandy/SandyGame';
export { default as LilianoGame } from './liliano/LilianoGame';

// Game metadata for easy reference
export const GAMES = {
  leanav: {
    id: 'leanav',
    name: 'LéaNaval',
    emoji: '🍷',
    description: 'Bataille Navale — vin rouge & peinture',
    players: 2,
    component: 'LeanavGame'
  },
  nourarchery: {
    id: 'nourarchery',
    name: 'NourPigeon',
    emoji: '🪶',
    description: 'Tir aux pigeons d\'argile — campagne',
    players: 2,
    component: 'NourarcheryGame'
  },
  sandy: {
    id: 'sandy',
    name: 'SandyPong',
    emoji: '🥂',
    description: 'Beer pong — verres de rosé',
    players: 2,
    component: 'SandyGame'
  },
  liliano: {
    id: 'liliano',
    name: 'LilianoThunder',
    emoji: '⚡',
    description: 'Artillerie punk rock — Scorched Earth',
    players: 2,
    component: 'LilianoGame'
  }
};

// Helper to get game component by ID
export function getGameComponent(gameId) {
  const gameMap = {
    leanav: require('./leanav/LeanavGame').default,
    nourarchery: require('./nourarchery/NourarcheryGame').default,
    sandy: require('./sandy/SandyGame').default,
    liliano: require('./liliano/LilianoGame').default
  };
  
  return gameMap[gameId] || null;
}
