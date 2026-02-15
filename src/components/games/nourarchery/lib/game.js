/**
 * NourArchery - Cyber Archery with Wind Mechanics
 * Adapted from: https://github.com/Adnan-Toky/archery-game (MIT License)
 * Modifications: Wind system, cyber theme, 3-round multiplayer
 */

export class NourarcheryGame {
  constructor(config) {
    this.gameId = config.gameId;
    this.playerId = config.playerId;
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.onMove = config.onMove;
    this.onRoundEnd = config.onRoundEnd;
    this.onGameOver = config.onGameOver;
    
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    // Game state
    this.phase = 'aiming'; // aiming, shooting, result
    this.round = 1;
    this.maxRounds = 3;
    this.scores = [];
    
    // Wind system
    this.wind = this.generateWind();
    
    // Bow position (left side)
    this.bow = {
      x: 50,
      y: this.height / 2,
      radius: 30
    };
    
    // Target (right side)
    this.target = {
      x: this.width - 80,
      y: this.height / 2,
      radius: 80,
      rings: [
        { score: 10, radius: 10, color: '#ffff00' },  // Bullseye - Yellow
        { score: 9, radius: 20, color: '#ff0000' },   // Red
        { score: 8, radius: 30, color: '#ff0000' },   // Red
        { score: 7, radius: 40, color: '#00ffff' },   // Cyan
        { score: 6, radius: 50, color: '#00ffff' },   // Cyan
        { score: 5, radius: 60, color: '#ff00ff' },   // Magenta
        { score: 4, radius: 70, color: '#ff00ff' },   // Magenta
        { score: 3, radius: 80, color: '#00ff00' }    // Green (outer)
      ]
    };
    
    // Arrow
    this.arrow = null;
    this.arrowInFlight = false;
    
    // Aiming
    this.aimAngle = 0;
    this.aimPower = 0;
    this.isPulling = false;
    this.pullStartTime = 0;
    this.maxPower = 100;
  }

  generateWind() {
    // Wind: -15 to +15 (negative = left, positive = right)
    const speed = (Math.random() * 30) - 15;
    return {
      speed: parseFloat(speed.toFixed(1)),
      direction: speed < 0 ? 'left' : 'right'
    };
  }

  startAiming() {
    this.phase = 'aiming';
    this.arrow = null;
    this.arrowInFlight = false;
    this.aimPower = 0;
  }

  startPull() {
    if (this.phase !== 'aiming' || this.arrowInFlight) return;
    
    this.isPulling = true;
    this.pullStartTime = Date.now();
  }

  updatePower() {
    if (!this.isPulling) return;
    
    const elapsed = Date.now() - this.pullStartTime;
    this.aimPower = Math.min((elapsed / 20), this.maxPower);
  }

  release() {
    if (!this.isPulling || this.phase !== 'aiming') return;
    
    this.isPulling = false;
    this.shoot();
  }

  shoot() {
    this.phase = 'shooting';
    this.arrowInFlight = true;
    
    // Create arrow with initial velocity
    const speed = (this.aimPower / this.maxPower) * 15;
    
    this.arrow = {
      x: this.bow.x + 30,
      y: this.bow.y,
      vx: speed * Math.cos(this.aimAngle),
      vy: speed * Math.sin(this.aimAngle),
      angle: this.aimAngle,
      trail: []
    };
  }

