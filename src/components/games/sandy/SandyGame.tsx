import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* ───────────────────────────── types ───────────────────────────── */
interface CupData { id: number; row: number; col: number; alive: boolean }
interface BallPos { x: number; y: number }
interface TrailDot { x: number; y: number; id: number }

/* ───────────────────────────── constants ────────────────────────── */
const ROWS = 4;
const GRAVITY = 0.35;
const POWER_SCALE = 0.13;
const MAX_POWER = 16;
const BOARD_W = 400;
const BOARD_H = 640;
const CUP_W = 44;
const CUP_H = 56;
const BALL_SIZE = 22;
const PINK = '#ff69b4';
const GLASS_BG = 'rgba(255,255,255,0.18)';
const GLASS_BORDER = 'rgba(255,255,255,0.35)';

/* ───────────────── generate triangle layout ─────────────────── */
function makeCups(): CupData[] {
  const cups: CupData[] = [];
  let id = 0;
  for (let row = 0; row < ROWS; row++) {
    const n = row + 1;
    for (let col = 0; col < n; col++) {
      cups.push({ id: id++, row, col, alive: true });
    }
  }
  return cups;
}

function cupPosition(cup: CupData, boardW: number): { x: number; y: number } {
  const n = cup.row + 1;
  const gapX = CUP_W + 6;
  const rowW = n * gapX;
  const x = (boardW - rowW) / 2 + cup.col * gapX + gapX / 2;
  const y = 40 + cup.row * (CUP_H + 4) + CUP_H / 2;
  return { x, y };
}

/* ───────────────────── sparkle generation ───────────────────── */
function makeSparkles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 6,
    dur: 3 + Math.random() * 4,
    size: 2 + Math.random() * 3,
  }));
}

/* ───────────────────── cloud data ───────────────────────────── */
function makeClouds() {
  return [
    { id: 0, top: 8, size: 80, dur: 28, delay: 0, opacity: 0.25 },
    { id: 1, top: 18, size: 60, dur: 34, delay: 5, opacity: 0.18 },
    { id: 2, top: 5, size: 50, dur: 22, delay: 12, opacity: 0.2 },
  ];
}

