/**
 * KennyGames - Game Components Index
 * 
 * Exports all 5 games:
 * - LéaNaval (Battleship — thème vin rouge & peinture)
 * - NourPigeon (Tir aux pigeons d'argile — campagne)
 * - SandyPong (Beer pong — thème rosé & plage chic)
 * - LilianoThunder (Artillerie — thème punk rock)
 * - EmmaBalls (Basket Street Art — 30s chrono)
 */

export { default as LeanavGame } from './leanav/LeanavGame';
export { default as NourarcheryGame } from './nourarchery/NourarcheryGame';
export { default as SandyGame } from './sandy/SandyGame';
export { default as LilianoGame } from './liliano/LilianoGame';
export { default as EmmaGame } from './emma/EmmaGame';

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
  },
  emma: {
    id: 'emma',
    name: 'EmmaBalls',
    emoji: '🏀',
    description: 'Basket Street Art — 30s chrono',
    players: 2,
    component: 'EmmaGame'
  }
};

// Helper to get game component by ID
export { default as LeanavGameComponent } from './leanav/LeanavGame';
export { default as NourarcheryGameComponent } from './nourarchery/NourarcheryGame';
export { default as SandyGameComponent } from './sandy/SandyGame';
export { default as LilianoGameComponent } from './liliano/LilianoGame';
export { default as EmmaGameComponent } from './emma/EmmaGame';
