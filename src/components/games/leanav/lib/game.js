/**
 * LéaNaval - Bataille Navale avec Bouteilles de Vin
 * Adapté de: https://github.com/kubowania/battleships
 * Modifications: Thème cave à vin, règle adjacence, multiplayer Supabase
 */

export class LeanavGame {
  constructor(config) {
    this.width = 10;
    this.playerSquares = [];
    this.opponentSquares = [];
    this.isHorizontal = true;
    this.currentPlayer = config.isPlayerTurn ? 'player' : 'opponent';
    this.gameId = config.gameId;
    this.playerId = config.playerId;
    this.onMove = config.onMove;
    this.onGameOver = config.onGameOver;
    this.onShipsPlaced = config.onShipsPlaced;
    
    // Bouteilles de vin au lieu de bateaux
    this.bottles = [
      { name: 'piccolo', size: 2, label: 'Piccolo (2)' },      // 187ml
      { name: 'demi', size: 3, label: 'Demi-bouteille (3)' },  // 375ml
      { name: 'standard', size: 3, label: 'Bouteille (3)' },   // 750ml
      { name: 'magnum', size: 4, label: 'Magnum (4)' },        // 1.5L
      { name: 'jeroboam', size: 5, label: 'Jéroboam (5)' }     // 3L
    ];
    
    this.playerBottles = [];
    this.opponentBottles = [];
    this.playerHits = [];
    this.opponentHits = [];
  }

  createBoard(isPlayer) {
    const squares = [];
    for (let i = 0; i < this.width * this.width; i++) {
      squares.push({
        id: i,
        hasBottle: false,
        bottleName: null,
        hit: false,
        miss: false
      });
    }
    
    if (isPlayer) {
      this.playerSquares = squares;
    } else {
      this.opponentSquares = squares;
    }
    
    return squares;
  }

  canPlaceBottle(startPos, size, isHorizontal, squares) {
    const positions = this.getBottlePositions(startPos, size, isHorizontal);
    
    // Check bounds
    for (let pos of positions) {
      if (pos < 0 || pos >= 100) return false;
      
      // Check edge wrapping
      if (isHorizontal) {
        const startRow = Math.floor(startPos / this.width);
        const posRow = Math.floor(pos / this.width);
        if (startRow !== posRow) return false;
      }
      
      // Check if already occupied
      if (squares[pos].hasBottle) return false;
    }
    
    // Check adjacency rule - no bottles can touch (8 directions)
    for (let pos of positions) {
      const adjacent = this.getAdjacentSquares(pos);
      for (let adjPos of adjacent) {
        if (!positions.includes(adjPos) && squares[adjPos]?.hasBottle) {
          return false; // Adjacent bottle found!
        }
      }
    }
    
    return true;
  }

  getAdjacentSquares(pos) {
    const row = Math.floor(pos / this.width);
    const col = pos % this.width;
    const adjacent = [];
    
    // 8 directions: N, NE, E, SE, S, SW, W, NW
    const directions = [
      [-1, 0],  // N
      [-1, 1],  // NE
      [0, 1],   // E
      [1, 1],   // SE
      [1, 0],   // S
      [1, -1],  // SW
      [0, -1],  // W
      [-1, -1]  // NW
    ];
    
    for (let [dRow, dCol] of directions) {
      const newRow = row + dRow;
      const newCol = col + dCol;
      
      if (newRow >= 0 && newRow < this.width && newCol >= 0 && newCol < this.width) {
        adjacent.push(newRow * this.width + newCol);
      }
    }
    
    return adjacent;
  }

  getBottlePositions(startPos, size, isHorizontal) {
    const positions = [];
    for (let i = 0; i < size; i++) {
      const offset = isHorizontal ? i : i * this.width;
      positions.push(startPos + offset);
    }
    return positions;
  }

