import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ───────────────────────────── types ───────────────────────────── */
interface Cup { x: number; y: number; alive: boolean; hitAnim: number }
interface Ball { x: number; y: number; vx: number; vy: number; active: boolean; trail: { x: number; y: number; a: number }[] }
interface DragState { startX: number; startY: number; curX: number; curY: number; dragging: boolean }

/* ───────────────────────────── constants ────────────────────────── */
const ACCENT = '#10b981';
const CUP_R = 18;
const BALL_R = 8;
const GRAVITY = 0.25;
const ROWS = 4;                   // 4‑3‑2‑1 = 10 cups
const TRAIL_LEN = 18;
const HIT_ANIM_DUR = 20;         // frames
const POWER_SCALE = 0.12;
const MAX_POWER = 14;

/* triangle positions (normalised 0‑1, origin top‑left of formation) */
function triangleCups(cx: number, topY: number, gap: number, flip: boolean): Cup[] {
  const cups: Cup[] = [];
  for (let row = 0; row < ROWS; row++) {
    const n = flip ? ROWS - row : row + 1;
    const y = flip ? topY - row * gap : topY + row * gap;
    for (let i = 0; i < n; i++) {
      const x = cx + (i - (n - 1) / 2) * (CUP_R * 2.5);
      cups.push({ x, y, alive: true, hitAnim: 0 });
    }
  }
  return cups;
}

