/**
 * SandyPong - Beer Pong with Rosé Theme
 * Adapted from: https://github.com/FrBosquet/beerpong-canvas
 * Modifications: Rosé theme, swipe controls, game rules (rerack, balls back)
 */

export class SandyGame {
  constructor(config) {
    this.gameId = config.gameId;
    this.playerId = config.playerId;
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.onMove = config.onMove;
    this.onGameOver = config.onGameOver;
    
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    // Game state
    this.phase = 'aiming'; // aiming, shooting, result
    this.turn = 'player'; // player or opponent
    
    // Table and cup setup
    this.table = {
      x: 50,
      y: this.height - 150,
      width: this.width - 100,
      height: 120,
      color: '#8B4513'
    };
    
    // Initial cup formation (10 cups, triangle)
    this.playerCups = this.createCupFormation('player');
    this.opponentCups = this.createCupFormation('opponent');
    
    // Ball
    this.ball = null;
    this.ballRadius = 8;
    this.gravity = 0.4;
    this.bounceCoef = 0.6;
    
    // Aiming
    this.aimStartX = 0;
    this.aimStartY = 0;
    this.aimEndX = 0;
    this.aimEndY = 0;
    this.isAiming = false;
    
    // Scoring
    this.playerScore = 0; // cups made
    this.opponentScore = 0;
    this.consecutiveHits = 0; // For balls back rule
    
    // Rules
    this.ballsRemaining = 1;
    this.ballsBackActive = false;
  }

  createCupFormation(side) {
    const cups = [];
    const cupRadius = 15;
    const spacing = cupRadius * 2.5;
    
    // Triangle formation (4-3-2-1)
    const baseX = side === 'player' 
      ? this.width / 4
      : (this.width * 3) / 4;
    
    const baseY = this.table.y + 30;
    
    // Row 1 (4 cups)
    for (let i = 0; i < 4; i++) {
      cups.push({
        x: baseX - (1.5 * spacing) + (i * spacing),
        y: baseY,
        radius: cupRadius,
        active: true,
        row: 1
      });
    }
    
    // Row 2 (3 cups)
    for (let i = 0; i < 3; i++) {
      cups.push({
        x: baseX - spacing + (i * spacing),
        y: baseY + spacing * 0.87,
        radius: cupRadius,
        active: true,
        row: 2
      });
    }
    
    // Row 3 (2 cups)
    for (let i = 0; i < 2; i++) {
      cups.push({
        x: baseX - (spacing / 2) + (i * spacing),
        y: baseY + spacing * 0.87 * 2,
        radius: cupRadius,
        active: true,
        row: 3
      });
    }
    
    // Row 4 (1 cup)
    cups.push({
      x: baseX,
      y: baseY + spacing * 0.87 * 3,
      radius: cupRadius,
      active: true,
      row: 4
    });
    
    return cups;
  }

  rerackCups(cups) {
    // Automatic rerack at 6, 3, 2 cups remaining
    const activeCups = cups.filter(c => c.active);
    const count = activeCups.length;
    
    if (count === 6) {
      return this.createTriangleRerack(activeCups, 3); // 3-2-1
    } else if (count === 3) {
      return this.createTriangleRerack(activeCups, 2); // 2-1
    } else if (count === 2) {
      return this.createLineRerack(activeCups);
    }
    
    return cups;
  }

  createTriangleRerack(activeCups, rows) {
    // Reshape into triangle
    const cupRadius = 15;
    const spacing = cupRadius * 2.5;
    const baseX = activeCups[0].x; // Approximate
    const baseY = this.table.y + 30;
    
    let idx = 0;
    for (let row = 0; row < rows; row++) {
      const cupsInRow = rows - row;
      for (let col = 0; col < cupsInRow; col++) {
        if (idx < activeCups.length) {
          activeCups[idx].x = baseX - ((cupsInRow - 1) * spacing / 2) + (col * spacing);
          activeCups[idx].y = baseY + (row * spacing * 0.87);
          idx++;
        }
      }
    }
    
    return activeCups;
  }

