import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Constants ────────────────────────────────────────────────────────────────

const GAME_W = 800;
const GAME_H = 400;
const GROUND_Y = 340;
const GRAVITY = 0.15;
const TANK_W = 44;
const TANK_H = 26;
const BARREL_LEN = 24;
const HIT_RADIUS = 38;
const MAX_HP = 3;
const POWER_MULT = 0.14;

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// ── Palette ──────────────────────────────────────────────────────────────────

const C = {
  bg1: '#0a0d15', bg2: '#0d1320',
  ground: 'linear-gradient(180deg, #1a2435, #0d1520)',
  accent: '#6e42e5', accent2: '#a855f7',
  cyan: '#22d3ee', yellow: '#fbbf24',
  hit: '#ff4444', miss: '#3b82f6',
  text: '#e2e8f0', dim: '#64748b',
  glass: 'rgba(13,19,32,0.8)',
  border: 'rgba(110,66,229,0.25)',
};

// Static decoration generated once
const stars = Array.from({ length: 30 }, () => ({
  x: Math.random() * 100, y: Math.random() * 55,
  s: Math.random() * 2 + 0.5, d: Math.random() * 4,
}));

const mountains = [
  { x: 0, w: 35, h: 22, c: 'rgba(30,40,60,0.6)' },
  { x: 25, w: 30, h: 30, c: 'rgba(25,35,55,0.5)' },
  { x: 55, w: 40, h: 26, c: 'rgba(20,30,50,0.5)' },
  { x: 80, w: 25, h: 18, c: 'rgba(30,40,60,0.6)' },
];

// ── Terrain generation ───────────────────────────────────────────────────────

function generateTerrain(seed: number): number[] {
  const t: number[] = [];
  let h = GROUND_Y;
  const rng = (s: number) => {
    s = ((s * 9301 + 49297) % 233280);
    return s / 233280;
  };
  let s = seed;
  for (let x = 0; x < GAME_W; x++) {
    s = ((s * 9301 + 49297) % 233280);
    const r = s / 233280;
    if (x > 100 && x < GAME_W - 100) {
      h += (r - 0.5) * 3;
      h = clamp(h, GROUND_Y - 60, GROUND_Y + 10);
    }
    t.push(h);
  }
  // Smooth
  for (let pass = 0; pass < 3; pass++) {
    for (let x = 2; x < GAME_W - 2; x++) {
      t[x] = (t[x - 2] + t[x - 1] + t[x] + t[x + 1] + t[x + 2]) / 5;
    }
  }
  return t;
}

// ── Wind ─────────────────────────────────────────────────────────────────────

function randomWind() {
  return (Math.random() - 0.5) * 0.06;
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  gameId: string; playerId: string; opponentId: string;
  isPlayerTurn: boolean; gameState: any;
  onMove: (data: any) => void; onGameOver: (data: any) => void;
}

