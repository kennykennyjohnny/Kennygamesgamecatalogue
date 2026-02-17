import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ──────────────────────────────────────────────────────────────
   TANKS – A polished GamePigeon-style tank battle game
   Self-contained Canvas 2D component, React only.
   ────────────────────────────────────────────────────────────── */

// ── constants ────────────────────────────────────────────────
const W = 400;
const H = 500;
const GRAVITY = 0.15;
const TERRAIN_RESOLUTION = 2; // px per column
const EXPLOSION_RADIUS = 28;
const DIRECT_HIT_R = 22;
const NEAR_MISS_R = 55;
const TANK_W = 32;
const TANK_H = 16;
const BARREL_LEN = 22;
const SHELL_R = 3;
const WIND_MAX = 0.06;

// ── types (inline) ──────────────────────────────────────────
interface Particle { x: number; y: number; vx: number; vy: number; r: number; life: number; maxLife: number; color: string; }
interface FloatingText { x: number; y: number; text: string; life: number; color: string; }
interface Shell { x: number; y: number; vx: number; vy: number; trail: { x: number; y: number }[]; }

// ── helpers ─────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function randRange(a: number, b: number) { return a + Math.random() * (b - a); }

function generateTerrain(w: number, h: number): number[] {
  const cols = Math.ceil(w / TERRAIN_RESOLUTION);
  const terrain: number[] = new Array(cols);
  // layered sine waves for natural rolling hills
  const baseY = h * 0.62;
  const amp1 = randRange(30, 55), freq1 = randRange(0.006, 0.012), phase1 = randRange(0, Math.PI * 2);
  const amp2 = randRange(12, 25), freq2 = randRange(0.02, 0.035), phase2 = randRange(0, Math.PI * 2);
  const amp3 = randRange(4, 10), freq3 = randRange(0.06, 0.1), phase3 = randRange(0, Math.PI * 2);
  for (let i = 0; i < cols; i++) {
    const x = i * TERRAIN_RESOLUTION;
    terrain[i] = baseY
      + Math.sin(x * freq1 + phase1) * amp1
      + Math.sin(x * freq2 + phase2) * amp2
      + Math.sin(x * freq3 + phase3) * amp3;
  }
  return terrain;
}

function terrainY(terrain: number[], x: number): number {
  const i = clamp(Math.floor(x / TERRAIN_RESOLUTION), 0, terrain.length - 2);
  const t = (x - i * TERRAIN_RESOLUTION) / TERRAIN_RESOLUTION;
  return lerp(terrain[i], terrain[i + 1], t);
}

function hpColor(ratio: number): string {
  if (ratio > 0.55) return `rgb(${Math.round(lerp(220, 50, (ratio - 0.55) / 0.45))},${Math.round(lerp(200, 210, (ratio - 0.55) / 0.45))},50)`;
  if (ratio > 0.25) return `rgb(220,${Math.round(lerp(80, 200, (ratio - 0.25) / 0.3))},50)`;
  return `rgb(220,${Math.round(lerp(30, 80, ratio / 0.25))},40)`;
}

