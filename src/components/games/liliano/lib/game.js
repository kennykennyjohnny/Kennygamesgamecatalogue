/**
 * LilianoThunder - Guitar Tanks with Lightning Attacks
 * Adapted from: https://github.com/webermn15/Scorch_a-scorched-earth-clone
 * Modifications: Guitar/amp theme, 80s neon aesthetic, multiplayer
 */

export class LilianoGame {
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
    this.currentPlayer = 'player1';
    
    // Terrain
    this.terrain = this.generateTerrain();
    
    // Players (guitars)
    this.player1 = {
      x: 150,
      y: this.getTerrainHeight(150),
      hp: 100,
      color: '#ff00ff', // Magenta
      angle: 45,
      power: 50
    };
    
    this.player2 = {
      x: this.width - 150,
      y: this.getTerrainHeight(this.width - 150),
      hp: 100,
      color: '#00ffff', // Cyan
      angle: 135,
      power: 50
    };
    
    // Projectile
    this.projectile = null;
    this.gravity = 0.3;
    this.explosionRadius = 30;
    
    // Controls
    this.angleStep = 1;
    this.powerStep = 1;
  }

  generateTerrain() {
    const points = [];
    const segments = 100;
    
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * this.width;
      
      // Use sine waves for varied terrain
      const baseHeight = this.height * 0.6;
      const wave1 = Math.sin(i * 0.1) * 40;
      const wave2 = Math.sin(i * 0.05) * 60;
      const wave3 = Math.sin(i * 0.15) * 20;
      
      const y = baseHeight + wave1 + wave2 + wave3;
      
      points.push({ x, y });
    }
    
    return points;
  }

  getTerrainHeight(x) {
    // Interpolate terrain height at position x
    for (let i = 0; i < this.terrain.length - 1; i++) {
      const p1 = this.terrain[i];
      const p2 = this.terrain[i + 1];
      
      if (x >= p1.x && x <= p2.x) {
        const t = (x - p1.x) / (p2.x - p1.x);
        return p1.y + (p2.y - p1.y) * t;
      }
    }
    
    return this.terrain[this.terrain.length - 1].y;
  }

  adjustAngle(delta) {
    const player = this.currentPlayer === 'player1' ? this.player1 : this.player2;
    player.angle = Math.max(0, Math.min(180, player.angle + delta));
  }

  adjustPower(delta) {
    const player = this.currentPlayer === 'player1' ? this.player1 : this.player2;
    player.power = Math.max(10, Math.min(100, player.power + delta));
  }

  fire() {
    if (this.phase !== 'aiming') return;
    
    const player = this.currentPlayer === 'player1' ? this.player1 : this.player2;
    
    this.phase = 'shooting';
    
    // Calculate initial velocity
    const angleRad = (player.angle * Math.PI) / 180;
    const speed = (player.power / 100) * 15;
    
    this.projectile = {
      x: player.x,
      y: player.y - 20,
      vx: Math.cos(angleRad) * speed,
      vy: -Math.sin(angleRad) * speed,
      trail: []
    };
    
    this.onMove?.({
      type: 'fire',
      player: this.currentPlayer,
      angle: player.angle,
      power: player.power
    });
  }

  update() {
    if (this.phase === 'shooting' && this.projectile) {
      // Update projectile physics
      this.projectile.vy += this.gravity;
      this.projectile.x += this.projectile.vx;
      this.projectile.y += this.projectile.vy;
      
      // Trail
      this.projectile.trail.push({ x: this.projectile.x, y: this.projectile.y });
      if (this.projectile.trail.length > 30) {
        this.projectile.trail.shift();
      }
      
      // Check terrain collision
      const terrainHeight = this.getTerrainHeight(this.projectile.x);
      
      if (this.projectile.y >= terrainHeight) {
        this.explode(this.projectile.x, this.projectile.y);
        return;
      }
      
      // Check out of bounds
      if (this.projectile.x < 0 || this.projectile.x > this.width || this.projectile.y > this.height) {
        this.missShot();
      }
    }
  }

  explode(x, y) {
    this.projectile = null;
    this.phase = 'explosion';
    
    // Destroy terrain in explosion radius
    this.destroyTerrain(x, y, this.explosionRadius);
    
    // Check damage to players
    this.checkPlayerDamage(x, y);
    
    // Update player positions (they might fall)
    this.updatePlayerPositions();
    
    setTimeout(() => {
      // Check win condition
      if (this.player1.hp <= 0) {
        this.phase = 'gameover';
        this.onGameOver?.('player2');
        return;
      }
      
      if (this.player2.hp <= 0) {
        this.phase = 'gameover';
        this.onGameOver?.('player1');
        return;
      }
      
      // Switch turns
      this.currentPlayer = this.currentPlayer === 'player1' ? 'player2' : 'player1';
      this.phase = 'aiming';
    }, 1500);
  }

  destroyTerrain(x, y, radius) {
    // Lower terrain points within explosion radius
    for (let point of this.terrain) {
      const dx = point.x - x;
      const dy = point.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < radius) {
        const factor = 1 - (distance / radius);
        point.y += radius * factor; // Lower the terrain
        
        // Clamp to canvas height
        point.y = Math.min(point.y, this.height);
      }
    }
  }

  checkPlayerDamage(x, y) {
    // Check player1
    const dx1 = this.player1.x - x;
    const dy1 = this.player1.y - y;
    const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    
    if (dist1 < this.explosionRadius * 1.5) {
      const damage = Math.round(50 * (1 - dist1 / (this.explosionRadius * 1.5)));
      this.player1.hp = Math.max(0, this.player1.hp - damage);
    }
    
    // Check player2
    const dx2 = this.player2.x - x;
    const dy2 = this.player2.y - y;
    const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    
    if (dist2 < this.explosionRadius * 1.5) {
      const damage = Math.round(50 * (1 - dist2 / (this.explosionRadius * 1.5)));
      this.player2.hp = Math.max(0, this.player2.hp - damage);
    }
  }

  updatePlayerPositions() {
    // Make players fall if terrain below them is destroyed
    this.player1.y = this.getTerrainHeight(this.player1.x);
    this.player2.y = this.getTerrainHeight(this.player2.x);
  }

  missShot() {
    this.projectile = null;
    this.phase = 'result';
    
    setTimeout(() => {
      this.currentPlayer = this.currentPlayer === 'player1' ? 'player2' : 'player1';
      this.phase = 'aiming';
    }, 1000);
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#0a0014'; // Dark purple
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw stars background
    this.drawStars();
    
    // Draw terrain
    this.drawTerrain();
    
    // Draw players
    this.drawPlayer(this.player1);
    this.drawPlayer(this.player2);
    
    // Draw projectile
    if (this.projectile) {
      this.drawProjectile();
    }
    
    // Draw UI
    this.drawUI();
  }

  drawStars() {
    // Simple star field
    this.ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 37) % this.width;
      const y = (i * 47) % (this.height * 0.5);
      const size = 1 + (i % 3);
      this.ctx.fillRect(x, y, size, size);
    }
  }

  drawTerrain() {
    // Draw terrain as filled polygon
    this.ctx.fillStyle = '#2a1a3a';
    this.ctx.strokeStyle = '#ff00ff';
    this.ctx.lineWidth = 2;
    
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.height);
    
    for (let point of this.terrain) {
      this.ctx.lineTo(point.x, point.y);
    }
    
    this.ctx.lineTo(this.width, this.height);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawPlayer(player) {
    const isActive = (player === this.player1 && this.currentPlayer === 'player1') ||
                     (player === this.player2 && this.currentPlayer === 'player2');
    
    // Draw guitar body
    this.ctx.fillStyle = player.color;
    this.ctx.strokeStyle = isActive ? '#ffffff' : player.color;
    this.ctx.lineWidth = isActive ? 3 : 1;
    
    // Simple guitar shape
    this.ctx.beginPath();
    this.ctx.ellipse(player.x, player.y - 10, 12, 20, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Guitar neck (barrel/aim line)
    if (isActive) {
      const angleRad = (player.angle * Math.PI) / 180;
      const length = 30;
      const endX = player.x + Math.cos(angleRad) * length;
      const endY = player.y - 10 - Math.sin(angleRad) * length;
      
      this.ctx.strokeStyle = player.color;
      this.ctx.lineWidth = 3;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = player.color;
      this.ctx.beginPath();
      this.ctx.moveTo(player.x, player.y - 10);
      this.ctx.lineTo(endX, endY);
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
    
    // HP bar
    const barWidth = 40;
    const barHeight = 5;
    const barX = player.x - barWidth / 2;
    const barY = player.y - 40;
    
    // Background
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // HP fill
    const hpWidth = (player.hp / 100) * barWidth;
    this.ctx.fillStyle = player.hp > 50 ? '#00ff00' : player.hp > 25 ? '#ffff00' : '#ff0000';
    this.ctx.fillRect(barX, barY, hpWidth, barHeight);
    
    // Border
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  drawProjectile() {
    if (!this.projectile) return;
    
    // Draw trail
    if (this.projectile.trail.length > 1) {
      this.ctx.strokeStyle = '#ffff0088';
      this.ctx.lineWidth = 3;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#ffff00';
      
      this.ctx.beginPath();
      this.ctx.moveTo(this.projectile.trail[0].x, this.projectile.trail[0].y);
      for (let i = 1; i < this.projectile.trail.length; i++) {
        this.ctx.lineTo(this.projectile.trail[i].x, this.projectile.trail[i].y);
      }
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
    
    // Draw projectile (mini-guitar/lightning bolt)
    this.ctx.fillStyle = '#ffff00';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#ffff00';
    this.ctx.beginPath();
    this.ctx.arc(this.projectile.x, this.projectile.y, 5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  drawUI() {
    const player = this.currentPlayer === 'player1' ? this.player1 : this.player2;
    
    // Current player info
    this.ctx.font = 'bold 18px "Courier New"';
    this.ctx.fillStyle = player.color;
    this.ctx.textAlign = 'center';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowColor = player.color;
    
    this.ctx.fillText(`${this.currentPlayer.toUpperCase()}'s Turn`, this.width / 2, 30);
    
    // Angle and Power
    this.ctx.font = '16px "Courier New"';
    this.ctx.fillText(`Angle: ${player.angle}°`, this.width / 2, 55);
    this.ctx.fillText(`Power: ${player.power}%`, this.width / 2, 75);
    
    this.ctx.shadowBlur = 0;
    
    // Power bar
    const barWidth = 200;
    const barHeight = 15;
    const barX = (this.width - barWidth) / 2;
    const barY = 85;
    
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);
    
    const powerWidth = (player.power / 100) * barWidth;
    const gradient = this.ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    gradient.addColorStop(0, '#00ff00');
    gradient.addColorStop(0.5, '#ffff00');
    gradient.addColorStop(1, '#ff0000');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(barX, barY, powerWidth, barHeight);
    
    this.ctx.strokeStyle = player.color;
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(barX, barY, barWidth, barHeight);
  }

  getGameState() {
    return {
      player1: { ...this.player1 },
      player2: { ...this.player2 },
      terrain: this.terrain.map(p => ({ ...p })),
      currentPlayer: this.currentPlayer,
      phase: this.phase
    };
  }

  loadGameState(state) {
    this.player1 = state.player1 || this.player1;
    this.player2 = state.player2 || this.player2;
    this.terrain = state.terrain || this.generateTerrain();
    this.currentPlayer = state.currentPlayer || 'player1';
    this.phase = state.phase || 'aiming';
  }
}