  createLineRerack(activeCups) {
    const cupRadius = 15;
    const spacing = cupRadius * 2.5;
    const baseX = activeCups[0].x;
    const baseY = this.table.y + 30;
    
    activeCups[0].x = baseX - spacing / 2;
    activeCups[0].y = baseY;
    activeCups[1].x = baseX + spacing / 2;
    activeCups[1].y = baseY;
    
    return activeCups;
  }

  startAim(x, y) {
    if (this.phase !== 'aiming' || this.turn !== 'player') return;
    
    this.isAiming = true;
    this.aimStartX = x;
    this.aimStartY = y;
    this.aimEndX = x;
    this.aimEndY = y;
  }

  updateAim(x, y) {
    if (!this.isAiming) return;
    
    this.aimEndX = x;
    this.aimEndY = y;
  }

  shoot() {
    if (!this.isAiming || this.phase !== 'aiming') return;
    
    this.isAiming = false;
    this.phase = 'shooting';
    
    // Calculate velocity from swipe
    const dx = this.aimEndX - this.aimStartX;
    const dy = this.aimEndY - this.aimStartY;
    const power = Math.sqrt(dx * dx + dy * dy) / 20;
    
    // Ball starts from player side
    const startX = this.width / 4;
    const startY = this.table.y;
    
    // Launch angle and velocity
    const velocityX = dx / 10;
    const velocityY = dy / 10 - 8; // Upward initial velocity
    
    this.ball = {
      x: startX,
      y: startY,
      vx: velocityX,
      vy: velocityY,
      bounces: 0,
      maxBounces: 3,
      trail: []
    };
  }

  update() {
    if (this.phase === 'shooting' && this.ball) {
      // Update ball physics
      this.ball.vy += this.gravity;
      this.ball.x += this.ball.vx;
      this.ball.y += this.ball.vy;
      
      // Trail effect
      this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
      if (this.ball.trail.length > 20) {
        this.ball.trail.shift();
      }
      
      // Table bounce
      if (this.ball.y + this.ballRadius >= this.table.y) {
        this.ball.y = this.table.y - this.ballRadius;
        this.ball.vy *= -this.bounceCoef;
        this.ball.bounces++;
        
        if (this.ball.bounces > this.ball.maxBounces) {
          this.missShot();
          return;
        }
      }
      
      // Check collision with opponent cups
      const hitCup = this.checkCupCollision(this.opponentCups);
      if (hitCup) {
        this.makeShot(hitCup);
        return;
      }
      
      // Out of bounds
      if (this.ball.x < 0 || this.ball.x > this.width || this.ball.y > this.height + 50) {
        this.missShot();
      }
    }
  }

