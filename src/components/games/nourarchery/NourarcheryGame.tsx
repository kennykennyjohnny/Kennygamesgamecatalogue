import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ─── constants ──────────────────────────────────────────────── */
const TOTAL_ROUNDS = 5;
const W = 400;
const H = 500;
const GRAVITY = 0.18;
const ARCHER_X = 55;
const ARCHER_Y = 340;
const BOW_X = 70;
const BOW_Y = 320;
const TARGET_X = 340;
const TARGET_Y = 260;
const TARGET_RADIUS = 60;
const GROUND_Y = 400;

interface Vec2 { x: number; y: number }
interface Wind { speed: number; angle: number }
interface StuckArrow { x: number; y: number; angle: number; ringScore: number }

function randomWind(): Wind {
  const speed = Math.random() * 3.5 + 0.5;
  const angle = Math.random() < 0.5 ? 0 : Math.PI;
  return { speed, angle };
}

function ringScore(dx: number, dy: number): number {
  const dist = Math.sqrt(dx * dx + dy * dy);
  const r = TARGET_RADIUS;
  if (dist <= r * 0.18) return 10;
  if (dist <= r * 0.36) return 8;
  if (dist <= r * 0.54) return 6;
  if (dist <= r * 0.72) return 4;
  if (dist <= r) return 2;
  return 0;
}

function ringColor(score: number): string {
  switch (score) {
    case 10: return '#FFD700';
    case 8: return '#e53935';
    case 6: return '#1E88E5';
    case 4: return '#222';
    case 2: return '#eee';
    default: return '#888';
  }
}