// ── component ───────────────────────────────────────────────
export default function LilianoGame({ gameId, playerId, opponentId, isPlayerTurn, onMove, onGameOver }: {
  gameId: string; playerId: string; opponentId: string; isPlayerTurn: boolean;
  onMove: (data: { angle: number; power: number; hit: boolean; damage: number }) => void;
  onGameOver: (data: { winner_id: string }) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<any>(null);
  const animRef = useRef<number>(0);

  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(50);
  const [hp1, setHp1] = useState(100);
  const [hp2, setHp2] = useState(100);
  const [firing, setFiring] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lastTrail, setLastTrail] = useState<{ x: number; y: number }[]>([]);

  // ── init game state ────────────────────────────────────
  const initState = useCallback(() => {
    const terrain = generateTerrain(W, H);
    const t1x = Math.round(W * 0.15);
    const t2x = Math.round(W * 0.85);
    const wind = randRange(-WIND_MAX, WIND_MAX);
    return {
      terrain,
      wind,
      tanks: [
        { x: t1x, y: terrainY(terrain, t1x), hp: 100, angle: 45, power: 50, facingRight: true },
        { x: t2x, y: terrainY(terrain, t2x), hp: 100, angle: 135, power: 50, facingRight: false },
      ],
      shell: null as Shell | null,
      particles: [] as Particle[],
      floatingTexts: [] as FloatingText[],
      explosionFlash: 0,
      lastTrail: [] as { x: number; y: number }[],
      turnDone: false,
      gameOver: false,
    };
  }, []);

  // ── drawing ────────────────────────────────────────────
  const draw = useCallback((ctx: CanvasRenderingContext2D, s: any) => {
    // sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
    skyGrad.addColorStop(0, '#1a1a3e');
    skyGrad.addColorStop(0.35, '#2d1b69');
    skyGrad.addColorStop(0.6, '#b44a2f');
    skyGrad.addColorStop(0.85, '#e8943a');
    skyGrad.addColorStop(1, '#f5d576');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // sun
    const sunGrad = ctx.createRadialGradient(W * 0.7, H * 0.28, 5, W * 0.7, H * 0.28, 60);
    sunGrad.addColorStop(0, 'rgba(255,240,180,0.9)');
    sunGrad.addColorStop(0.4, 'rgba(255,180,80,0.3)');
    sunGrad.addColorStop(1, 'rgba(255,100,50,0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, W, H);

    // clouds
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    for (const cx of [60, 180, 310]) {
      ctx.beginPath();
      ctx.ellipse(cx, 55, 40, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 20, 48, 28, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // terrain
    const t = s.terrain as number[];
    const tGrad = ctx.createLinearGradient(0, H * 0.5, 0, H);
    tGrad.addColorStop(0, '#4a8c3f');
    tGrad.addColorStop(0.3, '#3a7530');
    tGrad.addColorStop(0.7, '#2d5a24');
    tGrad.addColorStop(1, '#1e3d18');
    ctx.fillStyle = tGrad;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let i = 0; i < t.length; i++) {
      ctx.lineTo(i * TERRAIN_RESOLUTION, t[i]);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // grass line
    ctx.strokeStyle = '#6abf5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < t.length; i++) {
      const px = i * TERRAIN_RESOLUTION;
      if (i === 0) ctx.moveTo(px, t[i]); else ctx.lineTo(px, t[i]);
    }
    ctx.stroke();

    // grass tufts
    ctx.strokeStyle = '#5eaa4a';
    ctx.lineWidth = 1;
    for (let i = 0; i < t.length; i += 4) {
      const gx = i * TERRAIN_RESOLUTION;
      const gy = t[i];
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 2, gy - 4); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + 2, gy - 5); ctx.stroke();
    }

    // wind indicator
    const windPx = s.wind * 600;
    ctx.save();
    ctx.translate(W / 2, 22);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WIND', 0, -6);
    // arrow bar
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(-30, -2, 60, 5);
    const wColor = Math.abs(windPx) > 20 ? '#ff6b6b' : '#8cf';
    ctx.fillStyle = wColor;
    if (windPx >= 0) ctx.fillRect(0, -2, Math.min(windPx, 30), 5);
    else ctx.fillRect(Math.max(windPx, -30), -2, -Math.max(windPx, -30), 5);
    // arrow head
    const arrowDir = windPx >= 0 ? 1 : -1;
    const arrowX = clamp(windPx, -30, 30);
    ctx.beginPath();
    ctx.moveTo(arrowX + arrowDir * 6, 0.5);
    ctx.lineTo(arrowX, -4);
    ctx.lineTo(arrowX, 5);
    ctx.closePath();
    ctx.fillStyle = wColor;
    ctx.fill();
    ctx.restore();

    // last trail (previous shot)
    if (s.lastTrail.length > 1) {
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < s.lastTrail.length; i++) {
        const p = s.lastTrail[i];
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // draw tanks
    for (let ti = 0; ti < 2; ti++) {
      const tank = s.tanks[ti];
      const tx = tank.x;
      const ty = tank.y;

      // treads
      ctx.fillStyle = ti === 0 ? '#2a5c1e' : '#5c1e1e';
      const treadY = ty - 3;
      ctx.beginPath();
      ctx.ellipse(tx, treadY, TANK_W / 2 + 2, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = ti === 0 ? '#1a3a12' : '#3a1212';
      // tread details
      for (let w = -TANK_W / 2; w <= TANK_W / 2; w += 5) {
        ctx.fillRect(tx + w, treadY - 1, 2, 3);
      }

      // body
      const bodyGrad = ctx.createLinearGradient(tx, ty - 18, tx, ty - 3);
      if (ti === 0) { bodyGrad.addColorStop(0, '#5cb85c'); bodyGrad.addColorStop(1, '#357a35'); }
      else { bodyGrad.addColorStop(0, '#d9534f'); bodyGrad.addColorStop(1, '#8b2020'); }
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.roundRect(tx - TANK_W / 2, ty - 18, TANK_W, TANK_H, 3);
      ctx.fill();

      // turret dome
      ctx.fillStyle = ti === 0 ? '#4a9e4a' : '#c0392b';
      ctx.beginPath();
      ctx.arc(tx, ty - 18, 8, Math.PI, 0);
      ctx.fill();

      // barrel
      const bAngle = (tank.facingRight ? (180 - tank.angle) : tank.angle) * Math.PI / 180;
      const bx2 = tx + Math.cos(bAngle) * BARREL_LEN;
      const by2 = (ty - 18) - Math.sin(bAngle) * BARREL_LEN;
      ctx.strokeStyle = ti === 0 ? '#2d6b2d' : '#7a1a1a';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty - 18);
      ctx.lineTo(bx2, by2);
      ctx.stroke();
      // barrel tip
      ctx.strokeStyle = ti === 0 ? '#8fd98f' : '#e88';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx + Math.cos(bAngle) * (BARREL_LEN - 4), (ty - 18) - Math.sin(bAngle) * (BARREL_LEN - 4));
      ctx.lineTo(bx2, by2);
      ctx.stroke();
      ctx.lineCap = 'butt';

      // HP bar
      const hpRatio = tank.hp / 100;
      const barW = 38;
      const barH = 5;
      const barX = tx - barW / 2;
      const barY = ty - 32;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = hpColor(hpRatio);
      ctx.fillRect(barX, barY, barW * hpRatio, barH);
      // HP text
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${tank.hp}`, tx, barY - 2);

      // player label
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.font = '8px sans-serif';
      ctx.fillText(ti === 0 ? 'P1' : 'P2', tx, barY - 11);
    }

    // shell
    if (s.shell) {
      const sh = s.shell as Shell;
      // smoke trail
      if (sh.trail.length > 1) {
        for (let i = 1; i < sh.trail.length; i++) {
          const alpha = (i / sh.trail.length) * 0.5;
          const r = 2 + (i / sh.trail.length) * 2;
          ctx.fillStyle = `rgba(200,200,200,${alpha})`;
          ctx.beginPath();
          ctx.arc(sh.trail[i].x, sh.trail[i].y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // shell glow
      const sg = ctx.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, 8);
      sg.addColorStop(0, 'rgba(255,200,50,0.6)');
      sg.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, 8, 0, Math.PI * 2);
      ctx.fill();
      // shell body
      ctx.fillStyle = '#ff4';
      ctx.beginPath();
      ctx.arc(sh.x, sh.y, SHELL_R, 0, Math.PI * 2);
      ctx.fill();
    }

    // particles
    for (const p of s.particles) {
      const alpha = (p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // explosion flash overlay
    if (s.explosionFlash > 0) {
      ctx.fillStyle = `rgba(255,240,200,${s.explosionFlash * 0.25})`;
      ctx.fillRect(0, 0, W, H);
    }

    // floating damage texts
    for (const ft of s.floatingTexts) {
      const alpha = Math.min(1, ft.life / 20);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 2;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
  }, []);

  // ── fire shell ────────────────────────────────────────
  const fire = useCallback(() => {
    const s = stateRef.current;
    if (!s || s.shell || s.turnDone || s.gameOver) return;
    setFiring(true);
    const myIdx = 0; // player is always tank 0 (left)
    const tank = s.tanks[myIdx];
    const bAngle = (tank.facingRight ? (180 - angle) : angle) * Math.PI / 180;
    const speed = (power / 100) * 12;
    const tipX = tank.x + Math.cos(bAngle) * (BARREL_LEN + 2);
    const tipY = (tank.y - 18) - Math.sin(bAngle) * (BARREL_LEN + 2);
    s.shell = {
      x: tipX, y: tipY,
      vx: Math.cos(bAngle) * speed,
      vy: -Math.sin(bAngle) * speed,
      trail: [],
    };
    s.lastTrail = [];
  }, [angle, power]);

  // ── explosion / damage ────────────────────────────────
  const explode = useCallback((x: number, y: number, s: any) => {
    // crater in terrain
    const t = s.terrain as number[];
    for (let i = 0; i < t.length; i++) {
      const tx = i * TERRAIN_RESOLUTION;
      const dist = Math.sqrt((tx - x) ** 2 + (t[i] - y) ** 2);
      if (dist < EXPLOSION_RADIUS) {
        t[i] += (EXPLOSION_RADIUS - dist) * 0.7;
      }
    }

    // particles
    const colors = ['#ff4', '#ff8800', '#ff2200', '#ffcc00', '#fff', '#aaa'];
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = randRange(1, 5);
      s.particles.push({
        x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - randRange(1, 3),
        r: randRange(2, 6), life: randRange(20, 45), maxLife: 45,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    // debris
    for (let i = 0; i < 12; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = randRange(0.5, 3);
      s.particles.push({
        x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - randRange(0.5, 2),
        r: randRange(1, 3), life: randRange(30, 60), maxLife: 60,
        color: '#5a3',
      });
    }
    s.explosionFlash = 1;

    // damage check
    let hitOccurred = false;
    let totalDamage = 0;
    for (let ti = 0; ti < 2; ti++) {
      const tank = s.tanks[ti];
      const dist = Math.sqrt((tank.x - x) ** 2 + ((tank.y - 10) - y) ** 2);
      let dmg = 0;
      if (dist < DIRECT_HIT_R) {
        dmg = Math.round(randRange(30, 50));
        hitOccurred = true;
      } else if (dist < NEAR_MISS_R) {
        dmg = Math.round(randRange(10, 20) * (1 - (dist - DIRECT_HIT_R) / (NEAR_MISS_R - DIRECT_HIT_R)));
        if (dmg > 0) hitOccurred = true;
      }
      if (dmg > 0) {
        tank.hp = Math.max(0, tank.hp - dmg);
        totalDamage += dmg;
        s.floatingTexts.push({
          x: tank.x, y: tank.y - 40, text: `-${dmg}`, life: 50,
          color: ti === 0 ? '#ff6b6b' : '#ffcc00',
        });
      }
    }

    // settle tanks on new terrain
    for (const tank of s.tanks) {
      tank.y = terrainY(t, tank.x);
    }

    return { hit: hitOccurred, damage: totalDamage };
  }, []);

  // ── game loop ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = W;
    canvas.height = H;

    if (!stateRef.current) {
      stateRef.current = initState();
    }
    const s = stateRef.current;

    let running = true;
    const loop = () => {
      if (!running) return;

      // update shell
      if (s.shell) {
        const sh = s.shell as Shell;
        sh.trail.push({ x: sh.x, y: sh.y });
        if (sh.trail.length > 80) sh.trail.shift();
        sh.vx += s.wind;
        sh.vy += GRAVITY;
        sh.x += sh.vx;
        sh.y += sh.vy;

        // terrain / bounds check
        const ty = terrainY(s.terrain, sh.x);
        if (sh.y >= ty || sh.x < -20 || sh.x > W + 20 || sh.y > H + 30) {
          const trailCopy = [...sh.trail];
          s.lastTrail = trailCopy;
          setLastTrail(trailCopy);

          let result = { hit: false, damage: 0 };
          if (sh.x >= 0 && sh.x <= W && sh.y <= H + 10) {
            result = explode(sh.x, Math.min(sh.y, ty), s);
          }
          s.shell = null;
          s.turnDone = true;

          setHp1(s.tanks[0].hp);
          setHp2(s.tanks[1].hp);

          // check game over
          setTimeout(() => {
            if (s.tanks[1].hp <= 0) {
              s.gameOver = true;
              setGameOver(true);
              onGameOver?.({ winner_id: playerId });
            } else if (s.tanks[0].hp <= 0) {
              s.gameOver = true;
              setGameOver(true);
              onGameOver?.({ winner_id: opponentId });
            } else {
              onMove?.({ angle, power, hit: result.hit, damage: result.damage });
            }
            setFiring(false);
          }, 600);
        }
      }

      // update particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.life--;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // update floating texts
      for (let i = s.floatingTexts.length - 1; i >= 0; i--) {
        const ft = s.floatingTexts[i];
        ft.y -= 0.6;
        ft.life--;
        if (ft.life <= 0) s.floatingTexts.splice(i, 1);
      }

      // decay flash
      if (s.explosionFlash > 0) s.explosionFlash = Math.max(0, s.explosionFlash - 0.05);

      draw(ctx, s);
      animRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [gameId, initState, draw, explode, playerId, opponentId, onMove, onGameOver, angle, power]);

  // keep tank angle in sync for barrel preview
  useEffect(() => {
    if (stateRef.current) stateRef.current.tanks[0].angle = angle;
  }, [angle]);

  // ── styles (inline) ───────────────────────────────────
  const containerStyle: React.CSSProperties = {
    width: '100%', maxWidth: 420, margin: '0 auto', fontFamily: "'Segoe UI',sans-serif",
    background: '#111', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'manipulation',
  };
  const canvasStyle: React.CSSProperties = {
    width: '100%', display: 'block', borderBottom: '2px solid #222',
  };
  const controlsStyle: React.CSSProperties = {
    padding: '10px 14px 12px', background: 'linear-gradient(180deg,#1a1a1a,#111)',
  };
  const sliderRow: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
  };
  const labelStyle: React.CSSProperties = {
    color: '#aaa', fontSize: 11, fontWeight: 600, minWidth: 48, textTransform: 'uppercase', letterSpacing: 0.5,
  };
  const valueStyle: React.CSSProperties = {
    color: '#fff', fontSize: 13, fontWeight: 700, minWidth: 32, textAlign: 'right',
  };
  const sliderTrack: React.CSSProperties = {
    flex: 1, height: 28, position: 'relative', borderRadius: 6, background: '#222', overflow: 'hidden',
    border: '1px solid #333',
  };
  const fireBtnStyle: React.CSSProperties = {
    width: '100%', padding: '12px 0', marginTop: 4,
    background: firing || !isPlayerTurn ? '#333' : 'linear-gradient(180deg,#e8443a,#c0392b)',
    color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 800,
    cursor: firing || !isPlayerTurn ? 'not-allowed' : 'pointer',
    letterSpacing: 1.5, textTransform: 'uppercase',
    boxShadow: firing || !isPlayerTurn ? 'none' : '0 2px 12px rgba(200,50,30,0.4)',
    transition: 'all 0.15s',
  };
  const overlayStyle: React.CSSProperties = {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.55)', zIndex: 10,
    pointerEvents: gameOver ? 'auto' : 'none',
  };
  const overlayTextStyle: React.CSSProperties = {
    color: '#fff', fontSize: 18, fontWeight: 700, textAlign: 'center',
    textShadow: '0 2px 8px rgba(0,0,0,0.7)', padding: 20,
  };

  // Slider with fill bar (touch-friendly)
  const Slider = ({ value, min, max, color, onChange }: {
    value: number; min: number; max: number; color: string;
    onChange: (v: number) => void;
  }) => {
    const trackRef = useRef<HTMLDivElement>(null);
    const getVal = (clientX: number) => {
      const rect = trackRef.current!.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      return Math.round(min + ratio * (max - min));
    };
    const onPointerDown = (e: React.PointerEvent) => {
      if (!isPlayerTurn || firing) return;
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onChange(getVal(e.clientX));
    };
    const onPointerMove = (e: React.PointerEvent) => {
      if (!isPlayerTurn || firing) return;
      if (e.buttons > 0 || e.pressure > 0) onChange(getVal(e.clientX));
    };
    const fillPct = ((value - min) / (max - min)) * 100;
    return (
      <div ref={trackRef} style={sliderTrack}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${fillPct}%`, background: color, transition: 'width 0.05s',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: `${fillPct}%`,
          transform: 'translate(-50%,-50%)', width: 16, height: 16,
          borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
          border: '2px solid #ddd', transition: 'left 0.05s',
        }} />
      </div>
    );
  };

  const showOverlay = !isPlayerTurn && !firing && !gameOver;

  return (
    <div style={containerStyle}>
      <div style={{ position: 'relative' }}>
        <canvas ref={canvasRef} style={canvasStyle} />
        {/* Turn overlay */}
        {showOverlay && (
          <div style={overlayStyle}>
            <div style={overlayTextStyle}>⏳ Waiting for opponent…</div>
          </div>
        )}
        {gameOver && (
          <div style={{ ...overlayStyle, pointerEvents: 'auto' }}>
            <div style={overlayTextStyle}>
              {hp1 > 0 ? '🏆 You win!' : '💥 You lost!'}
            </div>
          </div>
        )}
        {isPlayerTurn && !firing && !gameOver && (
          <div style={{
            position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.55)', color: '#4f8', padding: '3px 14px',
            borderRadius: 10, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
          }}>
            YOUR TURN
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={controlsStyle}>
        <div style={sliderRow}>
          <span style={labelStyle}>Angle</span>
          <Slider value={angle} min={0} max={180}
            color="linear-gradient(90deg,#3498db,#2ecc71)" onChange={setAngle} />
          <span style={valueStyle}>{angle}°</span>
        </div>
        <div style={sliderRow}>
          <span style={labelStyle}>Power</span>
          <Slider value={power} min={10} max={100}
            color="linear-gradient(90deg,#f39c12,#e74c3c)" onChange={setPower} />
          <span style={valueStyle}>{power}%</span>
        </div>
        <button style={fireBtnStyle}
          disabled={firing || !isPlayerTurn || gameOver}
          onClick={fire}>
          🔥 FIRE!
        </button>
      </div>
    </div>
  );
}
