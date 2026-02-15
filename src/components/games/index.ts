/**
 * KennyGames - Game Components Index
 * 
 * Exports all 4 adapted games:
 * - LéaNaval (Battleship with wine bottles)
 * - NourArchery (Cyber archery with wind)
 * - SandyPong (Rosé beer pong)
 * - LilianoThunder (Guitar tanks)
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
    emoji: '🍾',
    description: 'Bataille Navale with wine bottles',
    players: 2,
    component: 'LeanavGame'
  },
  nourarchery: {
    id: 'nourarchery',
    name: 'NourArchery',
    emoji: '🎯',
    description: 'Cyber archery with wind mechanics',
    players: 2,
    component: 'NourarcheryGame'
  },
  sandy: {
    id: 'sandy',
    name: 'SandyPong',
    emoji: '🍷',
    description: 'Rosé beer pong game',
    players: 2,
    component: 'SandyGame'
  },
  liliano: {
    id: 'liliano',
    name: 'LilianoThunder',
    emoji: '⚡',
    description: 'Guitar tanks with lightning',
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
