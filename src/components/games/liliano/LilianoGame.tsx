import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── constants ────────────────────────────────────────────────
const GAME_W = 600;
const GAME_H = 400;
const GROUND_Y = 340;
const GRAVITY = 0.12;
const WIND_MAX = 0.04;
const TANK_W = 50;
const TANK_H = 30;
const BARREL_LEN = 28;
const HIT_RADIUS = 40;
const MAX_HP = 3;

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// ── generate stars once ─────────────────────────────────────
function generateStars(count: number) {
  const colors = ['#ff00ff', '#00ffff', '#ffffff'];
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    y: Math.random() * 60,
    size: Math.random() * 2 + 1,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 3,
    duration: 1.5 + Math.random() * 2,
  }));
}

// ── generate floating particles ─────────────────────────────
function generateParticles(count: number) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * 100,
    startY: 90 + Math.random() * 20,
    size: Math.random() * 3 + 2,
    color: Math.random() > 0.5 ? '#ff00ff' : '#00ffff',
    duration: 4 + Math.random() * 6,
    delay: Math.random() * 5,
  }));
}

// ── generate buildings ──────────────────────────────────────
function generateBuildings() {
  return Array.from({ length: 10 }, (_, i) => ({
    x: i * 10,
    width: 6 + Math.random() * 4,
    height: 15 + Math.random() * 25,
    windows: Array.from({ length: Math.floor(Math.random() * 6) + 2 }, () => ({
      wx: 15 + Math.random() * 70,
      wy: 15 + Math.random() * 70,
      color: Math.random() > 0.5 ? '#ff00ff' : '#00ffff',
      flicker: Math.random() * 3,
    })),
  }));
}

// ── obstacle positions ──────────────────────────────────────
const OBSTACLES = [
  { x: GAME_W * 0.35, w: 30, h: 40 },
  { x: GAME_W * 0.50, w: 25, h: 50 },
  { x: GAME_W * 0.65, w: 30, h: 35 },
];

