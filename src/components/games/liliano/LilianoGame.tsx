import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── LILIANO THUNDER — Punk Rock Artillery ────────────────────────────────────

const GAME_W = 800;
const GAME_H = 420;
const GRAVITY = 0.16;
const TANK_W = 48;
const TANK_H = 28;
const BARREL_LEN = 26;
const HIT_RADIUS = 42;
const MAX_HP = 4;
const POWER_MULT = 0.15;

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// ── Palette — dark neon punk ─────────────────────────────────────────────────

const C = {
  bg1: '#08060e', bg2: '#0c0814',
  neon1: '#e11d48', neon2: '#f43f5e', // hot pink/red
  neon3: '#a855f7', neon4: '#c084fc', // purple
  electric: '#22d3ee',
  yellow: '#fbbf24',
  white: '#e2e8f0',
  dim: '#4b3a5e',
  glass: 'rgba(12,8,20,0.85)',
  border: 'rgba(225,29,72,0.25)',
};

// Terrain generation — rougher, more chaotic
function generateTerrain(seed: number): number[] {
  const GROUND_BASE = 340;
  const t: number[] = [];
  let s = seed;
  let h = GROUND_BASE;
  for (let x = 0; x < GAME_W; x++) {
    s = ((s * 9301 + 49297) % 233280);
    if (x > 80 && x < GAME_W - 80) {
      h += ((s / 233280) - 0.5) * 5;
      // Add some craters/bumps
      if (x % 120 < 2) h += (Math.random() - 0.5) * 30;
      h = clamp(h, GROUND_BASE - 80, GROUND_BASE + 15);
    }
    t.push(h);
  }
  // Smooth less (keep it rough)
  for (let pass = 0; pass < 2; pass++) {
    for (let x = 1; x < GAME_W - 1; x++) {
      t[x] = (t[x - 1] + t[x] + t[x + 1]) / 3;
    }
  }
  return t;
}

// Particles for explosions
function spawnParticles(x: number, y: number, count: number, color: string) {
  return Array.from({ length: count }, () => ({
    x, y, vx: (Math.random() - 0.5) * 8, vy: -Math.random() * 6 - 2,
    life: 1, color, size: Math.random() * 4 + 2,
  }));
}

interface Props {
  gameId: string; playerId: string; opponentId: string;
  isPlayerTurn: boolean; gameState: any;
  onMove: (data: any) => void; onGameOver: (data: any) => void;
}