  checkCupCollision(cups) {
    for (let cup of cups) {
      if (!cup.active) continue;
      
      const dx = this.ball.x - cup.x;
      const dy = this.ball.y - cup.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.ballRadius + cup.radius) {
        return cup;
      }
    }
    return null;
  }

  makeShot(cup) {
    cup.active = false;
    this.playerScore++;
    this.consecutiveHits++;
    
    const activeCups = this.opponentCups.filter(c => c.active);
    
    // Check for rerack
    if (activeCups.length === 6 || activeCups.length === 3 || activeCups.length === 2) {
      this.opponentCups = this.rerackCups(this.opponentCups);
    }
    
    // Balls back rule (2 in a row)
    if (this.consecutiveHits === 2 && !this.ballsBackActive) {
      this.ballsBackActive = true;
      this.ballsRemaining++;
    }
    
    // Check win condition
    if (activeCups.length === 0) {
      this.phase = 'gameover';
      this.onGameOver?.('player');
      return;
    }
    
    this.ball = null;
    this.phase = 'result';
    
    this.onMove?.({
      type: 'shot_made',
      cupIndex: this.opponentCups.indexOf(cup),
      score: this.playerScore,
      consecutiveHits: this.consecutiveHits
    });
    
    // Continue turn if balls back active
    setTimeout(() => {
      if (this.ballsBackActive && this.ballsRemaining > 0) {
        this.ballsRemaining--;
        if (this.ballsRemaining === 0) {
          this.ballsBackActive = false;
        }
        this.phase = 'aiming';
      } else {
        this.endTurn();
      }
    }, 1500);
  }

  missShot() {
    this.ball = null;
    this.consecutiveHits = 0;
    this.phase = 'result';
    
    this.onMove?.({
      type: 'shot_missed',
      score: this.playerScore
    });
    
    setTimeout(() => {
      this.endTurn();
    }, 1000);
  }

  endTurn() {
    this.turn = this.turn === 'player' ? 'opponent' : 'player';
    this.phase = 'aiming';
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#ffd1dc'; // Rosé pink background
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw table
    this.ctx.fillStyle = this.table.color;
    this.ctx.fillRect(this.table.x, this.table.y, this.table.width, this.table.height);
    
    // Table outline
    this.ctx.strokeStyle = '#654321';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(this.table.x, this.table.y, this.table.width, this.table.height);
    
    // Draw cups
    this.drawCups(this.playerCups, '#f0e68c'); // Light color (not target)
    this.drawCups(this.opponentCups, '#ff69b4'); // Hot pink (target)
    
    // Draw ball
    if (this.ball) {
      this.drawBall();
    }
    
    // Draw aim line
    if (this.isAiming) {
      this.drawAimLine();
    }
    
    // Draw scores
    this.drawScores();
  }

  drawCups(cups, color) {
    for (let cup of cups) {
      if (!cup.active) continue;
      
      this.ctx.beginPath();
      this.ctx.arc(cup.x, cup.y, cup.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
      
      this.ctx.strokeStyle = '#8B0000';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }
  }

  drawBall() {
    // Draw trail
    if (this.ball.trail.length > 1) {
      this.ctx.strokeStyle = '#ffffff88';
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(this.ball.trail[0].x, this.ball.trail[0].y);
      for (let i = 1; i < this.ball.trail.length; i++) {
        this.ctx.lineTo(this.ball.trail[i].x, this.ball.trail[i].y);
      }
      this.ctx.stroke();
    }
    
    // Draw ball
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ballRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  drawAimLine() {
    this.ctx.strokeStyle = '#ff1493';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([10, 5]);
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.aimStartX, this.aimStartY);
    this.ctx.lineTo(this.aimEndX, this.aimEndY);
    this.ctx.stroke();
    
    this.ctx.setLineDash([]);
  }

  drawScores() {
    this.ctx.font = 'bold 24px Arial';
    this.ctx.fillStyle = '#8B0000';
    this.ctx.textAlign = 'center';
    
    // Player score
    this.ctx.fillText(`You: ${this.playerScore}/10`, this.width / 4, 40);
    
    // Opponent score
    this.ctx.fillText(`Opponent: ${this.opponentScore}/10`, (this.width * 3) / 4, 40);
  }

  getGameState() {
    return {
      playerCups: this.playerCups.map(c => ({ ...c })),
      opponentCups: this.opponentCups.map(c => ({ ...c })),
      playerScore: this.playerScore,
      opponentScore: this.opponentScore,
      turn: this.turn,
      phase: this.phase,
      consecutiveHits: this.consecutiveHits,
      ballsBackActive: this.ballsBackActive
    };
  }

  loadGameState(state) {
    this.playerCups = state.playerCups || this.createCupFormation('player');
    this.opponentCups = state.opponentCups || this.createCupFormation('opponent');
    this.playerScore = state.playerScore || 0;
    this.opponentScore = state.opponentScore || 0;
    this.turn = state.turn || 'player';
    this.phase = state.phase || 'aiming';
    this.consecutiveHits = state.consecutiveHits || 0;
    this.ballsBackActive = state.ballsBackActive || false;
  }
}