/* ─────────────────────────── component ─────────────────────────── */
export default function SandyGame({ gameId, playerId, opponentId, isPlayerTurn, onMove, onGameOver }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const raf = useRef(0);
  const dragRef = useRef<DragState>({ startX: 0, startY: 0, curX: 0, curY: 0, dragging: false });
  const ballRef = useRef<Ball>({ x: 0, y: 0, vx: 0, vy: 0, active: false, trail: [] });
  const opponentCupsRef = useRef<Cup[]>([]);
  const playerCupsRef = useRef<Cup[]>([]);
  const sizeRef = useRef({ w: 400, h: 650 });
  const hitCupsRef = useRef<number[]>([]);
  const phaseRef = useRef<'aim' | 'fly' | 'done'>('aim');
  const splashRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const turnFired = useRef(false);

  const [opponentLeft, setOpponentLeft] = useState(10);
  const [playerLeft, setPlayerLeft] = useState(10);

  /* -------- init cups -------- */
  const resetCups = useCallback(() => {
    const { w, h } = sizeRef.current;
    opponentCupsRef.current = triangleCups(w / 2, h * 0.13, CUP_R * 2.6, false);
    playerCupsRef.current = triangleCups(w / 2, h * 0.87, CUP_R * 2.6, true);
    setOpponentLeft(10);
    setPlayerLeft(10);
  }, []);

  /* -------- resize canvas -------- */
  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const rect = wrap.getBoundingClientRect();
    const w = Math.max(400, Math.floor(rect.width));
    const h = Math.max(600, Math.floor(w * 1.6));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const prev = sizeRef.current;
    sizeRef.current = { w, h };
    if (prev.w !== w || prev.h !== h) resetCups();
  }, [resetCups]);

  /* -------- drawing helpers -------- */
  const drawBackground = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#0f172a');
    bg.addColorStop(0.5, '#1e293b');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // table surface
    const tg = ctx.createLinearGradient(0, h * 0.08, 0, h * 0.92);
    tg.addColorStop(0, '#1a3a2a');
    tg.addColorStop(0.5, '#14532d');
    tg.addColorStop(1, '#1a3a2a');
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, w * 0.04, h * 0.04, w * 0.92, h * 0.92, 24);
    ctx.fillStyle = tg;
    ctx.fill();
    // felt texture lines
    ctx.strokeStyle = 'rgba(16,185,129,0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i < w; i += 12) {
      ctx.beginPath(); ctx.moveTo(i, h * 0.04); ctx.lineTo(i, h * 0.96); ctx.stroke();
    }
    // center line
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = 'rgba(16,185,129,0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(w * 0.1, h / 2); ctx.lineTo(w * 0.9, h / 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // border glow
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, w * 0.04, h * 0.04, w * 0.92, h * 0.92, 24);
    ctx.strokeStyle = ACCENT + '33';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  };

  const drawCup = (ctx: CanvasRenderingContext2D, cup: Cup, isOpponent: boolean) => {
    if (!cup.alive && cup.hitAnim <= 0) return;
    const { x, y, hitAnim } = cup;
    const scale = cup.alive ? 1 : Math.max(0, hitAnim / HIT_ANIM_DUR);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = cup.alive ? 1 : scale;

    // glow
    const glow = ctx.createRadialGradient(0, 0, CUP_R * 0.4, 0, 0, CUP_R * 2.2);
    glow.addColorStop(0, isOpponent ? 'rgba(239,68,68,0.25)' : 'rgba(59,130,246,0.25)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(-CUP_R * 2.5, -CUP_R * 2.5, CUP_R * 5, CUP_R * 5);

    // cup body
    ctx.beginPath();
    ctx.arc(0, 0, CUP_R, 0, Math.PI * 2);
    const cg = ctx.createRadialGradient(-CUP_R * 0.3, -CUP_R * 0.3, 1, 0, 0, CUP_R);
    if (isOpponent) {
      cg.addColorStop(0, '#fca5a5');
      cg.addColorStop(0.4, '#ef4444');
      cg.addColorStop(1, '#991b1b');
    } else {
      cg.addColorStop(0, '#93c5fd');
      cg.addColorStop(0.4, '#3b82f6');
      cg.addColorStop(1, '#1e3a8a');
    }
    ctx.fillStyle = cg;
    ctx.fill();

    // liquid
    ctx.beginPath();
    ctx.arc(0, 2, CUP_R * 0.65, 0, Math.PI * 2);
    ctx.fillStyle = isOpponent ? 'rgba(153,27,27,0.5)' : 'rgba(30,58,138,0.5)';
    ctx.fill();

    // rim highlight
    ctx.beginPath();
    ctx.arc(0, 0, CUP_R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // specular
    ctx.beginPath();
    ctx.arc(-CUP_R * 0.25, -CUP_R * 0.35, CUP_R * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.fill();

    ctx.restore();
  };

  const drawBall = (ctx: CanvasRenderingContext2D, ball: Ball) => {
    // trail
    ball.trail.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, BALL_R * 0.55 * p.a, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(16,185,129,${p.a * 0.45})`;
      ctx.fill();
    });
    // shadow
    ctx.beginPath();
    ctx.ellipse(ball.x + 3, ball.y + 4, BALL_R, BALL_R * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    // ball
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, BALL_R);
    bg.addColorStop(0, '#ffffff');
    bg.addColorStop(0.6, '#e2e8f0');
    bg.addColorStop(1, '#94a3b8');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.strokeStyle = 'rgba(16,185,129,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // specular
    ctx.beginPath();
    ctx.arc(ball.x - 2, ball.y - 2, BALL_R * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  };

  const drawAimLine = (ctx: CanvasRenderingContext2D, drag: DragState, w: number, h: number) => {
    const dx = drag.startX - drag.curX;
    const dy = drag.startY - drag.curY;
    const power = Math.min(Math.hypot(dx, dy) * POWER_SCALE, MAX_POWER);
    const angle = Math.atan2(dy, dx);
    const steps = 30;
    const dt = 1.2;
    ctx.save();
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = ACCENT + 'aa';
    ctx.lineWidth = 2;
    ctx.beginPath();
    let px = w / 2, py = h * 0.82;
    ctx.moveTo(px, py);
    let vx = Math.cos(angle) * power;
    let vy = Math.sin(angle) * power;
    for (let i = 0; i < steps; i++) {
      px += vx * dt;
      py += vy * dt;
      vy += GRAVITY * dt;
      if (px < CUP_R) { px = CUP_R; vx = -vx * 0.5; }
      if (px > w - CUP_R) { px = w - CUP_R; vx = -vx * 0.5; }
      if (py < 0) break;
      ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    // power indicator dot
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = ACCENT;
    ctx.fill();
    ctx.restore();
    // power bar
    const barW = 120, barH = 8;
    const bx = w / 2 - barW / 2, by = h * 0.88;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    roundRect(ctx, bx, by, barW, barH, 4);
    ctx.fill();
    const pct = power / MAX_POWER;
    const pg = ctx.createLinearGradient(bx, 0, bx + barW * pct, 0);
    pg.addColorStop(0, '#10b981');
    pg.addColorStop(1, pct > 0.7 ? '#ef4444' : '#34d399');
    ctx.fillStyle = pg;
    roundRect(ctx, bx, by, barW * pct, barH, 4);
    ctx.fill();
    ctx.restore();
  };

  const drawSplash = (ctx: CanvasRenderingContext2D) => {
    splashRef.current.forEach((s) => {
      const progress = s.t / 15;
      const alpha = 1 - progress;
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 * i) / 8 + progress * 0.5;
        const r = 10 + progress * 30;
        ctx.beginPath();
        ctx.arc(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r, 3 * (1 - progress), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(239,68,68,${alpha * 0.7})`;
        ctx.fill();
      }
    });
  };

  const drawOverlay = (ctx: CanvasRenderingContext2D, w: number, h: number, myTurn: boolean) => {
    // score panels — glassmorphism
    const panelW = 110, panelH = 40, gap = 10;
    // opponent label (top-left)
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,42,0.55)';
    ctx.strokeStyle = 'rgba(239,68,68,0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, gap, gap, panelW, panelH, 10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fca5a5';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('OPPONENT', gap + 10, gap + 16);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`${opponentCupsRef.current.filter(c => c.alive).length} cups`, gap + 10, gap + 34);
    ctx.restore();

    // player label (bottom-left)
    ctx.save();
    ctx.fillStyle = 'rgba(15,23,42,0.55)';
    ctx.strokeStyle = 'rgba(59,130,246,0.3)';
    ctx.lineWidth = 1;
    roundRect(ctx, gap, h - gap - panelH, panelW, panelH, 10);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('YOU', gap + 10, h - gap - panelH + 16);
    ctx.fillStyle = '#3b82f6';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.fillText(`${playerCupsRef.current.filter(c => c.alive).length} cups`, gap + 10, h - gap - panelH + 34);
    ctx.restore();

    // turn indicator
    if (phaseRef.current === 'aim') {
      const label = myTurn ? '🎯 YOUR TURN' : '⏳ WAITING…';
      const tw = ctx.measureText(label).width;
      ctx.save();
      ctx.fillStyle = 'rgba(15,23,42,0.6)';
      const pw = 180, ph = 34;
      roundRect(ctx, w / 2 - pw / 2, h / 2 - ph / 2, pw, ph, 12);
      ctx.fill();
      ctx.strokeStyle = myTurn ? ACCENT + '66' : 'rgba(148,163,184,0.3)';
      ctx.lineWidth = 1;
      roundRect(ctx, w / 2 - pw / 2, h / 2 - ph / 2, pw, ph, 12);
      ctx.stroke();
      ctx.fillStyle = myTurn ? ACCENT : '#94a3b8';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, w / 2, h / 2);
      ctx.restore();
    }
  };

  /* -------- game loop -------- */
  const tick = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { w, h } = sizeRef.current;
    const ball = ballRef.current;
    const drag = dragRef.current;

    /* --- update --- */
    // ball physics
    if (ball.active) {
      ball.x += ball.vx;
      ball.y += ball.vy;
      ball.vy += GRAVITY;
      // wall bounce
      if (ball.x < BALL_R) { ball.x = BALL_R; ball.vx = -ball.vx * 0.6; }
      if (ball.x > w - BALL_R) { ball.x = w - BALL_R; ball.vx = -ball.vx * 0.6; }
      // trail
      ball.trail.push({ x: ball.x, y: ball.y, a: 1 });
      if (ball.trail.length > TRAIL_LEN) ball.trail.shift();
      ball.trail.forEach(p => { p.a *= 0.9; });

      // cup collision (opponent cups)
      opponentCupsRef.current.forEach((cup, idx) => {
        if (!cup.alive) return;
        const dx = ball.x - cup.x;
        const dy = ball.y - cup.y;
        if (Math.hypot(dx, dy) < CUP_R + BALL_R * 0.5) {
          cup.alive = false;
          cup.hitAnim = HIT_ANIM_DUR;
          hitCupsRef.current.push(idx);
          splashRef.current.push({ x: cup.x, y: cup.y, t: 0 });
          ball.active = false;
        }
      });

      // out of bounds
      if (ball.y < -30 || ball.y > h + 30) {
        ball.active = false;
      }

      if (!ball.active && phaseRef.current === 'fly') {
        phaseRef.current = 'done';
        // notify parent after short delay so animations play out
        setTimeout(() => {
          const remaining = opponentCupsRef.current.filter(c => c.alive).length;
          setOpponentLeft(remaining);
          onMove?.({
            cupsHit: [...hitCupsRef.current],
            ballTrajectory: { vx: ball.vx, vy: ball.vy },
          });
          if (remaining === 0) {
            onGameOver?.({ winner_id: playerId });
          }
          // reset for next turn
          hitCupsRef.current = [];
          phaseRef.current = 'aim';
          turnFired.current = false;
        }, 400);
      }
    }

    // cup hit animations
    [...opponentCupsRef.current, ...playerCupsRef.current].forEach(c => {
      if (c.hitAnim > 0) c.hitAnim -= 1;
    });
    // splash animations
    splashRef.current = splashRef.current.filter(s => { s.t += 1; return s.t < 15; });

    /* --- draw --- */
    drawBackground(ctx, w, h);
    opponentCupsRef.current.forEach(c => drawCup(ctx, c, true));
    playerCupsRef.current.forEach(c => drawCup(ctx, c, false));
    if (ball.active) drawBall(ctx, ball);
    drawSplash(ctx);
    if (drag.dragging && isPlayerTurn && phaseRef.current === 'aim') {
      drawAimLine(ctx, drag, w, h);
      // draw ball at launch pos
      const launchBall: Ball = { x: w / 2, y: h * 0.82, vx: 0, vy: 0, active: false, trail: [] };
      drawBall(ctx, launchBall);
    } else if (phaseRef.current === 'aim' && !ball.active) {
      // idle ball
      const launchBall: Ball = { x: w / 2, y: h * 0.82, vx: 0, vy: 0, active: false, trail: [] };
      drawBall(ctx, launchBall);
    }
    drawOverlay(ctx, w, h, isPlayerTurn);

    raf.current = requestAnimationFrame(tick);
  }, [isPlayerTurn, playerId, onMove, onGameOver]);

  /* -------- input handlers -------- */
  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const t = 'touches' in e ? (e as React.TouchEvent).touches[0] : (e as React.MouseEvent);
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };

  const handleDown = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isPlayerTurn || phaseRef.current !== 'aim' || turnFired.current) return;
    e.preventDefault();
    const p = getPos(e);
    dragRef.current = { startX: p.x, startY: p.y, curX: p.x, curY: p.y, dragging: true };
  }, [isPlayerTurn]);

  const handleMoveEvt = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!dragRef.current.dragging) return;
    e.preventDefault();
    const p = getPos(e);
    dragRef.current.curX = p.x;
    dragRef.current.curY = p.y;
  }, []);

  const handleUp = useCallback(() => {
    const drag = dragRef.current;
    if (!drag.dragging || !isPlayerTurn || phaseRef.current !== 'aim') return;
    drag.dragging = false;
    const dx = drag.startX - drag.curX;
    const dy = drag.startY - drag.curY;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) return; // too small
    const power = Math.min(dist * POWER_SCALE, MAX_POWER);
    const angle = Math.atan2(dy, dx);
    const { w, h } = sizeRef.current;
    const ball = ballRef.current;
    ball.x = w / 2;
    ball.y = h * 0.82;
    ball.vx = Math.cos(angle) * power;
    ball.vy = Math.sin(angle) * power;
    ball.active = true;
    ball.trail = [];
    phaseRef.current = 'fly';
    turnFired.current = true;
  }, [isPlayerTurn]);

  /* -------- lifecycle -------- */
  useEffect(() => {
    resize();
    raf.current = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
    };
  }, [resize, tick]);

  /* -------- render -------- */
  return (
    <div
      ref={wrapRef}
      style={{
        width: '100%',
        maxWidth: 500,
        margin: '0 auto',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#0f172a',
        boxShadow: `0 0 40px ${ACCENT}22, 0 8px 32px rgba(0,0,0,0.5)`,
        touchAction: 'none',
        userSelect: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', cursor: isPlayerTurn ? 'crosshair' : 'default' }}
        onMouseDown={handleDown}
        onMouseMove={handleMoveEvt}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={handleDown}
        onTouchMove={handleMoveEvt}
        onTouchEnd={handleUp}
      />
    </div>
  );
}

/* -------- helper: rounded rect -------- */
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