// ── component ───────────────────────────────────────────────
export default function LilianoGame({ gameId, playerId, opponentId, isPlayerTurn, onMove, onGameOver }: any) {
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(60);
  const [hp1, setHp1] = useState(MAX_HP);
  const [hp2, setHp2] = useState(MAX_HP);
  const [firing, setFiring] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [wind, setWind] = useState(() => (Math.random() - 0.5) * WIND_MAX * 2);
  const [projectile, setProjectile] = useState<{ x: number; y: number; vx: number; vy: number; trail: { x: number; y: number }[]; rotation: number } | null>(null);
  const [explosionPos, setExplosionPos] = useState<{ x: number; y: number } | null>(null);
  const animRef = useRef<number>(0);
  const hp1Ref = useRef(MAX_HP);
  const hp2Ref = useRef(MAX_HP);

  const stars = useMemo(() => generateStars(120), []);
  const particles = useMemo(() => generateParticles(15), []);
  const buildings = useMemo(() => generateBuildings(), []);

  // Tank positions
  const tank1X = GAME_W * 0.12;
  const tank2X = GAME_W * 0.88;
  const tankY = GROUND_Y;

  // ── fire ──────────────────────────────────────────────
  const fire = useCallback(() => {
    if (firing || gameOver || !isPlayerTurn) return;
    setFiring(true);
    const rad = (angle * Math.PI) / 180;
    const speed = (power / 100) * 10;
    const tipX = tank1X + Math.cos(rad) * BARREL_LEN;
    const tipY = tankY - TANK_H / 2 - Math.sin(rad) * BARREL_LEN;
    setProjectile({
      x: tipX, y: tipY,
      vx: Math.cos(rad) * speed,
      vy: -Math.sin(rad) * speed,
      trail: [],
      rotation: 0,
    });
  }, [angle, power, firing, gameOver, isPlayerTurn, tank1X, tankY]);

  // ── projectile physics loop ───────────────────────────
  const projRef = useRef(projectile);
  projRef.current = projectile;

  useEffect(() => {
    if (!firing || !projRef.current) return;
    const p = { ...projRef.current, trail: [...projRef.current.trail] };
    let running = true;

    const step = () => {
      if (!running) return;
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > 30) p.trail.shift();
      p.vx += wind;
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += 15;

      for (const obs of OBSTACLES) {
        if (p.x > obs.x - obs.w / 2 && p.x < obs.x + obs.w / 2 &&
            p.y > GROUND_Y - obs.h && p.y < GROUND_Y) {
          handleImpact(p.x, p.y, false); running = false; return;
        }
      }

      if (p.y >= GROUND_Y) { handleImpact(p.x, GROUND_Y, false); running = false; return; }

      const d2 = Math.sqrt((p.x - tank2X) ** 2 + (p.y - (tankY - TANK_H / 2)) ** 2);
      if (d2 < HIT_RADIUS) { handleImpact(p.x, p.y, true); running = false; return; }

      if (p.x < -50 || p.x > GAME_W + 50 || p.y > GAME_H + 50) {
        handleImpact(p.x, p.y, false); running = false; return;
      }

      setProjectile({ x: p.x, y: p.y, vx: p.vx, vy: p.vy, trail: [...p.trail], rotation: p.rotation });
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firing]);

  const handleImpact = useCallback((x: number, y: number, hit: boolean) => {
    setProjectile(null);
    setExplosionPos({ x, y });
    setTimeout(() => setExplosionPos(null), 600);

    const damage = hit ? 1 : 0;
    if (hit) {
      const newHp2 = hp2Ref.current - 1;
      hp2Ref.current = newHp2;
      setHp2(newHp2);

      if (newHp2 <= 0) {
        setGameOver(true);
        setWinner(playerId);
        setTimeout(() => onGameOver?.({ winner_id: playerId }), 800);
        setFiring(false);
        return;
      }
    }

    setTimeout(() => {
      onMove?.({ angle, power, hit, damage });
      setFiring(false);
      setWind((Math.random() - 0.5) * WIND_MAX * 2);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angle, power, playerId, onMove, onGameOver]);

  // Sync refs
  useEffect(() => { hp1Ref.current = hp1; }, [hp1]);
  useEffect(() => { hp2Ref.current = hp2; }, [hp2]);

  const barrelRad = (angle * Math.PI) / 180;
  const windDisplay = wind > 0 ? `→ ${(wind * 1000).toFixed(1)}` : `← ${(Math.abs(wind) * 1000).toFixed(1)}`;
  const anglePct = ((angle - 10) / 70) * 100;
  const powerPct = ((power - 20) / 80) * 100;
  const disabled = firing || !isPlayerTurn || gameOver;

  return (
    <div style={{
      width: '100%', maxWidth: 620, margin: '0 auto', fontFamily: 'Arial, sans-serif',
      userSelect: 'none', borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 0 40px rgba(255,0,255,0.3), 0 0 80px rgba(0,255,255,0.15)',
    }}>
      {/* ── GAME AREA ─────────────────────────────────── */}
      <div style={{
        position: 'relative', width: '100%', paddingBottom: `${(GAME_H / GAME_W) * 100}%`,
        background: 'radial-gradient(ellipse at 50% 30%, #1a0033 0%, #0d001a 50%, #000 100%)',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0 }}>

          {/* ── Stars ────────────────────────────────── */}
          {stars.map((s, i) => (
            <motion.div key={`star-${i}`}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: s.duration, delay: s.delay, repeat: Infinity }}
              style={{
                position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
                width: s.size, height: s.size, borderRadius: '50%',
                background: s.color,
                boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
              }}
            />
          ))}

          {/* ── Neon light beams ──────────────────────── */}
          <div style={{
            position: 'absolute', left: '30%', top: 0, bottom: 0, width: 2,
            background: '#ff00ff', opacity: 0.08, filter: 'blur(8px)',
          }} />
          <div style={{
            position: 'absolute', left: '70%', top: 0, bottom: 0, width: 2,
            background: '#00ffff', opacity: 0.08, filter: 'blur(8px)',
          }} />

          {/* ── Neon grid floor ───────────────────────── */}
          <div style={{
            position: 'absolute', left: 0, right: 0, bottom: 0, height: '25%',
            perspective: 300, overflow: 'hidden',
          }}>
            <div style={{
              width: '100%', height: '100%', transformOrigin: 'bottom center',
              transform: 'rotateX(60deg)',
              backgroundImage:
                'linear-gradient(0deg, rgba(255,0,255,0.15) 1px, transparent 1px),' +
                'linear-gradient(90deg, rgba(0,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '30px 20px',
            }} />
          </div>

          {/* ── City silhouette ───────────────────────── */}
          {buildings.map((b, i) => (
            <div key={`bldg-${i}`} style={{
              position: 'absolute', left: `${b.x}%`, bottom: `${((GAME_H - GROUND_Y) / GAME_H) * 100}%`,
              width: `${b.width}%`, height: `${b.height}%`,
              background: '#0a0014', borderTop: '1px solid rgba(255,0,255,0.2)',
            }}>
              {b.windows.map((w, j) => (
                <motion.div key={`win-${i}-${j}`}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1 + w.flicker, repeat: Infinity, delay: w.flicker }}
                  style={{
                    position: 'absolute', left: `${w.wx}%`, top: `${w.wy}%`,
                    width: 3, height: 3, background: w.color,
                    boxShadow: `0 0 4px ${w.color}`,
                  }}
                />
              ))}
            </div>
          ))}

          {/* ── Floating neon particles ───────────────── */}
          {particles.map((p, i) => (
            <motion.div key={`particle-${i}`}
              animate={{ y: [0, -200], opacity: [0, 0.8, 0] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity }}
              style={{
                position: 'absolute', left: `${p.x}%`, top: `${p.startY}%`,
                width: p.size, height: p.size, borderRadius: '50%',
                background: p.color, boxShadow: `0 0 6px ${p.color}`,
              }}
            />
          ))}

          {/* ── Ground line ───────────────────────────── */}
          <div style={{
            position: 'absolute', left: 0, right: 0,
            top: `${(GROUND_Y / GAME_H) * 100}%`, height: 2,
            background: '#ff00ff',
            boxShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 -2px 15px rgba(255,0,255,0.4)',
          }} />

          {/* ── Obstacles ─────────────────────────────── */}
          {OBSTACLES.map((obs, i) => (
            <motion.div key={`obs-${i}`}
              animate={{ boxShadow: [
                '0 0 8px #ff00ff, 0 0 16px rgba(255,0,255,0.4)',
                '0 0 14px #00ffff, 0 0 24px rgba(0,255,255,0.5)',
                '0 0 8px #ff00ff, 0 0 16px rgba(255,0,255,0.4)',
              ]}}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              style={{
                position: 'absolute',
                left: `${((obs.x - obs.w / 2) / GAME_W) * 100}%`,
                top: `${((GROUND_Y - obs.h) / GAME_H) * 100}%`,
                width: `${(obs.w / GAME_W) * 100}%`,
                height: `${(obs.h / GAME_H) * 100}%`,
                background: 'linear-gradient(180deg, rgba(255,0,255,0.15), rgba(0,255,255,0.1))',
                border: '1px solid',
                borderImage: 'linear-gradient(180deg, #ff00ff, #00ffff) 1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16,
              }}
            >
              ⚡
            </motion.div>
          ))}

          {/* ── Wind display ──────────────────────────── */}
          <div style={{
            position: 'absolute', top: '4%', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.8)', border: '1px solid #00ffff',
            borderRadius: 20, padding: '4px 14px',
            color: '#00ffff', fontSize: 11, fontWeight: 700, letterSpacing: 1,
            boxShadow: '0 0 10px rgba(0,255,255,0.3)',
            fontFamily: 'Arial, sans-serif',
          }}>
            WIND {windDisplay}
          </div>

          {/* ── Health displays ───────────────────────── */}
          <div style={{ position: 'absolute', top: '4%', left: '4%', display: 'flex', gap: 6 }}>
            {Array.from({ length: MAX_HP }).map((_, i) => (
              <motion.div key={`hp1-${i}`}
                animate={i < hp1 ? { boxShadow: [
                  '0 0 6px #ff00ff', '0 0 14px #ff00ff', '0 0 6px #ff00ff',
                ]} : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 14, height: 14, borderRadius: 2,
                  background: i < hp1 ? '#ff00ff' : 'rgba(255,0,255,0.15)',
                  border: '1px solid #ff00ff',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>
          <div style={{ position: 'absolute', top: '4%', right: '4%', display: 'flex', gap: 6 }}>
            {Array.from({ length: MAX_HP }).map((_, i) => (
              <motion.div key={`hp2-${i}`}
                animate={i < hp2 ? { boxShadow: [
                  '0 0 6px #00ffff', '0 0 14px #00ffff', '0 0 6px #00ffff',
                ]} : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  width: 14, height: 14, borderRadius: 2,
                  background: i < hp2 ? '#00ffff' : 'rgba(0,255,255,0.15)',
                  border: '1px solid #00ffff',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>

          {/* ── Player Tank (magenta) ─────────────────── */}
          <div style={{
            position: 'absolute',
            left: `${(tank1X / GAME_W) * 100}%`,
            top: `${((tankY - TANK_H) / GAME_H) * 100}%`,
            transform: 'translateX(-50%)',
          }}>
            {/* Emoji floating above */}
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ textAlign: 'center', fontSize: 18, marginBottom: 4,
                filter: 'drop-shadow(0 0 6px #ff00ff)' }}
            >⚡</motion.div>
            {/* Barrel */}
            <div style={{
              position: 'absolute',
              left: '50%', top: `${TANK_H * 0.3}px`,
              width: BARREL_LEN, height: 6,
              background: 'linear-gradient(90deg, #ff00ff, #ff66ff)',
              borderRadius: 3,
              transformOrigin: '0% 50%',
              transform: `rotate(${-angle}deg)`,
              boxShadow: '0 0 8px #ff00ff',
              zIndex: 2,
            }} />
            {/* Body */}
            <div style={{
              width: TANK_W, height: TANK_H,
              background: 'linear-gradient(180deg, #ff00ff, #990099)',
              border: '2px solid #ff00ff',
              borderRadius: 4,
              boxShadow: '0 0 15px #ff00ff, 0 0 30px rgba(255,0,255,0.3)',
              position: 'relative',
            }} />
          </div>

          {/* ── Opponent Tank (cyan) ──────────────────── */}
          <div style={{
            position: 'absolute',
            left: `${(tank2X / GAME_W) * 100}%`,
            top: `${((tankY - TANK_H) / GAME_H) * 100}%`,
            transform: 'translateX(-50%)',
          }}>
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              style={{ textAlign: 'center', fontSize: 18, marginBottom: 4,
                filter: 'drop-shadow(0 0 6px #00ffff)' }}
            >⚡</motion.div>
            {/* Barrel (pointing left) */}
            <div style={{
              position: 'absolute',
              right: '50%', top: `${TANK_H * 0.3}px`,
              width: BARREL_LEN, height: 6,
              background: 'linear-gradient(270deg, #00ffff, #0099cc)',
              borderRadius: 3,
              transformOrigin: '100% 50%',
              transform: 'rotate(30deg)',
              boxShadow: '0 0 8px #00ffff',
              zIndex: 2,
            }} />
            <div style={{
              width: TANK_W, height: TANK_H,
              background: 'linear-gradient(180deg, #00ffff, #006699)',
              border: '2px solid #00ffff',
              borderRadius: 4,
              boxShadow: '0 0 15px #00ffff, 0 0 30px rgba(0,255,255,0.3)',
            }} />
          </div>

          {/* ── Projectile ────────────────────────────── */}
          {projectile && (
            <>
              {/* Glow trail */}
              {projectile.trail.map((t, i) => (
                <div key={`trail-${i}`} style={{
                  position: 'absolute',
                  left: `${(t.x / GAME_W) * 100}%`,
                  top: `${(t.y / GAME_H) * 100}%`,
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#ff00ff',
                  opacity: (i / projectile.trail.length) * 0.6,
                  boxShadow: '0 0 8px #ff00ff',
                  transform: 'translate(-50%, -50%)',
                }} />
              ))}
              {/* Spinning thunder bolt */}
              <div style={{
                position: 'absolute',
                left: `${(projectile.x / GAME_W) * 100}%`,
                top: `${(projectile.y / GAME_H) * 100}%`,
                fontSize: 20,
                transform: `translate(-50%, -50%) rotate(${projectile.rotation}deg)`,
                filter: 'drop-shadow(0 0 10px #ff00ff) drop-shadow(0 0 20px #ff00ff)',
              }}>⚡</div>
            </>
          )}

          {/* ── Explosion ─────────────────────────────── */}
          <AnimatePresence>
            {explosionPos && (
              <motion.div
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                style={{
                  position: 'absolute',
                  left: `${(explosionPos.x / GAME_W) * 100}%`,
                  top: `${(explosionPos.y / GAME_H) * 100}%`,
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'radial-gradient(#fff, #ff00ff, transparent)',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 40px #ff00ff, 0 0 80px #00ffff',
                }}
              />
            )}
          </AnimatePresence>

          {/* ── Turn overlay ──────────────────────────── */}
          {!isPlayerTurn && !firing && !gameOver && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  color: '#00ffff', fontSize: 22, fontWeight: 700, letterSpacing: 2,
                  textShadow: '0 0 20px #00ffff',
                  fontFamily: 'Arial, sans-serif',
                }}
              >⏳ L'adversaire vise...</motion.div>
            </div>
          )}

          {isPlayerTurn && !firing && !gameOver && (
            <motion.div
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)',
                color: '#ff00ff', fontSize: 16, fontWeight: 700, letterSpacing: 2,
                textShadow: '0 0 15px #ff00ff, 0 0 30px #ff00ff',
                fontFamily: 'Arial, sans-serif',
              }}
            >YOUR TURN</motion.div>
          )}

          {/* ── Game Over overlay ─────────────────────── */}
          {gameOver && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 10,
            }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1], textShadow: [
                  '0 0 20px #ff00ff', '0 0 40px #00ffff', '0 0 20px #ff00ff',
                ]}}
                transition={{ duration: 2, repeat: Infinity }}
                style={{
                  color: winner === playerId ? '#ff00ff' : '#00ffff',
                  fontSize: 28, fontWeight: 900, letterSpacing: 3,
                  fontFamily: 'Arial, sans-serif',
                }}
              >
                {winner === playerId ? '🏆 VICTOIRE! ⚡' : '💥 DÉFAITE!'}
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* ── CONTROLS PANEL ────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, #0d001a, #000)',
        borderTop: '2px solid #ff00ff',
        boxShadow: '0 -4px 20px rgba(255,0,255,0.3)',
        padding: '14px 18px 16px',
      }}>
        {/* Angle slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{
            color: '#00ffff', fontSize: 12, fontWeight: 700, minWidth: 50,
            textTransform: 'uppercase', letterSpacing: 1,
            textShadow: '0 0 8px #00ffff',
          }}>ANGLE</span>
          <div style={{
            flex: 1, height: 24, position: 'relative', borderRadius: 12,
            background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.3)',
            overflow: 'hidden', cursor: disabled ? 'not-allowed' : 'pointer',
          }}
            onPointerDown={(e) => {
              if (disabled) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
              setAngle(Math.round(10 + ratio * 70));
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (disabled || !(e.buttons > 0)) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
              setAngle(Math.round(10 + ratio * 70));
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${anglePct}%`, background: 'linear-gradient(90deg, #006666, #00ffff)',
              borderRadius: 12, transition: 'width 0.05s',
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: `${anglePct}%`,
              transform: 'translate(-50%, -50%)', width: 18, height: 18,
              borderRadius: '50%', background: '#00ffff',
              boxShadow: '0 0 10px #00ffff',
              transition: 'left 0.05s',
            }} />
          </div>
          <span style={{
            background: 'rgba(0,0,0,0.8)', border: '1px solid #00ffff',
            borderRadius: 10, padding: '2px 10px',
            color: '#00ffff', fontSize: 13, fontWeight: 700, minWidth: 42, textAlign: 'center',
            boxShadow: '0 0 6px rgba(0,255,255,0.3)',
          }}>{angle}°</span>
        </div>

        {/* Power slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <span style={{
            color: '#ff00ff', fontSize: 12, fontWeight: 700, minWidth: 50,
            textTransform: 'uppercase', letterSpacing: 1,
            textShadow: '0 0 8px #ff00ff',
          }}>POWER</span>
          <div style={{
            flex: 1, height: 24, position: 'relative', borderRadius: 12,
            background: 'rgba(255,0,255,0.1)', border: '1px solid rgba(255,0,255,0.3)',
            overflow: 'hidden', cursor: disabled ? 'not-allowed' : 'pointer',
          }}
            onPointerDown={(e) => {
              if (disabled) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
              setPower(Math.round(20 + ratio * 80));
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (disabled || !(e.buttons > 0)) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = clamp((e.clientX - rect.left) / rect.width, 0, 1);
              setPower(Math.round(20 + ratio * 80));
            }}
          >
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${powerPct}%`, background: 'linear-gradient(90deg, #660066, #ff00ff)',
              borderRadius: 12, transition: 'width 0.05s',
            }} />
            <div style={{
              position: 'absolute', top: '50%', left: `${powerPct}%`,
              transform: 'translate(-50%, -50%)', width: 18, height: 18,
              borderRadius: '50%', background: '#ff00ff',
              boxShadow: '0 0 10px #ff00ff',
              transition: 'left 0.05s',
            }} />
          </div>
          <span style={{
            background: 'rgba(0,0,0,0.8)', border: '1px solid #ff00ff',
            borderRadius: 10, padding: '2px 10px',
            color: '#ff00ff', fontSize: 13, fontWeight: 700, minWidth: 42, textAlign: 'center',
            boxShadow: '0 0 6px rgba(255,0,255,0.3)',
          }}>{power}%</span>
        </div>

        {/* FIRE button */}
        <motion.button
          whileHover={disabled ? {} : { scale: 1.02 }}
          whileTap={disabled ? {} : { scale: 0.97 }}
          disabled={disabled}
          onClick={fire}
          style={{
            width: '100%', padding: '14px 0', border: 'none', borderRadius: 10,
            background: disabled
              ? 'rgba(100,100,100,0.3)'
              : 'linear-gradient(90deg, #ff00ff, #00ffff)',
            color: disabled ? '#666' : '#000',
            fontSize: 18, fontWeight: 900, letterSpacing: 3,
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontFamily: 'Arial, sans-serif',
            position: 'relative', overflow: 'hidden',
            boxShadow: disabled ? 'none' : '0 0 20px rgba(255,0,255,0.4), 0 0 40px rgba(0,255,255,0.2)',
          }}
        >
          {/* Shimmer animation */}
          {!disabled && (
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              }}
            />
          )}
          <span style={{ position: 'relative', zIndex: 1 }}>FIRE ⚡</span>
        </motion.button>
      </div>
    </div>
  );
}