export default function LilianoGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: Props) {
  const isHost = playerId < opponentId;

  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < (gameId || 'x').length; i++) h = ((h << 5) - h + (gameId || 'x').charCodeAt(i)) | 0;
    return Math.abs(h);
  }, [gameId]);

  const terrain = useMemo(() => generateTerrain(seed), [seed]);

  const myX = isHost ? 90 : GAME_W - 90;
  const opX = isHost ? GAME_W - 90 : 90;
  const myY = terrain[Math.round(myX)] || 340;
  const opY = terrain[Math.round(opX)] || 340;

  const [angle, setAngle] = useState(isHost ? 50 : 130);
  const [power, setPower] = useState(55);
  const [myHp, setMyHp] = useState(MAX_HP);
  const [opHp, setOpHp] = useState(MAX_HP);
  const [wind, setWind] = useState(() => (Math.random() - 0.5) * 0.08);
  const [firing, setFiring] = useState(false);
  const [projPos, setProjPos] = useState<{ x: number; y: number } | null>(null);
  const [explosions, setExplosions] = useState<{ x: number; y: number; hit: boolean; id: number; size: number }[]>([]);
  const [particles, setParticles] = useState<any[]>([]);
  const [screenShake, setScreenShake] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [hitFlash, setHitFlash] = useState(false);
  const [lastDamageMsg, setLastDamageMsg] = useState<string | null>(null);

  const animRef = useRef<number>(0);
  const expId = useRef(0);

  // ── Fire simulation ────────────────────────────────────────────────────────

  const fire = useCallback((fromX: number, fromY: number, a: number, p: number, w: number, targetX: number, targetY: number, isMine: boolean) => {
    const rad = (a * Math.PI) / 180;
    let vx = Math.cos(rad) * p * POWER_MULT;
    let vy = -Math.sin(rad) * p * POWER_MULT;
    let x = fromX, y = fromY - TANK_H;
    setFiring(true);

    const step = () => {
      vx += w;
      vy += GRAVITY;
      x += vx;
      y += vy;
      setProjPos({ x, y });

      // Check terrain collision
      const tx = clamp(Math.round(x), 0, GAME_W - 1);
      const hitGround = y >= (terrain[tx] || 340);
      const outOfBounds = y > GAME_H + 30 || x < -60 || x > GAME_W + 60;

      if (hitGround || outOfBounds) {
        const dist = Math.sqrt((x - targetX) ** 2 + (y - targetY) ** 2);
        const isHit = dist < HIT_RADIUS;

        expId.current++;
        const eid = expId.current;
        const size = isHit ? 60 : 30;
        setExplosions(prev => [...prev, { x, y: Math.min(y, terrain[tx] || 340), hit: isHit, id: eid, size }]);
        setParticles(spawnParticles(x, Math.min(y, terrain[tx] || 340), isHit ? 20 : 8, isHit ? C.neon1 : C.dim));

        // Screen shake!
        setScreenShake(isHit ? 8 : 3);
        setTimeout(() => setScreenShake(0), 300);

        if (isHit) {
          setHitFlash(true);
          setTimeout(() => setHitFlash(false), 200);

          if (isMine) {
            setOpHp(prev => {
              const next = prev - 1;
              setLastDamageMsg('💀 TOUCHÉ !');
              setTimeout(() => setLastDamageMsg(null), 1500);
              if (next <= 0) { setGameOver(true); setWinner(playerId); onGameOver({ winner_id: playerId }); }
              return next;
            });
          } else {
            setMyHp(prev => {
              const next = prev - 1;
              setLastDamageMsg('💥 Tu prends un coup !');
              setTimeout(() => setLastDamageMsg(null), 1500);
              if (next <= 0) { setGameOver(true); setWinner(opponentId); }
              return next;
            });
          }
        }

        setTimeout(() => {
          setExplosions(prev => prev.filter(e => e.id !== eid));
          setParticles([]);
        }, 1500);

        setFiring(false);
        setProjPos(null);
        setWind((Math.random() - 0.5) * 0.08);
        return;
      }

      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, [terrain, playerId, opponentId, onGameOver]);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  const handleFire = useCallback(() => {
    if (!isPlayerTurn || firing || gameOver) return;
    fire(myX, myY, angle, power, wind, opX, opY, true);
    onMove({ type: 'fire', angle, power, wind });
  }, [isPlayerTurn, firing, gameOver, myX, myY, angle, power, wind, opX, opY, fire, onMove]);

  // Opponent shot
  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId || m.type !== 'fire') return;
    setWind(m.wind);
    setTimeout(() => fire(opX, opY, m.angle, m.power, m.wind, myX, myY, false), 500);
  }, [gameState?.lastMove]);

  // ── Render ─────────────────────────────────────────────────────────────────

  const barrelRad = isHost ? -angle : -(180 - angle);
  const displayAngle = isHost ? angle : 180 - angle;

  const shakeX = screenShake ? (Math.random() - 0.5) * screenShake * 2 : 0;
  const shakeY = screenShake ? (Math.random() - 0.5) * screenShake * 2 : 0;

  const renderTank = (x: number, ty: number, color: string, glow: string, hp: number, isMine: boolean) => (
    <g>
      {/* Glow under tank */}
      <ellipse cx={x} cy={ty + 2} rx={TANK_W / 2 + 5} ry={6}
        fill={glow} opacity={0.15} />
      {/* Treads */}
      <rect x={x - TANK_W / 2 - 4} y={ty - 4} width={TANK_W + 8} height={9}
        rx={4} fill="#1a1225" stroke={color} strokeWidth={1} opacity={0.8} />
      {/* Body */}
      <rect x={x - TANK_W / 2} y={ty - TANK_H} width={TANK_W} height={TANK_H}
        rx={5} fill={color} stroke={glow} strokeWidth={1.5} />
      {/* Neon stripe */}
      <rect x={x - TANK_W / 2 + 3} y={ty - TANK_H / 2 - 1} width={TANK_W - 6} height={2}
        rx={1} fill={glow} opacity={0.6} />
      {/* Skull or star on body */}
      <text x={x} y={ty - TANK_H / 2 + 5} textAnchor="middle" fontSize={12} fill={glow} opacity={0.5}>
        {isMine ? '☠' : '⚡'}
      </text>
      {/* HP bars — punk style (anarchy) */}
      {Array.from({ length: MAX_HP }, (_, i) => (
        <rect key={i}
          x={x - MAX_HP * 5 + i * 10 + 2} y={ty - TANK_H - 14}
          width={8} height={6} rx={1}
          fill={i < hp ? glow : '#1a1225'}
          stroke={i < hp ? glow : '#2a2035'} strokeWidth={0.8}
          opacity={i < hp ? 1 : 0.3}
        />
      ))}
    </g>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: C.bg1, fontFamily: '-apple-system, sans-serif',
      padding: 12,
    }}>
      {/* Header — punk style */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <h1 style={{
          fontSize: 24, fontWeight: 900, letterSpacing: 2,
          background: 'linear-gradient(135deg, #e11d48, #a855f7, #22d3ee)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          textShadow: 'none',
        }}>⚡ LILIANO THUNDER ⚡</h1>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
        <span style={{
          fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
          background: gameOver ? 'rgba(52,199,89,0.12)' : isPlayerTurn ? 'rgba(225,29,72,0.12)' : 'rgba(50,50,50,0.1)',
          color: gameOver ? '#34C759' : isPlayerTurn ? C.neon2 : '#5a4a6e',
          border: `1px solid ${gameOver ? 'rgba(52,199,89,0.25)' : isPlayerTurn ? C.border : 'rgba(50,50,50,0.1)'}`,
          textTransform: 'uppercase', letterSpacing: 1,
        }}>
          {gameOver
            ? (winner === playerId ? '🏆 VICTOIRE' : '💀 DÉFAITE')
            : firing ? '💨 FEU !'
              : isPlayerTurn ? '🎯 À TOI' : '⏳ ATTENDS'}
        </span>

        {/* Wind — just a raw number, no pretty gauge */}
        <span style={{ fontSize: 11, fontWeight: 700, color: C.dim }}>
          🌬️ {wind > 0 ? '→' : '←'} {Math.abs(wind * 100).toFixed(0)}
        </span>
      </div>

      {/* Damage message */}
      <AnimatePresence>
        {lastDamageMsg && (
          <motion.div
            initial={{ scale: 2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '30%', left: '50%', transform: 'translateX(-50%)',
              fontSize: 28, fontWeight: 900, color: C.neon1, zIndex: 50,
              textShadow: `0 0 20px ${C.neon1}, 0 0 40px ${C.neon1}`,
              fontFamily: 'Impact, sans-serif', letterSpacing: 3,
            }}
          >{lastDamageMsg}</motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <div style={{
        borderRadius: 14, overflow: 'hidden', border: `2px solid ${C.border}`,
        boxShadow: `0 0 30px ${C.neon1}15, inset 0 0 60px rgba(0,0,0,0.5)`,
        background: hitFlash ? 'rgba(225,29,72,0.1)' : 'transparent',
        transition: 'background 0.1s',
      }}>
        <svg width={GAME_W} height={GAME_H}
          viewBox={`0 0 ${GAME_W} ${GAME_H}`}
          style={{
            display: 'block', background: C.bg2,
            transform: `translate(${shakeX}px, ${shakeY}px)`,
          }}
        >
          {/* Dark sky with noise */}
          <rect width={GAME_W} height={GAME_H} fill={C.bg2} />

          {/* Stars — but punk: some are colored */}
          {useMemo(() => Array.from({ length: 40 }, (_, i) => {
            const colors = [C.neon1, C.neon3, C.electric, '#fff', '#fff', '#fff'];
            return (
              <circle key={i}
                cx={Math.random() * GAME_W} cy={Math.random() * GAME_H * 0.6}
                r={Math.random() * 1.5 + 0.5}
                fill={colors[Math.floor(Math.random() * colors.length)]}
                opacity={0.3 + Math.random() * 0.4}
              />
            );
          }), [])}

          {/* Terrain — dark with neon edge */}
          <path
            d={`M0,${GAME_H} ${terrain.map((y, x) => `L${x},${y}`).join(' ')} L${GAME_W},${GAME_H} Z`}
            fill="#0e0a16"
          />
          <path
            d={terrain.map((y, x) => `${x === 0 ? 'M' : 'L'}${x},${y}`).join(' ')}
            fill="none" stroke={C.neon1} strokeWidth={1.5} opacity={0.25}
          />
          {/* Secondary glow line */}
          <path
            d={terrain.map((y, x) => `${x === 0 ? 'M' : 'L'}${x},${y + 1}`).join(' ')}
            fill="none" stroke={C.neon3} strokeWidth={0.8} opacity={0.1}
          />

          {/* My tank */}
          {renderTank(myX, myY, '#7c3aed', C.neon3, myHp, true)}
          {/* My barrel */}
          <line
            x1={myX} y1={myY - TANK_H + 5}
            x2={myX + Math.cos((barrelRad * Math.PI) / 180) * BARREL_LEN}
            y2={myY - TANK_H + 5 + Math.sin((barrelRad * Math.PI) / 180) * BARREL_LEN}
            stroke={C.neon4} strokeWidth={5} strokeLinecap="round"
          />
          {/* Muzzle glow */}
          <circle
            cx={myX + Math.cos((barrelRad * Math.PI) / 180) * BARREL_LEN}
            cy={myY - TANK_H + 5 + Math.sin((barrelRad * Math.PI) / 180) * BARREL_LEN}
            r={3} fill={C.neon4} opacity={firing ? 1 : 0.3}
          />

          {/* Opponent tank */}
          {renderTank(opX, opY, '#b91c1c', C.neon1, opHp, false)}
          <line
            x1={opX} y1={opY - TANK_H + 5}
            x2={opX + Math.cos(((isHost ? -(180 - 50) : -50) * Math.PI) / 180) * BARREL_LEN}
            y2={opY - TANK_H + 5 + Math.sin(((isHost ? -(180 - 50) : -50) * Math.PI) / 180) * BARREL_LEN}
            stroke={C.neon2} strokeWidth={5} strokeLinecap="round"
          />

          {/* NO trajectory preview — shoot blind, punk style! */}

          {/* Projectile — glowing orb */}
          {projPos && (
            <g>
              <circle cx={projPos.x} cy={projPos.y} r={10} fill={C.yellow} opacity={0.15} />
              <circle cx={projPos.x} cy={projPos.y} r={5} fill={C.yellow}>
                <animate attributeName="r" values="4;6;4" dur="0.1s" repeatCount="indefinite" />
              </circle>
              {/* Trail */}
              <circle cx={projPos.x - 3} cy={projPos.y + 2} r={3} fill={C.neon1} opacity={0.4} />
              <circle cx={projPos.x - 6} cy={projPos.y + 5} r={2} fill={C.neon3} opacity={0.2} />
            </g>
          )}

          {/* Explosions */}
          {explosions.map(e => (
            <g key={e.id}>
              {/* Shockwave ring */}
              <circle cx={e.x} cy={e.y} r={5} fill="none"
                stroke={e.hit ? C.neon1 : C.dim} strokeWidth={2}>
                <animate attributeName="r" from="5" to={`${e.size}`} dur="0.5s" fill="freeze" />
                <animate attributeName="opacity" from="0.8" to="0" dur="0.6s" fill="freeze" />
              </circle>
              {/* Inner blast */}
              <circle cx={e.x} cy={e.y} r={5}
                fill={e.hit ? C.neon1 : C.dim}>
                <animate attributeName="r" from="5" to={`${e.size * 0.6}`} dur="0.3s" fill="freeze" />
                <animate attributeName="opacity" from="0.9" to="0" dur="0.5s" fill="freeze" />
              </circle>
              {/* Flash */}
              <circle cx={e.x} cy={e.y} r={3} fill="white">
                <animate attributeName="r" from="3" to="20" dur="0.15s" fill="freeze" />
                <animate attributeName="opacity" from="1" to="0" dur="0.2s" fill="freeze" />
              </circle>
            </g>
          ))}

          {/* Particles */}
          {particles.map((p, i) => (
            <circle key={i} cx={p.x + p.vx * 8} cy={p.y + p.vy * 8}
              r={p.size} fill={p.color} opacity={0.6}>
              <animate attributeName="opacity" from="0.6" to="0" dur="0.8s" fill="freeze" />
            </circle>
          ))}
        </svg>
      </div>

      {/* Controls — raw, punk style */}
      {!gameOver && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, padding: '8px 14px',
          background: C.glass, borderRadius: 12, border: `1px solid ${C.border}`,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: C.dim, textTransform: 'uppercase', letterSpacing: 2 }}>ANGLE</span>
            <input type="range" min={10} max={80} value={displayAngle}
              onChange={e => setAngle(isHost ? +e.target.value : 180 - +e.target.value)}
              disabled={!isPlayerTurn || firing}
              style={{ width: 110, accentColor: C.neon3 }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: C.neon4 }}>{displayAngle}°</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: C.dim, textTransform: 'uppercase', letterSpacing: 2 }}>PUISSANCE</span>
            <input type="range" min={20} max={100} value={power}
              onChange={e => setPower(+e.target.value)}
              disabled={!isPlayerTurn || firing}
              style={{ width: 110, accentColor: C.neon1 }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: C.neon2 }}>{power}%</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleFire}
            disabled={!isPlayerTurn || firing}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 16, fontWeight: 900,
              background: isPlayerTurn && !firing
                ? `linear-gradient(135deg, ${C.neon1}, ${C.neon3})`
                : 'rgba(40,30,50,0.4)',
              color: '#fff', border: isPlayerTurn && !firing ? `2px solid ${C.neon2}` : '1px solid rgba(40,30,50,0.3)',
              cursor: isPlayerTurn && !firing ? 'pointer' : 'not-allowed',
              opacity: isPlayerTurn && !firing ? 1 : 0.3,
              boxShadow: isPlayerTurn && !firing ? `0 0 20px ${C.neon1}55` : 'none',
              letterSpacing: 2, textTransform: 'uppercase',
              fontFamily: 'Impact, sans-serif',
            }}
          >⚡ FEU</motion.button>
        </div>
      )}

      {/* Game Over */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.8)', zIndex: 100,
            }}
          >
            <motion.div
              initial={{ scale: 0.3, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
              style={{
                padding: '32px 48px', borderRadius: 20, textAlign: 'center',
                background: C.glass, border: `2px solid ${C.border}`,
                boxShadow: `0 0 40px ${C.neon1}33`,
              }}
            >
              <p style={{ fontSize: 52, marginBottom: 8 }}>{winner === playerId ? '⚡' : '💀'}</p>
              <h2 style={{
                fontSize: 28, fontWeight: 900, letterSpacing: 3,
                background: `linear-gradient(135deg, ${C.neon1}, ${C.neon3})`,
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                fontFamily: 'Impact, sans-serif', textTransform: 'uppercase',
              }}>
                {winner === playerId ? 'VICTOIRE' : 'DÉFAITE'}
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