/* ─────────────────────────── component ─────────────────────────── */
export default function SandyGame({ gameId, playerId, opponentId, isPlayerTurn, onMove, onGameOver }: any) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [cups, setCups] = useState<CupData[]>(() => makeCups());
  const [phase, setPhase] = useState<'aim' | 'fly' | 'done'>('aim');
  const [ballPos, setBallPos] = useState<BallPos | null>(null);
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCur, setDragCur] = useState<{ x: number; y: number } | null>(null);
  const trailIdRef = useRef(0);
  const rafRef = useRef(0);
  const ballVelRef = useRef({ vx: 0, vy: 0 });
  const ballPosRef = useRef({ x: 0, y: 0 });
  const hitRef = useRef<number[]>([]);
  const innerRef = useRef<HTMLDivElement>(null);

  const sparkles = useMemo(() => makeSparkles(25), []);
  const clouds = useMemo(() => makeClouds(), []);

  // keep inner scaler in sync with container width
  useEffect(() => {
    const sync = () => {
      if (!boardRef.current || !innerRef.current) return;
      const scale = boardRef.current.clientWidth / BOARD_W;
      innerRef.current.style.transform = `scale(${scale})`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (boardRef.current) ro.observe(boardRef.current);
    return () => ro.disconnect();
  }, []);

  const aliveCups = cups.filter(c => c.alive).length;
  const launchY = BOARD_H - 80;
  const launchX = BOARD_W / 2;

  /* ─── aim trajectory dots ─── */
  const aimDots = useMemo(() => {
    if (!dragStart || !dragCur || phase !== 'aim') return [];
    const dx = dragStart.x - dragCur.x;
    const dy = dragStart.y - dragCur.y;
    const power = Math.min(Math.hypot(dx, dy) * POWER_SCALE, MAX_POWER);
    const angle = Math.atan2(dy, dx);
    const dots: { x: number; y: number }[] = [];
    let px = launchX, py = launchY;
    let vx = Math.cos(angle) * power;
    let vy = Math.sin(angle) * power;
    const dt = 1.4;
    for (let i = 0; i < 28; i++) {
      px += vx * dt;
      py += vy * dt;
      vy += GRAVITY * dt;
      if (px < 10) { px = 10; vx = -vx * 0.5; }
      if (px > BOARD_W - 10) { px = BOARD_W - 10; vx = -vx * 0.5; }
      if (py < -20) break;
      if (i % 2 === 0) dots.push({ x: px, y: py });
    }
    return dots;
  }, [dragStart, dragCur, phase]);

  /* ─── ball flight physics via rAF ─── */
  const flyBall = useCallback((startVx: number, startVy: number) => {
    ballPosRef.current = { x: launchX, y: launchY };
    ballVelRef.current = { vx: startVx, vy: startVy };
    hitRef.current = [];
    setBallPos({ x: launchX, y: launchY });
    setPhase('fly');

    const trailDots: TrailDot[] = [];
    let frameCount = 0;

    const step = () => {
      const bp = ballPosRef.current;
      const bv = ballVelRef.current;

      // add slight randomness
      bv.vx += (Math.random() - 0.5) * 0.08;
      bp.x += bv.vx;
      bp.y += bv.vy;
      bv.vy += GRAVITY;

      // wall bounce
      if (bp.x < BALL_SIZE / 2) { bp.x = BALL_SIZE / 2; bv.vx = -bv.vx * 0.5; }
      if (bp.x > BOARD_W - BALL_SIZE / 2) { bp.x = BOARD_W - BALL_SIZE / 2; bv.vx = -bv.vx * 0.5; }

      // trail
      if (frameCount % 2 === 0) {
        trailIdRef.current++;
        trailDots.push({ x: bp.x, y: bp.y, id: trailIdRef.current });
        if (trailDots.length > 12) trailDots.shift();
        setTrail([...trailDots]);
      }
      frameCount++;

      setBallPos({ x: bp.x, y: bp.y });

      // cup collision
      let hitSomething = false;
      setCups(prev => {
        const next = prev.map(cup => {
          if (!cup.alive || hitSomething) return cup;
          const cp = cupPosition(cup, BOARD_W);
          const dx = bp.x - cp.x;
          const dy = bp.y - cp.y;
          if (Math.abs(dx) < CUP_W / 2 + 2 && Math.abs(dy) < CUP_H / 2 + 2) {
            hitSomething = true;
            hitRef.current.push(cup.id);
            return { ...cup, alive: false };
          }
          return cup;
        });
        return hitSomething ? next : prev;
      });

      if (hitSomething) {
        // stop ball
        setTimeout(() => finishThrow(), 350);
        return;
      }

      // out of bounds
      if (bp.y < -40 || bp.y > BOARD_H + 40) {
        finishThrow();
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    const finishThrow = () => {
      setBallPos(null);
      setTrail([]);
      setPhase('done');

      setCups(latest => {
        const remaining = latest.filter(c => c.alive).length;
        const hitIds = hitRef.current;
        onMove?.({
          cupsHit: hitIds.length > 0 ? hitIds[0] : null,
          result: hitIds.length > 0 ? 'hit' : 'miss',
        });
        if (remaining === 0) {
          onGameOver?.({ winner_id: playerId });
        }
        return latest;
      });

      setTimeout(() => setPhase('aim'), 500);
    };

    rafRef.current = requestAnimationFrame(step);
  }, [onMove, onGameOver, playerId]);

  /* ─── cleanup rAF ─── */
  useEffect(() => {
    return () => { cancelAnimationFrame(rafRef.current); };
  }, []);

  /* ─── pointer helpers ─── */
  const getLocalPos = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const el = boardRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const scaleX = BOARD_W / rect.width;
    const scaleY = BOARD_H / rect.height;
    const src = 'touches' in e ? (e as React.TouchEvent).touches[0] || (e as React.TouchEvent).changedTouches[0] : (e as React.MouseEvent);
    return {
      x: (src.clientX - rect.left) * scaleX,
      y: (src.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleDown = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isPlayerTurn || phase !== 'aim') return;
    e.preventDefault();
    const p = getLocalPos(e);
    setDragStart(p);
    setDragCur(p);
  }, [isPlayerTurn, phase, getLocalPos]);

  const handleMoveEvt = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!dragStart) return;
    e.preventDefault();
    setDragCur(getLocalPos(e));
  }, [dragStart, getLocalPos]);

  const handleUp = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!dragStart || !dragCur || !isPlayerTurn || phase !== 'aim') {
      setDragStart(null);
      setDragCur(null);
      return;
    }
    const dx = dragStart.x - dragCur.x;
    const dy = dragStart.y - dragCur.y;
    const dist = Math.hypot(dx, dy);
    setDragStart(null);
    setDragCur(null);
    if (dist < 12) return;
    const power = Math.min(dist * POWER_SCALE, MAX_POWER);
    const angle = Math.atan2(dy, dx);
    flyBall(Math.cos(angle) * power, Math.sin(angle) * power);
  }, [dragStart, dragCur, isPlayerTurn, phase, flyBall]);

  /* ─── SVG aim line path ─── */
  const aimPath = useMemo(() => {
    if (aimDots.length < 2) return '';
    return 'M ' + aimDots.map(d => `${d.x},${d.y}`).join(' L ');
  }, [aimDots]);

  /* ═════════════════════════════ RENDER ═════════════════════════════ */
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 500,
        margin: '0 auto',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Board container – preserves aspect ratio */}
      <div
        ref={boardRef}
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: `${(BOARD_H / BOARD_W) * 100}%`,
          borderRadius: 20,
          overflow: 'hidden',
          cursor: isPlayerTurn && phase === 'aim' ? 'crosshair' : 'default',
          boxShadow: '0 8px 40px rgba(255,160,122,0.25), 0 2px 12px rgba(0,0,0,0.15)',
        }}
        onMouseDown={handleDown}
        onMouseMove={handleMoveEvt}
        onMouseUp={handleUp}
        onMouseLeave={handleUp}
        onTouchStart={handleDown}
        onTouchMove={handleMoveEvt}
        onTouchEnd={handleUp}
      >
        {/* Inner scaler: maps BOARD_W×BOARD_H virtual coords to 100% width */}
        <div
          ref={innerRef}
          style={{
            position: 'absolute',
            inset: 0,
            width: BOARD_W,
            height: BOARD_H,
            transformOrigin: 'top left',
          }}
        >
          {/* ── Sunset gradient background ── */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, #ffa07a 0%, #ffb6c1 25%, #ffd1dc 50%, #ffe4e1 75%, #fef5e7 100%)',
          }} />

          {/* ── Sun glow ── */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.7, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute', top: -60, left: '50%', marginLeft: -120,
              width: 240, height: 240, borderRadius: '50%',
              background: 'radial-gradient(circle, #ffcccb 0%, rgba(255,204,203,0) 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* ── Floating clouds ── */}
          {clouds.map(c => (
            <motion.div
              key={c.id}
              animate={{ x: [-(c.size), BOARD_W + c.size] }}
              transition={{ duration: c.dur, repeat: Infinity, delay: c.delay, ease: 'linear' }}
              style={{
                position: 'absolute', top: c.top, left: 0,
                width: c.size, height: c.size * 0.45, borderRadius: '50%',
                background: `rgba(255,255,255,${c.opacity})`,
                filter: 'blur(6px)',
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* ── Sparkle particles ── */}
          {sparkles.map(s => (
            <motion.div
              key={s.id}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: s.dur, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                borderRadius: '50%',
                background: 'white',
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* ── Palm tree silhouettes ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 120,
            opacity: 0.1, pointerEvents: 'none',
          }}>
            {/* Left palm */}
            <svg viewBox="0 0 120 120" style={{ position: 'absolute', bottom: 0, left: -10, width: 120, height: 120 }}>
              <path d="M60,120 L58,60 Q30,40 10,20 Q35,45 55,55 Q40,25 25,5 Q45,35 56,52 Q55,20 60,0 Q62,25 61,52 Q70,30 85,8 Q72,38 62,55 Q80,40 100,25 Q75,50 60,58 Z" fill="#2d1810" />
            </svg>
            {/* Right palm */}
            <svg viewBox="0 0 120 120" style={{ position: 'absolute', bottom: 0, right: -10, width: 100, height: 100 }}>
              <path d="M60,120 L58,60 Q30,40 10,20 Q35,45 55,55 Q40,25 25,5 Q45,35 56,52 Q55,20 60,0 Q62,25 61,52 Q70,30 85,8 Q72,38 62,55 Q80,40 100,25 Q75,50 60,58 Z" fill="#2d1810" />
            </svg>
          </div>

          {/* ── Wooden deck texture ── */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
            background: 'linear-gradient(180deg, transparent 0%, rgba(180,130,80,0.12) 30%, rgba(160,110,60,0.18) 100%)',
            pointerEvents: 'none',
          }}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} style={{
                position: 'absolute', left: 0, right: 0,
                top: 12 + i * 14,
                height: 1,
                background: 'rgba(139,90,43,0.12)',
              }} />
            ))}
          </div>

          {/* ── Score pill ── */}
          <div style={{
            position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
            padding: '6px 20px', borderRadius: 20, zIndex: 20,
            background: GLASS_BG,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${GLASS_BORDER}`,
            color: PINK, fontWeight: 700, fontSize: 14,
            fontFamily: 'system-ui, sans-serif',
            display: 'flex', gap: 14, alignItems: 'center',
          }}>
            <span>🏖️ {aliveCups} left</span>
          </div>

          {/* ── Cups (beach pong cups) ── */}
          <AnimatePresence>
            {cups.filter(c => c.alive).map(cup => {
              const pos = cupPosition(cup, BOARD_W);
              return (
                <motion.div
                  key={cup.id}
                  initial={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0, y: 20, rotate: 15 }}
                  transition={{ duration: 0.4, ease: 'backIn' }}
                  style={{
                    position: 'absolute',
                    left: pos.x - CUP_W / 2,
                    top: pos.y - CUP_H / 2,
                    width: CUP_W,
                    height: CUP_H,
                    zIndex: 5,
                  }}
                >
                  {/* Cup shape via clip-path */}
                  <div style={{
                    width: '100%', height: '100%',
                    clipPath: 'polygon(15% 0%, 85% 0%, 75% 55%, 58% 65%, 58% 82%, 72% 88%, 72% 95%, 28% 95%, 28% 88%, 42% 82%, 42% 65%, 25% 55%)',
                    background: 'linear-gradient(180deg, rgba(255,192,203,0.95) 0%, rgba(255,160,180,0.9) 40%, rgba(255,130,160,0.85) 100%)',
                    position: 'relative',
                    boxShadow: '0 2px 8px rgba(255,105,180,0.3)',
                  }}>
                    {/* Glass reflection */}
                    <div style={{
                      position: 'absolute', top: 3, left: '22%', width: '18%', height: '35%',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.45)',
                      filter: 'blur(2px)',
                    }} />
                    {/* Rosé liquid fill */}
                    <div style={{
                      position: 'absolute', top: '25%', left: '20%', right: '20%', bottom: '45%',
                      background: 'rgba(220,80,120,0.4)',
                      borderRadius: '0 0 40% 40%',
                    }} />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* ── Aim trajectory line (SVG) ── */}
          {aimPath && phase === 'aim' && (
            <svg style={{ position: 'absolute', inset: 0, width: BOARD_W, height: BOARD_H, pointerEvents: 'none', zIndex: 8 }}>
              <path d={aimPath} fill="none" stroke={PINK} strokeWidth={2.5} strokeDasharray="6 8" opacity={0.7} />
              {aimDots.length > 0 && (
                <circle cx={aimDots[aimDots.length - 1].x} cy={aimDots[aimDots.length - 1].y}
                  r={4} fill={PINK} opacity={0.8} />
              )}
            </svg>
          )}

          {/* ── Ball trail ── */}
          {trail.map((t, i) => (
            <div key={t.id} style={{
              position: 'absolute',
              left: t.x - 4,
              top: t.y - 4,
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: `rgba(255,105,180,${0.15 + (i / trail.length) * 0.25})`,
              pointerEvents: 'none',
              zIndex: 9,
            }} />
          ))}

          {/* ── Ball ── */}
          {(phase === 'aim' || ballPos) && (
            <motion.div
              animate={ballPos ? { x: ballPos.x - BALL_SIZE / 2, y: ballPos.y - BALL_SIZE / 2 } : undefined}
              transition={{ duration: 0 }}
              style={{
                position: 'absolute',
                left: ballPos ? undefined : launchX - BALL_SIZE / 2,
                top: ballPos ? undefined : launchY - BALL_SIZE / 2,
                x: ballPos ? ballPos.x - BALL_SIZE / 2 : undefined,
                y: ballPos ? ballPos.y - BALL_SIZE / 2 : undefined,
                width: BALL_SIZE,
                height: BALL_SIZE,
                borderRadius: '50%',
                background: 'radial-gradient(circle at 38% 35%, #ffffff 0%, #ffcccb 100%)',
                boxShadow: '0 3px 10px rgba(255,105,180,0.45), inset 0 -2px 4px rgba(255,182,193,0.3)',
                zIndex: 10,
                pointerEvents: 'none',
              }}
            >
              {/* Specular highlight */}
              <div style={{
                position: 'absolute', top: 3, left: 5, width: 7, height: 5,
                borderRadius: '50%', background: 'rgba(255,255,255,0.8)',
              }} />
            </motion.div>
          )}

          {/* ── Turn overlay ── */}
          <AnimatePresence>
            {phase === 'aim' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 20, textAlign: 'center', pointerEvents: 'none',
                }}
              >
                <div style={{
                  padding: '10px 28px', borderRadius: 16,
                  background: GLASS_BG,
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: `1px solid ${GLASS_BORDER}`,
                  color: isPlayerTurn ? PINK : '#b0a0a8',
                  fontWeight: 700, fontSize: 16,
                  fontFamily: 'system-ui, sans-serif',
                  whiteSpace: 'nowrap',
                }}>
                  {isPlayerTurn ? '🎯 Your turn!' : '⏳ Waiting...'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Swipe-to-throw button ── */}
          {isPlayerTurn && phase === 'aim' && !dragStart && (
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                bottom: 16, left: '50%', transform: 'translateX(-50%)',
                padding: '10px 24px', borderRadius: 20,
                background: GLASS_BG,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: `1px solid ${GLASS_BORDER}`,
                color: PINK, fontWeight: 600, fontSize: 13,
                fontFamily: 'system-ui, sans-serif',
                pointerEvents: 'none', zIndex: 15,
                whiteSpace: 'nowrap',
              }}
            >
              ☝️ Swipe to throw
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