  placeBottle(bottle, startPos, isHorizontal) {
    if (!this.canPlaceBottle(startPos, bottle.size, isHorizontal, this.playerSquares)) {
      return false;
    }
    
    const positions = this.getBottlePositions(startPos, bottle.size, isHorizontal);
    positions.forEach(pos => {
      this.playerSquares[pos].hasBottle = true;
      this.playerSquares[pos].bottleName = bottle.name;
    });
    
    this.playerBottles.push({
      name: bottle.name,
      positions: positions,
      hits: []
    });
    
    return true;
  }

  randomPlaceBottles() {
    // Auto-place bottles for opponent (or AI)
    const squares = [...this.opponentSquares];
    
    for (let bottle of this.bottles) {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        const isHorizontal = Math.random() > 0.5;
        const maxStart = isHorizontal 
          ? this.width * this.width - bottle.size
          : this.width * this.width - bottle.size * this.width;
        const startPos = Math.floor(Math.random() * maxStart);
        
        if (this.canPlaceBottle(startPos, bottle.size, isHorizontal, squares)) {
          const positions = this.getBottlePositions(startPos, bottle.size, isHorizontal);
          positions.forEach(pos => {
            squares[pos].hasBottle = true;
            squares[pos].bottleName = bottle.name;
          });
          
          this.opponentBottles.push({
            name: bottle.name,
            positions: positions,
            hits: []
          });
          
          placed = true;
        }
        
        attempts++;
      }
      
      if (!placed) {
        console.error('Could not place bottle:', bottle.name);
      }
    }
    
    this.opponentSquares = squares;
  }

  fire(squareId, isPlayer = true) {
    const squares = isPlayer ? this.opponentSquares : this.playerSquares;
    const bottles = isPlayer ? this.opponentBottles : this.playerBottles;
    
    if (squares[squareId].hit || squares[squareId].miss) {
      return { valid: false, message: 'Already fired here!' };
    }
    
    const square = squares[squareId];
    
    if (square.hasBottle) {
      square.hit = true;
      
      // Find the bottle and add hit
      const bottle = bottles.find(b => b.positions.includes(squareId));
      if (bottle) {
        bottle.hits.push(squareId);
        
        const isSunk = bottle.hits.length === bottle.positions.length;
        
        if (isSunk) {
          // Check if all bottles sunk (game over)
          const allSunk = bottles.every(b => b.hits.length === b.positions.length);
          
          if (allSunk) {
            this.onGameOver?.(isPlayer ? 'player' : 'opponent');
          }
          
          return {
            valid: true,
            hit: true,
            sunk: true,
            bottleName: bottle.name,
            gameOver: allSunk
          };
        }
        
        return {
          valid: true,
          hit: true,
          sunk: false,
          bottleName: bottle.name
        };
      }
    } else {
      square.miss = true;
      return {
        valid: true,
        hit: false
      };
    }
  }

  getGameState() {
    return {
      playerSquares: this.playerSquares.map(sq => ({
        hasBottle: sq.hasBottle,
        hit: sq.hit,
        miss: sq.miss,
        bottleName: sq.bottleName
      })),
      opponentSquares: this.opponentSquares.map(sq => ({
        hit: sq.hit,
        miss: sq.miss,
        // Don't reveal hasBottle to opponent!
      })),
      playerBottles: this.playerBottles.map(b => ({
        name: b.name,
        hitsCount: b.hits.length,
        size: b.positions.length,
        sunk: b.hits.length === b.positions.length
      })),
      opponentBottles: this.opponentBottles.map(b => ({
        name: b.name,
        hitsCount: b.hits.length,
        size: b.positions.length,
        sunk: b.hits.length === b.positions.length
      }))
    };
  }

  loadGameState(state) {
    // Load from Supabase state
    this.playerSquares = state.playerSquares || this.createBoard(true);
    this.opponentSquares = state.opponentSquares || this.createBoard(false);
    this.playerBottles = state.playerBottles || [];
    this.opponentBottles = state.opponentBottles || [];
  }
}