  update() {
    this.updatePower();
    
    if (this.arrowInFlight && this.arrow) {
      // Apply wind effect (stronger effect at higher Y positions)
      const windEffect = this.wind.speed * 0.01;
      this.arrow.vx += windEffect;
      
      // Update position
      this.arrow.x += this.arrow.vx;
      this.arrow.y += this.arrow.vy;
      
      // Gravity (very slight)
      this.arrow.vy += 0.05;
      
      // Update angle based on velocity
      this.arrow.angle = Math.atan2(this.arrow.vy, this.arrow.vx);
      
      // Add to trail
      this.arrow.trail.push({ x: this.arrow.x, y: this.arrow.y });
      if (this.arrow.trail.length > 15) {
        this.arrow.trail.shift();
      }
      
      // Check if hit target
      const dx = this.arrow.x - this.target.x;
      const dy = this.arrow.y - this.target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= this.target.radius) {
        this.hitTarget(distance);
      }
      
      // Check if missed (out of bounds)
      if (this.arrow.x > this.width + 50 || this.arrow.y < -50 || this.arrow.y > this.height + 50) {
        this.missTarget();
      }
    }
  }

  hitTarget(distance) {
    this.arrowInFlight = false;
    this.phase = 'result';
    
    // Calculate score based on distance from center
    let score = 0;
    for (let ring of this.target.rings) {
      if (distance <= ring.radius) {
        score = ring.score;
        break;
      }
    }
    
    this.scores.push(score);
    
    // Check if round complete or game over
    if (this.round >= this.maxRounds) {
      const totalScore = this.scores.reduce((a, b) => a + b, 0);
      this.onGameOver?.({ scores: this.scores, total: totalScore });
    } else {
      this.onRoundEnd?.({ round: this.round, score, scores: this.scores });
    }
    
    return { hit: true, score, distance: distance.toFixed(1) };
  }

  missTarget() {
    this.arrowInFlight = false;
    this.phase = 'result';
    
    this.scores.push(0);
    
    if (this.round >= this.maxRounds) {
      const totalScore = this.scores.reduce((a, b) => a + b, 0);
      this.onGameOver?.({ scores: this.scores, total: totalScore });
    } else {
      this.onRoundEnd?.({ round: this.round, score: 0, scores: this.scores });
    }
    
    return { hit: false, score: 0 };
  }

  nextRound() {
    this.round++;
    this.wind = this.generateWind();
    this.startAiming();
    
    this.onMove?.({
      type: 'next_round',
      round: this.round,
      wind: this.wind
    });
  }

  draw() {
    // Clear canvas
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw Matrix-style background
    this.drawMatrixBg();
    
    // Draw target
    this.drawTarget();
    
    // Draw wind indicator
    this.drawWind();
    
    // Draw bow
    this.drawBow();
    
    // Draw arrow
    if (this.arrow) {
      this.drawArrow();
    }
    
    // Draw aiming line
    if (this.phase === 'aiming' && !this.arrowInFlight) {
      this.drawAimLine();
    }
    
    // Draw power meter
    if (this.isPulling) {
      this.drawPowerMeter();
    }
  }

  drawMatrixBg() {
    // Simple cyber grid
    this.ctx.strokeStyle = '#00ff0033';
    this.ctx.lineWidth = 1;
    
    for (let i = 0; i < this.width; i += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.height);
      this.ctx.stroke();
    }
    
    for (let i = 0; i < this.height; i += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.width, i);
      this.ctx.stroke();
    }
  }

  drawTarget() {
    // Draw rings from outside to inside
    for (let i = this.target.rings.length - 1; i >= 0; i--) {
      const ring = this.target.rings[i];
      
      this.ctx.beginPath();
      this.ctx.arc(this.target.x, this.target.y, ring.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = ring.color;
      this.ctx.fill();
      
      // Neon glow effect
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = ring.color;
      this.ctx.strokeStyle = ring.color;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }
  }

  drawWind() {
    const x = this.width / 2;
    const y = 30;
    
    this.ctx.font = '16px monospace';
    this.ctx.fillStyle = '#00ffff';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`WIND: ${this.wind.speed > 0 ? '→' : '←'} ${Math.abs(this.wind.speed).toFixed(1)}`, x, y);
    
    // Wind arrow
    const arrowLength = Math.abs(this.wind.speed) * 3;
    const arrowX = x + (this.wind.speed > 0 ? 80 : -80);
    
    this.ctx.strokeStyle = '#00ffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(arrowX, y + 5);
    this.ctx.lineTo(arrowX + (this.wind.speed > 0 ? arrowLength : -arrowLength), y + 5);
    this.ctx.stroke();
  }

  drawBow() {
    // Simple bow (arc)
    this.ctx.strokeStyle = '#ff00ff';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(this.bow.x, this.bow.y, this.bow.radius, Math.PI * 0.7, Math.PI * 1.3);
    this.ctx.stroke();
    
    // Bowstring
    if (this.isPulling) {
      const pullback = this.aimPower * 0.3;
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(this.bow.x, this.bow.y - this.bow.radius * 0.8);
      this.ctx.lineTo(this.bow.x - pullback, this.bow.y);
      this.ctx.lineTo(this.bow.x, this.bow.y + this.bow.radius * 0.8);
      this.ctx.stroke();
    }
  }

  drawArrow() {
    if (!this.arrow) return;
    
    // Draw trail
    if (this.arrow.trail.length > 1) {
      this.ctx.strokeStyle = '#00ffff44';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(this.arrow.trail[0].x, this.arrow.trail[0].y);
      for (let i = 1; i < this.arrow.trail.length; i++) {
        this.ctx.lineTo(this.arrow.trail[i].x, this.arrow.trail[i].y);
      }
      this.ctx.stroke();
    }
    
    // Draw arrow
    const arrowLength = 40;
    const arrowWidth = 3;
    
    this.ctx.save();
    this.ctx.translate(this.arrow.x, this.arrow.y);
    this.ctx.rotate(this.arrow.angle);
    
    // Shaft
    this.ctx.fillStyle = '#00ffff';
    this.ctx.fillRect(-arrowLength / 2, -arrowWidth / 2, arrowLength, arrowWidth);
    
    // Tip
    this.ctx.beginPath();
    this.ctx.moveTo(arrowLength / 2, 0);
    this.ctx.lineTo(arrowLength / 2 - 10, -5);
    this.ctx.lineTo(arrowLength / 2 - 10, 5);
    this.ctx.closePath();
    this.ctx.fillStyle = '#ffff00';
    this.ctx.fill();
    
    this.ctx.restore();
  }

  drawAimLine() {
    const lineLength = 100;
    const endX = this.bow.x + Math.cos(this.aimAngle) * lineLength;
    const endY = this.bow.y + Math.sin(this.aimAngle) * lineLength;
    
    this.ctx.strokeStyle = '#ff00ff88';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(this.bow.x + 30, this.bow.y);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  drawPowerMeter() {
    const x = this.bow.x;
    const y = this.bow.y - 60;
    const width = 100;
    const height = 10;
    
    // Background
    this.ctx.fillStyle = '#333';
    this.ctx.fillRect(x - width / 2, y, width, height);
    
    // Power fill
    const powerWidth = (this.aimPower / this.maxPower) * width;
    this.ctx.fillStyle = this.aimPower >= this.maxPower ? '#ff0000' : '#00ff00';
    this.ctx.fillRect(x - width / 2, y, powerWidth, height);
    
    // Border
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - width / 2, y, width, height);
  }

  setAimAngle(clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseY = clientY - rect.top;
    const dy = mouseY - this.bow.y;
    const dx = 100; // Fixed horizontal distance for aiming
    
    this.aimAngle = Math.atan2(dy, dx);
    
    // Clamp angle to reasonable range
    this.aimAngle = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.aimAngle));
  }

  getGameState() {
    return {
      round: this.round,
      scores: this.scores,
      wind: this.wind,
      phase: this.phase
    };
  }

  loadGameState(state) {
    this.round = state.round || 1;
    this.scores = state.scores || [];
    this.wind = state.wind || this.generateWind();
    this.phase = state.phase || 'aiming';
  }
}