/* ─── component ──────────────────────────────────────────────── */
export default function NourarcheryGame({ gameId, playerId, opponentId, isPlayerTurn, onMove, onGameOver }: any) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef(0);

  // game state refs (mutated in rAF loop)
  const phase = useRef<'idle' | 'aiming' | 'flying' | 'scored' | 'done'>('idle');
  const round = useRef(1);
  const playerScore = useRef(0);
  const opponentScore = useRef(0);
  const roundScores = useRef<number[]>([]);
  const wind = useRef<Wind>(randomWind());
  const stuckArrows = useRef<StuckArrow[]>([]);

  // aiming
  const dragStart = useRef<Vec2 | null>(null);
  const dragCurrent = useRef<Vec2 | null>(null);
  const aiming = useRef(false);

  // arrow in flight
  const arrowPos = useRef<Vec2>({ x: 0, y: 0 });
  const arrowVel = useRef<Vec2>({ x: 0, y: 0 });
  const arrowAngle = useRef(0);
  const arrowTrail = useRef<Vec2[]>([]);

  // UI overlay text
  const flashText = useRef('');
  const flashTimer = useRef(0);

  // wind animation
  const windAnimT = useRef(0);

  // force re-render for overlay
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate(v => v + 1), []);

  /* initialise phase on turn change */
  useEffect(() => {
    if (isPlayerTurn && phase.current === 'idle') {
      phase.current = 'aiming';
      wind.current = randomWind();
      rerender();
    }
  }, [isPlayerTurn, rerender]);

  /* kick off first round */
  useEffect(() => {
    phase.current = isPlayerTurn ? 'aiming' : 'idle';
    wind.current = randomWind();
    rerender();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── drawing ──────────────────────────────────────────────── */
  const draw = useCallback((ctx: CanvasRenderingContext2D, t: number) => {
    const w = W, h = H;
    ctx.clearRect(0, 0, w, h);

    /* sky gradient */
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, '#87CEEB');
    sky.addColorStop(0.55, '#5BAADB');
    sky.addColorStop(1, '#3A8FCC');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, GROUND_Y);

    /* clouds */
    const drawCloud = (cx: number, cy: number, s: number) => {
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, 30 * s, 14 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx - 18 * s, cy + 4 * s, 20 * s, 10 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + 20 * s, cy + 3 * s, 22 * s, 12 * s, 0, 0, Math.PI * 2);
      ctx.fill();
    };
    drawCloud(100 + Math.sin(t * 0.0003) * 8, 55, 0.9);
    drawCloud(260 + Math.sin(t * 0.0004 + 1) * 6, 40, 0.7);
    drawCloud(330 + Math.sin(t * 0.00035 + 2) * 10, 75, 0.6);

    /* distant hills */
    ctx.fillStyle = '#6ab04c';
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    for (let x = 0; x <= w; x += 10) {
      ctx.lineTo(x, GROUND_Y - 15 - Math.sin(x * 0.015) * 12 - Math.sin(x * 0.03) * 6);
    }
    ctx.lineTo(w, GROUND_Y);
    ctx.closePath();
    ctx.fill();

    /* grass */
    const grass = ctx.createLinearGradient(0, GROUND_Y, 0, h);
    grass.addColorStop(0, '#4CAF50');
    grass.addColorStop(0.4, '#388E3C');
    grass.addColorStop(1, '#2E7D32');
    ctx.fillStyle = grass;
    ctx.fillRect(0, GROUND_Y, w, h - GROUND_Y);

    /* grass blades */
    ctx.strokeStyle = '#66BB6A';
    ctx.lineWidth = 1.2;
    for (let x = 5; x < w; x += 8) {
      const bh = 6 + Math.sin(x * 0.7 + t * 0.002) * 3;
      ctx.beginPath();
      ctx.moveTo(x, GROUND_Y);
      ctx.quadraticCurveTo(x + Math.sin(t * 0.003 + x) * 2, GROUND_Y - bh * 0.6, x + Math.sin(t * 0.002 + x) * 3, GROUND_Y - bh);
      ctx.stroke();
    }

    /* ─── target stand ─── */
    ctx.fillStyle = '#5D4037';
    ctx.fillRect(TARGET_X - 4, TARGET_Y + TARGET_RADIUS + 5, 8, GROUND_Y - TARGET_Y - TARGET_RADIUS - 5);
    ctx.fillRect(TARGET_X - 22, TARGET_Y + TARGET_RADIUS + 30, 44, 6);
    // angled support
    ctx.save();
    ctx.translate(TARGET_X, GROUND_Y - 5);
    ctx.rotate(-0.35);
    ctx.fillRect(-3, -70, 6, 70);
    ctx.restore();

    /* ─── target face ─── */
    const rings = [
      { frac: 1.0, color: '#f5f5f5' },
      { frac: 0.82, color: '#222' },
      { frac: 0.64, color: '#1E88E5' },
      { frac: 0.46, color: '#e53935' },
      { frac: 0.25, color: '#FFD700' },
    ];
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(TARGET_X + 4, TARGET_Y + 4, TARGET_RADIUS + 3, TARGET_RADIUS + 3, 0, 0, Math.PI * 2);
    ctx.fill();

    for (const ring of rings) {
      const r = TARGET_RADIUS * ring.frac;
      ctx.beginPath();
      ctx.arc(TARGET_X, TARGET_Y, r, 0, Math.PI * 2);
      ctx.fillStyle = ring.color;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // crosshair
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(TARGET_X - TARGET_RADIUS, TARGET_Y); ctx.lineTo(TARGET_X + TARGET_RADIUS, TARGET_Y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(TARGET_X, TARGET_Y - TARGET_RADIUS); ctx.lineTo(TARGET_X, TARGET_Y + TARGET_RADIUS); ctx.stroke();

    /* ─── stuck arrows ─── */
    for (const sa of stuckArrows.current) {
      drawArrowSprite(ctx, sa.x, sa.y, sa.angle, 0.9);
    }

    /* ─── archer ─── */
    drawArcher(ctx, t);

    /* ─── aiming: trajectory preview ─── */
    if (aiming.current && dragStart.current && dragCurrent.current && phase.current === 'aiming') {
      const { power, vx, vy } = getLaunchParams();
      if (power > 2) {
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(BOW_X, BOW_Y);
        const windAccel = wind.current.speed * 0.012 * (wind.current.angle === 0 ? 1 : -1);
        for (let i = 1; i < 80; i++) {
          const tPx = BOW_X + vx * i + 0.5 * windAccel * 0.02 * i * i;
          const tPy = BOW_Y + vy * i + 0.5 * GRAVITY * i * i;
          if (tPy > GROUND_Y + 10 || tPx > W + 10) break;
          ctx.lineTo(tPx, tPy);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // power bar
        const maxPower = 140;
        const pct = Math.min(power / maxPower, 1);
        const barX = 15, barY = GROUND_Y + 25, barW = 100, barH = 10;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(barX, barY, barW, barH);
        const barGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        barGrad.addColorStop(0, '#4CAF50');
        barGrad.addColorStop(0.6, '#FFC107');
        barGrad.addColorStop(1, '#e53935');
        ctx.fillStyle = barGrad;
        ctx.fillRect(barX, barY, barW * pct, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('POWER', barX, barY - 3);
      }
    }

    /* ─── arrow in flight ─── */
    if (phase.current === 'flying') {
      // trail
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      const trail = arrowTrail.current;
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }
      drawArrowSprite(ctx, arrowPos.current.x, arrowPos.current.y, arrowAngle.current, 1);
    }

    /* ─── wind indicator ─── */
    drawWindIndicator(ctx, t);

    /* ─── HUD ─── */
    // Round
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, w / 2 - 48, GROUND_Y + 15, 96, 22, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Round ${Math.min(round.current, TOTAL_ROUNDS)} / ${TOTAL_ROUNDS}`, w / 2, GROUND_Y + 30);

    // Scores
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, 8, GROUND_Y + 45, 180, 42, 6);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#90CAF9';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('You', 16, GROUND_Y + 60);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(String(playerScore.current), 50, GROUND_Y + 61);

    ctx.fillStyle = '#EF9A9A';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Opp', 100, GROUND_Y + 60);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(String(opponentScore.current), 132, GROUND_Y + 61);

    // round scores row
    ctx.font = '9px sans-serif';
    ctx.fillStyle = '#ccc';
    const rs = roundScores.current;
    if (rs.length > 0) {
      ctx.fillText('Shots: ' + rs.map((s, i) => `${s}`).join('  '), 16, GROUND_Y + 80);
    }

    ctx.textAlign = 'start';

    /* ─── flash text (e.g. "8 points!") ─── */
    if (flashTimer.current > 0) {
      const alpha = Math.min(flashTimer.current / 40, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(flashText.current, w / 2, 170);
      ctx.fillText(flashText.current, w / 2, 170);
      ctx.restore();
      ctx.textAlign = 'start';
    }
  }, []);

  /* ─── helper draw functions ─── */

  function drawArcher(ctx: CanvasRenderingContext2D, t: number) {
    const ax = ARCHER_X, ay = ARCHER_Y;
    // body
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(ax - 5, ay - 50, 14, 30); // torso
    // head
    ctx.fillStyle = '#FFCC80';
    ctx.beginPath();
    ctx.arc(ax + 2, ay - 58, 9, 0, Math.PI * 2);
    ctx.fill();
    // hair
    ctx.fillStyle = '#4E342E';
    ctx.beginPath();
    ctx.arc(ax + 2, ay - 62, 8, Math.PI, Math.PI * 2);
    ctx.fill();
    // legs
    ctx.fillStyle = '#1B5E20';
    ctx.fillRect(ax - 4, ay - 20, 6, 22);
    ctx.fillRect(ax + 3, ay - 20, 6, 22);
    // arm holding bow
    ctx.strokeStyle = '#FFCC80';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax + 5, ay - 42);
    ctx.lineTo(BOW_X, BOW_Y);
    ctx.stroke();

    // bow
    ctx.strokeStyle = '#6D4C41';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(BOW_X + 2, BOW_Y, 28, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();
    // bowstring
    ctx.strokeStyle = '#E0E0E0';
    ctx.lineWidth = 1;
    const bowTop = { x: BOW_X + 2 + 28 * Math.cos(-Math.PI * 0.45), y: BOW_Y + 28 * Math.sin(-Math.PI * 0.45) };
    const bowBot = { x: BOW_X + 2 + 28 * Math.cos(Math.PI * 0.45), y: BOW_Y + 28 * Math.sin(Math.PI * 0.45) };
    if (aiming.current && dragStart.current && dragCurrent.current && phase.current === 'aiming') {
      const { power } = getLaunchParams();
      const pull = Math.min(power / 140, 1) * 16;
      const mid = { x: BOW_X - pull, y: BOW_Y };
      ctx.beginPath(); ctx.moveTo(bowTop.x, bowTop.y); ctx.lineTo(mid.x, mid.y); ctx.lineTo(bowBot.x, bowBot.y); ctx.stroke();
      // nocked arrow
      const { vx, vy } = getLaunchParams();
      const ang = Math.atan2(vy, vx);
      drawArrowSprite(ctx, mid.x + 8, mid.y, ang, 0.85);
    } else if (phase.current !== 'flying') {
      ctx.beginPath(); ctx.moveTo(bowTop.x, bowTop.y); ctx.lineTo(BOW_X + 2, BOW_Y); ctx.lineTo(bowBot.x, bowBot.y); ctx.stroke();
      // resting arrow
      drawArrowSprite(ctx, BOW_X + 4, BOW_Y, 0, 0.85);
    } else {
      ctx.beginPath(); ctx.moveTo(bowTop.x, bowTop.y); ctx.lineTo(BOW_X + 2, BOW_Y); ctx.lineTo(bowBot.x, bowBot.y); ctx.stroke();
    }
  }

  function drawArrowSprite(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, scale: number) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    const len = 36;
    // shaft
    ctx.strokeStyle = '#8D6E63';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-len / 2, 0); ctx.lineTo(len / 2, 0); ctx.stroke();
    // arrowhead
    ctx.fillStyle = '#B0BEC5';
    ctx.beginPath();
    ctx.moveTo(len / 2 + 6, 0);
    ctx.lineTo(len / 2 - 2, -3.5);
    ctx.lineTo(len / 2 - 2, 3.5);
    ctx.closePath();
    ctx.fill();
    // fletching
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.lineTo(-len / 2 - 7, -4);
    ctx.lineTo(-len / 2 + 3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#C62828';
    ctx.beginPath();
    ctx.moveTo(-len / 2, 0);
    ctx.lineTo(-len / 2 - 7, 4);
    ctx.lineTo(-len / 2 + 3, 0);
    ctx.closePath();
    ctx.fill();
    // nock
    ctx.fillStyle = '#fff';
    ctx.fillRect(-len / 2 - 2, -1.2, 3, 2.4);
    ctx.restore();
  }

  function drawWindIndicator(ctx: CanvasRenderingContext2D, t: number) {
    const wx = W / 2, wy = 18;
    const spd = wind.current.speed;
    const dir = wind.current.angle === 0 ? 1 : -1;
    const label = `${dir > 0 ? '→' : '←'} ${spd.toFixed(1)} mph`;

    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    roundRect(ctx, wx - 62, 6, 124, 24, 8);
    ctx.fill();

    // animated wind arrows
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;
    const offset = ((t * 0.06 * spd * dir) % 30);
    for (let i = -1; i <= 1; i++) {
      const ax = wx + i * 18 + offset;
      if (ax < wx - 55 || ax > wx + 55) continue;
      ctx.beginPath();
      ctx.moveTo(ax - 5 * dir, wy - 3);
      ctx.lineTo(ax, wy);
      ctx.lineTo(ax - 5 * dir, wy + 3);
      ctx.stroke();
    }

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Wind: ${label}`, wx, wy + 4);
    ctx.textAlign = 'start';
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  /* ─── launch math ─── */
  function getLaunchParams() {
    if (!dragStart.current || !dragCurrent.current) return { power: 0, vx: 0, vy: 0 };
    const dx = dragStart.current.x - dragCurrent.current.x;
    const dy = dragStart.current.y - dragCurrent.current.y;
    const power = Math.sqrt(dx * dx + dy * dy);
    const clampedPower = Math.min(power, 140);
    const angle = Math.atan2(-dy, Math.abs(dx) + 0.01);
    const speed = clampedPower * 0.065;
    return {
      power: clampedPower,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    };
  }

  /* ─── shoot ─── */
  const shoot = useCallback(() => {
    const { power, vx, vy } = getLaunchParams();
    if (power < 8) { aiming.current = false; dragStart.current = null; dragCurrent.current = null; return; }
    phase.current = 'flying';
    aiming.current = false;
    arrowPos.current = { x: BOW_X, y: BOW_Y };
    arrowVel.current = { x: vx, y: vy };
    arrowAngle.current = Math.atan2(vy, vx);
    arrowTrail.current = [];
    dragStart.current = null;
    dragCurrent.current = null;
    rerender();
  }, [rerender]);

  /* ─── game loop ─── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const loop = (t: number) => {
      /* update flying arrow */
      if (phase.current === 'flying') {
        const windAccel = wind.current.speed * 0.012 * (wind.current.angle === 0 ? 1 : -1);
        arrowVel.current.x += windAccel * 0.02;
        arrowVel.current.y += GRAVITY;
        arrowPos.current.x += arrowVel.current.x;
        arrowPos.current.y += arrowVel.current.y;
        arrowAngle.current = Math.atan2(arrowVel.current.y, arrowVel.current.x);
        arrowTrail.current.push({ ...arrowPos.current });
        if (arrowTrail.current.length > 40) arrowTrail.current.shift();

        // check target hit
        const dx = arrowPos.current.x - TARGET_X;
        const dy = arrowPos.current.y - TARGET_Y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= TARGET_RADIUS + 4 && arrowPos.current.x >= TARGET_X - TARGET_RADIUS) {
          const score = ringScore(dx, dy);
          handleHit(score, arrowPos.current.x, arrowPos.current.y);
        }
        // hit ground or off-screen
        else if (arrowPos.current.y > GROUND_Y || arrowPos.current.x > W + 20 || arrowPos.current.x < -20) {
          handleHit(0, arrowPos.current.x, Math.min(arrowPos.current.y, GROUND_Y));
        }
      }

      if (flashTimer.current > 0) flashTimer.current -= 1;

      draw(ctx, t);
      raf.current = requestAnimationFrame(loop);
    };

    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [draw]);

  /* ─── hit handler ─── */
  function handleHit(score: number, hx: number, hy: number) {
    phase.current = 'scored';
    stuckArrows.current.push({ x: hx, y: hy, angle: arrowAngle.current, ringScore: score });
    playerScore.current += score;
    roundScores.current.push(score);
    const currentRound = round.current;

    if (score > 0) {
      flashText.current = `${score} points!`;
      if (score === 10) flashText.current = '🎯 BULLSEYE! 10 pts';
    } else {
      flashText.current = 'Miss!';
    }
    flashTimer.current = 90;

    onMove?.({
      round: currentRound,
      score,
      position: { x: hx - TARGET_X, y: hy - TARGET_Y },
    });

    // advance round after short delay
    setTimeout(() => {
      if (currentRound >= TOTAL_ROUNDS) {
        phase.current = 'done';
        onGameOver?.({
          winner_id: playerScore.current >= opponentScore.current ? playerId : opponentId,
          scores: { player: playerScore.current, opponent: opponentScore.current },
        });
        rerender();
      } else {
        round.current += 1;
        wind.current = randomWind();
        phase.current = isPlayerTurn ? 'aiming' : 'idle';
        rerender();
      }
    }, 1200);

    rerender();
  }

  /* ─── pointer helpers ─── */
  const getCanvasPos = useCallback((clientX: number, clientY: number): Vec2 => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (W / rect.width),
      y: (clientY - rect.top) * (H / rect.height),
    };
  }, []);

  /* ─── pointer events ─── */
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (phase.current !== 'aiming' || !isPlayerTurn) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pos = getCanvasPos(e.clientX, e.clientY);
    dragStart.current = pos;
    dragCurrent.current = pos;
    aiming.current = true;
  }, [isPlayerTurn, getCanvasPos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!aiming.current) return;
    e.preventDefault();
    dragCurrent.current = getCanvasPos(e.clientX, e.clientY);
  }, [getCanvasPos]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!aiming.current) return;
    e.preventDefault();
    shoot();
  }, [shoot]);

  /* ─── overlays ─── */
  const showWaiting = !isPlayerTurn && phase.current !== 'done';
  const showDone = phase.current === 'done';

  return (
    <div style={{ position: 'relative', width: W, maxWidth: '100%', margin: '0 auto', userSelect: 'none', touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: 'auto', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />

      {/* Waiting overlay */}
      {showWaiting && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.45)', borderRadius: 12, flexDirection: 'column', gap: 8,
        }}>
          <div style={{ color: '#fff', fontSize: 22, fontWeight: 700 }}>Waiting for opponent…</div>
          <div style={{ color: '#90CAF9', fontSize: 14 }}>They are taking their shot</div>
        </div>
      )}

      {/* Your turn nudge */}
      {isPlayerTurn && phase.current === 'aiming' && !aiming.current && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 12, transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '6px 18px', borderRadius: 20,
          fontSize: 13, fontWeight: 600, pointerEvents: 'none',
        }}>
          🏹 Your turn — drag to aim &amp; shoot
        </div>
      )}

      {/* Game over overlay */}
      {showDone && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', borderRadius: 12, flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#FFD700' }}>🏆 Game Over</div>
          <div style={{ color: '#fff', fontSize: 16 }}>You: {playerScore.current} pts — Opponent: {opponentScore.current} pts</div>
          <div style={{ color: '#90CAF9', fontSize: 14, marginTop: 4 }}>
            {playerScore.current > opponentScore.current ? 'You win! 🎉' :
             playerScore.current < opponentScore.current ? 'Opponent wins' : "It's a tie!"}
          </div>
        </div>
      )}
    </div>
  );
}