export default function LilianoGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: Props) {
  const isHost = playerId < opponentId; // deterministic: lower ID = left tank

  // Terrain (same for both)
  const seed = useMemo(() => {
    const id = gameId || 'default';
    let h = 0;
    for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
    return Math.abs(h);
  }, [gameId]);

  const terrain = useMemo(() => generateTerrain(seed), [seed]);

  // Tank positions
  const myX = isHost ? 80 : GAME_W - 80;
  const opX = isHost ? GAME_W - 80 : 80;
  const myY = terrain[Math.round(myX)] || GROUND_Y;
  const opY = terrain[Math.round(opX)] || GROUND_Y;

  // State
  const [angle, setAngle] = useState(isHost ? 45 : 135);
  const [power, setPower] = useState(60);
  const [myHp, setMyHp] = useState(MAX_HP);
  const [opHp, setOpHp] = useState(MAX_HP);
  const [wind, setWind] = useState(() => randomWind());
  const [firing, setFiring] = useState(false);
  const [projPath, setProjPath] = useState<{ x: number; y: number }[]>([]);
  const [projIdx, setProjIdx] = useState(0);
  const [explosions, setExplosions] = useState<{ x: number; y: number; hit: boolean; id: number }[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [turnMessage, setTurnMessage] = useState<string | null>(null);

  const animFrame = useRef<number>(0);
  const expCounter = useRef(0);

  // ── Simulate projectile trajectory ─────────────────────────────────────────

  const simulate = useCallback((fromX: number, fromY: number, a: number, p: number, w: number): { x: number; y: number }[] => {
    const rad = (a * Math.PI) / 180;
    let vx = Math.cos(rad) * p * POWER_MULT;
    let vy = -Math.sin(rad) * p * POWER_MULT;
    let x = fromX, y = fromY - TANK_H;
    const path: { x: number; y: number }[] = [{ x, y }];

    for (let i = 0; i < 600; i++) {
      vx += w;
      vy += GRAVITY;
      x += vx;
      y += vy;
      path.push({ x, y });
      if (y > GAME_H + 20 || x < -50 || x > GAME_W + 50) break;
      const tx = clamp(Math.round(x), 0, GAME_W - 1);
      if (y >= (terrain[tx] || GROUND_Y)) break;
    }
    return path;
  }, [terrain]);

  // ── Fire! ──────────────────────────────────────────────────────────────────

  const fire = useCallback((fromX: number, fromY: number, a: number, p: number, w: number, targetX: number, targetY: number, isMine: boolean) => {
    const path = simulate(fromX, fromY, a, p, w);
    setProjPath(path);
    setProjIdx(0);
    setFiring(true);

    let idx = 0;
    const step = () => {
      idx += 2; // speed
      if (idx >= path.length) {
        // Impact
        const end = path[path.length - 1];
        const dist = Math.sqrt((end.x - targetX) ** 2 + (end.y - targetY) ** 2);
        const isHit = dist < HIT_RADIUS;

        expCounter.current++;
        setExplosions(prev => [...prev, { x: end.x, y: end.y, hit: isHit, id: expCounter.current }]);
        setTimeout(() => {
          setExplosions(prev => prev.filter(e => e.id !== expCounter.current));
        }, 1200);

        if (isHit) {
          if (isMine) {
            setOpHp(prev => {
              const next = prev - 1;
              if (next <= 0) {
                setGameOver(true);
                setWinner(playerId);
                onGameOver({ winner_id: playerId });
              }
              return next;
            });
          } else {
            setMyHp(prev => {
              const next = prev - 1;
              if (next <= 0) {
                setGameOver(true);
                setWinner(opponentId);
              }
              return next;
            });
          }
        }

        setFiring(false);
        setProjPath([]);
        setWind(randomWind()); // new wind each turn
        return;
      }
      setProjIdx(idx);
      animFrame.current = requestAnimationFrame(step);
    };
    animFrame.current = requestAnimationFrame(step);
  }, [simulate, playerId, opponentId, onGameOver]);

  useEffect(() => () => { if (animFrame.current) cancelAnimationFrame(animFrame.current); }, []);

  // ── Handle my shot ─────────────────────────────────────────────────────────

  const handleFire = useCallback(() => {
    if (!isPlayerTurn || firing || gameOver) return;
    fire(myX, myY, angle, power, wind, opX, opY, true);
    onMove({ type: 'fire', angle, power, wind });
  }, [isPlayerTurn, firing, gameOver, myX, myY, angle, power, wind, opX, opY, fire, onMove]);

  // ── Handle opponent's shot ─────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const move = gameState.lastMove;
    if (move.playerId === playerId || move.type !== 'fire') return;

    // Animate opponent's shot
    const { angle: a, power: p, wind: w } = move;
    setWind(w);
    setTimeout(() => {
      fire(opX, opY, a, p, w, myX, myY, false);
    }, 400);
  }, [gameState?.lastMove]);

  // ── Trajectory preview ─────────────────────────────────────────────────────

  const preview = useMemo(() => {
    if (!isPlayerTurn || firing || gameOver) return [];
    const path = simulate(myX, myY, angle, power, wind);
    return path.filter((_, i) => i % 6 === 0).slice(0, 20);
  }, [isPlayerTurn, firing, gameOver, myX, myY, angle, power, wind, simulate]);

  // ── Current projectile position ────────────────────────────────────────────

  const projPos = firing && projPath[projIdx] ? projPath[projIdx] : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderTank = (x: number, ty: number, color1: string, color2: string, facingRight: boolean, hp: number) => (
    <g>
      {/* Body */}
      <rect
        x={x - TANK_W / 2} y={ty - TANK_H}
        width={TANK_W} height={TANK_H}
        rx={6} fill={`url(#tank-${color1})`}
        stroke={color2} strokeWidth={1.5}
      />
      {/* Treads */}
      <rect
        x={x - TANK_W / 2 - 3} y={ty - 5}
        width={TANK_W + 6} height={8}
        rx={4} fill="#1a1a2e" stroke={color2} strokeWidth={1}
      />
      {/* HP indicator */}
      {Array.from({ length: MAX_HP }, (_, i) => (
        <circle
          key={i}
          cx={x - 8 + i * 8} cy={ty - TANK_H - 10}
          r={3.5}
          fill={i < hp ? '#34d399' : '#374151'}
          stroke={i < hp ? '#10b981' : '#4b5563'}
          strokeWidth={1}
        />
      ))}
    </g>
  );

  const barrelAngle = isHost ? -angle : -(180 - angle);
  const opBarrelAngle = isHost ? -(180 - 45) : -45;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: C.bg1, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      padding: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
        <motion.h1
          initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{
            fontSize: 22, fontWeight: 900,
            background: 'linear-gradient(135deg, #a855f7, #22d3ee)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}
        >⚡ LILIANO THUNDER</motion.h1>
      </div>

      {/* Turn / Status */}
      <div style={{
        padding: '4px 16px', borderRadius: 16, fontSize: 13, fontWeight: 700, marginBottom: 8,
        background: gameOver ? 'rgba(52,199,89,0.15)' : isPlayerTurn ? `${C.accent}22` : 'rgba(100,100,100,0.1)',
        color: gameOver ? '#34C759' : isPlayerTurn ? C.cyan : C.dim,
        border: `1px solid ${gameOver ? 'rgba(52,199,89,0.3)' : isPlayerTurn ? C.border : 'rgba(100,100,100,0.15)'}`,
      }}>
        {gameOver
          ? (winner === playerId ? '🏆 Victoire !' : '💥 Défaite...')
          : firing ? '💨 Tir en cours...'
            : isPlayerTurn ? '�� Règle ton tir !' : '⏳ L\'adversaire vise...'}
      </div>

      {/* Wind indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
        fontSize: 12, fontWeight: 600, color: C.dim,
      }}>
        <span>🌬️ Vent</span>
        <div style={{
          width: 80, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -2, height: 10, width: 4, borderRadius: 2,
            background: C.cyan, left: `${50 + wind * 600}%`,
            transition: 'left 0.3s',
          }} />
        </div>
        <span style={{ color: wind > 0 ? '#22d3ee' : '#f472b6', fontSize: 11 }}>
          {wind > 0 ? '→' : '←'} {Math.abs(wind * 100).toFixed(1)}
        </span>
      </div>

      {/* Game canvas */}
      <div style={{
        borderRadius: 16, overflow: 'hidden', border: `1px solid ${C.border}`,
        boxShadow: `0 0 30px ${C.accent}22`,
      }}>
        <svg width={GAME_W} height={GAME_H} viewBox={`0 0 ${GAME_W} ${GAME_H}`}
          style={{ background: C.bg2, display: 'block' }}>
          <defs>
            <linearGradient id="tank-purple" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="tank-red" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0a0d15" />
              <stop offset="100%" stopColor="#0d1320" />
            </linearGradient>
          </defs>

          {/* Sky */}
          <rect width={GAME_W} height={GAME_H} fill="url(#sky-grad)" />

          {/* Stars */}
          {stars.map((s, i) => (
            <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.s} fill="#fff" opacity={0.4}>
              <animate attributeName="opacity" values="0.2;0.6;0.2" dur={`${2 + s.d}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* Mountains */}
          {mountains.map((m, i) => (
            <polygon key={i}
              points={`${(m.x / 100) * GAME_W},${GROUND_Y} ${((m.x + m.w / 2) / 100) * GAME_W},${GROUND_Y - (m.h / 100) * GAME_H} ${((m.x + m.w) / 100) * GAME_W},${GROUND_Y}`}
              fill={m.c}
            />
          ))}

          {/* Terrain */}
          <path
            d={`M0,${GAME_H} ${terrain.map((y, x) => `L${x},${y}`).join(' ')} L${GAME_W},${GAME_H} Z`}
            fill="#111827" stroke="rgba(110,66,229,0.15)" strokeWidth={1}
          />
          {/* Terrain top glow */}
          <path
            d={terrain.map((y, x) => `${x === 0 ? 'M' : 'L'}${x},${y}`).join(' ')}
            fill="none" stroke="rgba(110,66,229,0.3)" strokeWidth={1.5}
          />

          {/* My tank */}
          {renderTank(myX, myY, 'purple', '#a855f7', isHost, myHp)}
          {/* My barrel */}
          <line
            x1={myX} y1={myY - TANK_H + 4}
            x2={myX + Math.cos((barrelAngle * Math.PI) / 180) * BARREL_LEN}
            y2={myY - TANK_H + 4 + Math.sin((barrelAngle * Math.PI) / 180) * BARREL_LEN}
            stroke="#c084fc" strokeWidth={4} strokeLinecap="round"
          />

          {/* Opponent tank */}
          {renderTank(opX, opY, 'red', '#ef4444', !isHost, opHp)}
          {/* Opponent barrel */}
          <line
            x1={opX} y1={opY - TANK_H + 4}
            x2={opX + Math.cos((opBarrelAngle * Math.PI) / 180) * BARREL_LEN}
            y2={opY - TANK_H + 4 + Math.sin((opBarrelAngle * Math.PI) / 180) * BARREL_LEN}
            stroke="#f87171" strokeWidth={4} strokeLinecap="round"
          />

          {/* Trajectory preview */}
          {preview.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={2} fill={C.cyan} opacity={0.15 + (i / preview.length) * 0.35} />
          ))}

          {/* Projectile */}
          {projPos && (
            <>
              <circle cx={projPos.x} cy={projPos.y} r={5} fill={C.yellow}>
                <animate attributeName="r" values="4;6;4" dur="0.15s" repeatCount="indefinite" />
              </circle>
              <circle cx={projPos.x} cy={projPos.y} r={12} fill={C.yellow} opacity={0.15} />
            </>
          )}

          {/* Explosions */}
          {explosions.map(e => (
            <g key={e.id}>
              <circle cx={e.x} cy={e.y} r={5} fill={e.hit ? '#ff4444' : '#64748b'}>
                <animate attributeName="r" from="5" to={e.hit ? '45' : '25'} dur="0.6s" fill="freeze" />
                <animate attributeName="opacity" from="0.9" to="0" dur="0.8s" fill="freeze" />
              </circle>
              {e.hit && (
                <text x={e.x} y={e.y - 30} textAnchor="middle" fill="#ff4444" fontSize="14" fontWeight="bold">
                  💥 TOUCHÉ !
                  <animate attributeName="y" from={e.y - 20} to={e.y - 50} dur="1s" fill="freeze" />
                  <animate attributeName="opacity" from="1" to="0" dur="1s" fill="freeze" />
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Controls */}
      {!gameOver && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16, marginTop: 12, padding: '8px 16px',
          background: C.glass, borderRadius: 16, border: `1px solid ${C.border}`,
        }}>
          {/* Angle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: 1 }}>Angle</label>
            <input type="range" min={10} max={80} value={isHost ? angle : 180 - angle}
              onChange={e => setAngle(isHost ? +e.target.value : 180 - +e.target.value)}
              disabled={!isPlayerTurn || firing}
              style={{ width: 120, accentColor: C.accent }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{isHost ? angle : 180 - angle}°</span>
          </div>

          {/* Power */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: 1 }}>Puissance</label>
            <input type="range" min={20} max={100} value={power}
              onChange={e => setPower(+e.target.value)}
              disabled={!isPlayerTurn || firing}
              style={{ width: 120, accentColor: C.yellow }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{power}%</span>
          </div>

          {/* Fire button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleFire}
            disabled={!isPlayerTurn || firing}
            style={{
              padding: '10px 24px', borderRadius: 12, fontSize: 15, fontWeight: 800,
              background: isPlayerTurn && !firing
                ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                : 'rgba(60,60,60,0.3)',
              color: '#fff', border: 'none',
              cursor: isPlayerTurn && !firing ? 'pointer' : 'not-allowed',
              opacity: isPlayerTurn && !firing ? 1 : 0.4,
              boxShadow: isPlayerTurn && !firing ? '0 4px 16px rgba(168,85,247,0.4)' : 'none',
            }}
          >⚡ FEU !</motion.button>
        </div>
      )}

      {/* Game over overlay */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)',
              zIndex: 100,
            }}
          >
            <motion.div
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              style={{
                padding: '32px 48px', borderRadius: 24, textAlign: 'center',
                background: C.glass, border: `1px solid ${C.border}`,
              }}
            >
              <p style={{ fontSize: 48, marginBottom: 8 }}>{winner === playerId ? '🏆' : '💥'}</p>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4 }}>
                {winner === playerId ? 'Victoire !' : 'Défaite...'}
              </h2>
              <p style={{ fontSize: 14, color: C.dim }}>
                {winner === playerId ? 'Tonnerre triomphant !' : 'La foudre t\'a frappé...'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
