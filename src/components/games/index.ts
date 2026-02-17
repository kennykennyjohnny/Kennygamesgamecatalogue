/**
 * KennyGames - Game Components Index
 * 
 * Exports all 4 adapted games:
 * - LéaNaval (Battleship - naval warfare)
 * - NourArchery (Forest archery with wind)
 * - SandyPong (Beach ball pong)
 * - LilianoThunder (Thunder tanks)
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
    emoji: '⚓',
    description: 'Bataille Navale - place tes navires et coule la flotte ennemie',
    players: 2,
    component: 'LeanavGame'
  },
  nourarchery: {
    id: 'nourarchery',
    name: 'NourArchery',
    emoji: '🏹',
    description: 'Tir à l\'arc en forêt avec vent',
    players: 2,
    component: 'NourarcheryGame'
  },
  sandy: {
    id: 'sandy',
    name: 'SandyPong',
    emoji: '🏖️',
    description: 'Beer pong sur la plage',
    players: 2,
    component: 'SandyGame'
  },
  liliano: {
    id: 'liliano',
    name: 'LilianoThunder',
    emoji: '⚡',
    description: 'Tanks tonnerre - artillerie avec éclairs',
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
