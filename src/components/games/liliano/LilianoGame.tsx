import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════
// LILIANO THUNDER — Artillerie Punk Rock
// Scorched Earth style — terrain destructible, vent variable, armes chaos
// Inspiré par Scorched Earth / Pocket Tanks / Worms
// ═══════════════════════════════════════════════════════════════════════════

const W = 480;
const H = 300;
const GRAVITY = 0.12;
const EXPLOSION_R = 18;
const TANK_W = 20;
const TANK_H = 10;
const MAX_HP = 100;
const PROJECTILE_STEP = 3;

const P = {
  bg: '#0a0a0a',
  neon: '#ff00ff',
  neonYellow: '#ffff00',
  neonCyan: '#00ffff',
  neonOrange: '#ff6600',
  neonGreen: '#39ff14',
  text: '#ffffff',
  dim: 'rgba(255,0,255,0.4)',
  sky: 'linear-gradient(180deg, #0a0008 0%, #1a0020 40%, #2d0030 60%, #0a0a0a 100%)',
};

function genTerrain(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  const terrain: number[] = [];
  let y = H * 0.55;
  for (let x = 0; x < W; x++) {
    const s = Math.sin(x * 0.015 + h) * 25 + Math.sin(x * 0.04 + h * 2) * 12 + Math.sin(x * 0.08 + h * 3) * 6;
    y = H * 0.55 + s;
    terrain.push(Math.max(H * 0.3, Math.min(H * 0.8, y)));
  }
  return terrain;
}

function getWind(seed: string, turn: number): number {
  let h = 0;
  const s = `${seed}-wind-${turn}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return ((h % 200) / 100) - 1; // -1 to 1
}

// ── Tank SVG ─────────────────────────────────────────────────────────────────

function TankSVG({ x, y, color, angle, hp, isMe, flash }: {
  x: number; y: number; color: string; angle: number; hp: number; isMe: boolean; flash: boolean;
}) {
  const turretLen = 16;
  const rad = (angle * Math.PI) / 180;
  const tx = x + Math.cos(rad) * turretLen;
  const ty = y - Math.sin(rad) * turretLen;

  return (
    <g>
      {/* HP bar */}
      <rect x={x - TANK_W / 2} y={y - TANK_H - 8} width={TANK_W} height={3} rx={1.5}
        fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />
      <rect x={x - TANK_W / 2} y={y - TANK_H - 8} width={TANK_W * (hp / MAX_HP)} height={3} rx={1.5}
        fill={hp > 60 ? P.neonGreen : hp > 30 ? P.neonYellow : '#ff0044'} />
      <text x={x} y={y - TANK_H - 10} textAnchor="middle" fill={P.text} fontSize={5} fontWeight={900}
        fontFamily="Impact, sans-serif">{hp}</text>

      {/* Tank body */}
      <rect x={x - TANK_W / 2} y={y - TANK_H} width={TANK_W} height={TANK_H}
        rx={3} fill={color} stroke="rgba(255,255,255,0.2)" strokeWidth={0.5}
        opacity={flash ? 0.3 : 1} />
      {/* Tracks */}
      <rect x={x - TANK_W / 2 - 1} y={y - 2} width={TANK_W + 2} height={3}
        rx={1.5} fill="rgba(0,0,0,0.6)" stroke={color} strokeWidth={0.3} />
      {/* Turret */}
      <line x1={x} y1={y - TANK_H / 2} x2={tx} y2={ty}
        stroke={color} strokeWidth={3} strokeLinecap="round" />
      <circle cx={x} cy={y - TANK_H / 2} r={3.5} fill={color}
        stroke="rgba(255,255,255,0.3)" strokeWidth={0.5} />

      {/* Lightning emblem */}
      <path d={`M ${x - 2} ${y - TANK_H + 1} L ${x + 1} ${y - TANK_H / 2} L ${x - 1} ${y - TANK_H / 2} L ${x + 2} ${y - 1}`}
        fill="none" stroke={P.neonYellow} strokeWidth={0.8} opacity={0.7} />

      {/* "ME" indicator */}
      {isMe && (
        <g>
          <motion.text animate={{ y: [y - TANK_H - 16, y - TANK_H - 18, y - TANK_H - 16] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            x={x} textAnchor="middle" fill={P.neonCyan} fontSize={5} fontWeight={900}
            fontFamily="Impact, sans-serif">▼</motion.text>
        </g>
      )}
    </g>
  );
}

// ── Explosion ────────────────────────────────────────────────────────────────

function Explosion({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g>
      {/* Fire core */}
      <motion.circle initial={{ r: 2, opacity: 1 }} animate={{ r: r, opacity: 0 }}
        transition={{ duration: 0.6 }}
        cx={x} cy={y} fill={P.neonOrange} />
      {/* Shock ring */}
      <motion.circle initial={{ r: r * 0.5, opacity: 0.8 }} animate={{ r: r * 1.5, opacity: 0 }}
        transition={{ duration: 0.8 }}
        cx={x} cy={y} fill="none" stroke={P.neonYellow} strokeWidth={2} />
      {/* Sparks */}
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const d = r * 0.8 + Math.random() * r * 0.5;
        return (
          <motion.circle key={i}
            initial={{ cx: x, cy: y, r: 1.5, opacity: 1 }}
            animate={{ cx: x + Math.cos(a) * d, cy: y + Math.sin(a) * d, r: 0, opacity: 0 }}
            transition={{ duration: 0.4 + Math.random() * 0.3 }}
            fill={[P.neonYellow, P.neonOrange, P.neon, P.neonCyan][i % 4]} />
        );
      })}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════

export default function LilianoGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: any) {
  const isHost = playerId < opponentId;
  const [terrain, setTerrain] = useState<number[]>([]);
  const [myPos, setMyPos] = useState({ x: 0, y: 0 });
  const [opPos, setOpPos] = useState({ x: 0, y: 0 });
  const [myHP, setMyHP] = useState(MAX_HP);
  const [opHP, setOpHP] = useState(MAX_HP);
  const [angle, setAngle] = useState(45);
  const [power, setPower] = useState(50);
  const [wind, setWind] = useState(0);
  const [turn, setTurn] = useState(0);
  const [firing, setFiring] = useState(false);
  const [projectile, setProjectile] = useState<{ x: number; y: number } | null>(null);
  const [explosion, setExplosion] = useState<{ x: number; y: number; r: number } | null>(null);
  const [shake, setShake] = useState(false);
  const [flash, setFlash] = useState(false);
  const [lastMsg, setLastMsg] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [win, setWin] = useState<string | null>(null);
  const [trail, setTrail] = useState<{ x: number; y: number }[]>([]);

  const raf = useRef<number>(0);
  const msgT = useRef<ReturnType<typeof setTimeout>>();

  // ── Init ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const t = genTerrain(gameId);
    setTerrain(t);

    const p1x = Math.floor(W * 0.2);
    const p2x = Math.floor(W * 0.8);
    const p1 = { x: p1x, y: t[p1x] - TANK_H / 2 };
    const p2 = { x: p2x, y: t[p2x] - TANK_H / 2 };

    if (isHost) { setMyPos(p1); setOpPos(p2); }
    else { setMyPos(p2); setOpPos(p1); }

    setWind(getWind(gameId, 0));
  }, [gameId, isHost]);

  // ── Sync ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId) return;

    if (m.type === 'fire') {
      // Animate opponent's shot
      animateShot(opPos.x, opPos.y, m.angle, m.power, wind, true);
    }
  }, [gameState?.lastMove]);

  // ── Fire logic ─────────────────────────────────────────────────────────────

  const animateShot = useCallback((sx: number, sy: number, ang: number, pow: number, w: number, isOp: boolean) => {
    setFiring(true);
    const rad = (ang * Math.PI) / 180;
    const speed = pow * 0.06;
    let vx = Math.cos(rad) * speed * (isOp && isHost ? -1 : !isOp && !isHost ? -1 : 1);
    let vy = -Math.sin(rad) * speed;
    let px = sx;
    let py = sy - TANK_H;
    const trailPts: { x: number; y: number }[] = [];

    const step = () => {
      vx += w * 0.003;
      vy += GRAVITY;
      px += vx * PROJECTILE_STEP;
      py += vy * PROJECTILE_STEP;
      trailPts.push({ x: px, y: py });
      setTrail([...trailPts.slice(-20)]);
      setProjectile({ x: px, y: py });

      // Out of bounds
      if (px < -10 || px > W + 10 || py > H + 10) {
        setProjectile(null);
        setTrail([]);
        setFiring(false);
        if (!isOp) {
          setLastMsg('💨 Perdu dans le vide !');
          if (msgT.current) clearTimeout(msgT.current);
          msgT.current = setTimeout(() => setLastMsg(null), 1500);
        }
        setTurn(t => t + 1);
        setWind(getWind(gameId, turn + 1));
        return;
      }

      // Terrain collision
      const ti = Math.round(px);
      if (ti >= 0 && ti < W && py >= terrain[ti]) {
        // Explode!
        setProjectile(null);
        setTrail([]);
        setExplosion({ x: px, y: py, r: EXPLOSION_R });
        setShake(true);
        setTimeout(() => setShake(false), 400);

        // Damage terrain
        setTerrain(prev => {
          const t = [...prev];
          for (let i = Math.max(0, ti - EXPLOSION_R); i < Math.min(W, ti + EXPLOSION_R); i++) {
            const dx = i - ti;
            const depth = Math.sqrt(EXPLOSION_R * EXPLOSION_R - dx * dx);
            t[i] = Math.max(t[i], py + depth * 0.3);
          }
          return t;
        });

        // Check tank hits
        const distMe = Math.sqrt((px - myPos.x) ** 2 + (py - myPos.y) ** 2);
        const distOp = Math.sqrt((px - opPos.x) ** 2 + (py - opPos.y) ** 2);

        if (isOp) {
          // Opponent shot hits me?
          if (distMe < EXPLOSION_R) {
            const dmg = Math.round((1 - distMe / EXPLOSION_R) * 40 + 10);
            setMyHP(prev => {
              const n = Math.max(0, prev - dmg);
              if (n <= 0) { setOver(true); setWin(opponentId); }
              return n;
            });
            setFlash(true);
            setTimeout(() => setFlash(false), 300);
            setLastMsg(`💥 -${dmg} HP !`);
          } else {
            setLastMsg('🎸 Raté !');
          }
        } else {
          // My shot hits opponent?
          const hit = distOp < EXPLOSION_R;
          const dmg = hit ? Math.round((1 - distOp / EXPLOSION_R) * 40 + 10) : 0;
          if (hit) {
            setOpHP(prev => {
              const n = Math.max(0, prev - dmg);
              if (n <= 0) { setOver(true); setWin(playerId); onGameOver({ winner_id: playerId }); }
              return n;
            });
            setLastMsg(`�� -${dmg} HP !`);
          } else {
            setLastMsg('💨 Raté...');
          }
          onMove({ type: 'fire', angle: ang, power: pow, _keepTurn: false });
        }

        if (msgT.current) clearTimeout(msgT.current);
        msgT.current = setTimeout(() => setLastMsg(null), 1800);

        setTimeout(() => {
          setExplosion(null);
          setFiring(false);
          setTurn(t => t + 1);
          setWind(getWind(gameId, turn + 1));
        }, 600);
        return;
      }

      raf.current = requestAnimationFrame(step);
    };

    raf.current = requestAnimationFrame(step);
  }, [terrain, myPos, opPos, wind, turn, gameId, playerId, opponentId, isHost, onMove, onGameOver]);

  const doFire = () => {
    if (firing || !isPlayerTurn || over) return;
    animateShot(myPos.x, myPos.y, angle, power, wind, false);
  };

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    if (msgT.current) clearTimeout(msgT.current);
  }, []);

  const terrainPath = terrain.length > 0
    ? `M 0 ${H} ${terrain.map((y, x) => `L ${x} ${y}`).join(' ')} L ${W} ${H} Z`
    : '';

  const font = "Impact, 'Arial Black', sans-serif";

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: P.bg, fontFamily: font, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '8px 12px 2px', width: '100%', display: 'flex', justifyContent: 'space-between',
        maxWidth: 520 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: P.neon, margin: 0,
            textShadow: `0 0 10px ${P.neon}, 0 0 20px ${P.neon}`, letterSpacing: 2 }}>
            ⚡ LILIANO THUNDER
          </h1>
          <div style={{ fontSize: 8, color: P.dim, letterSpacing: 3 }}>PUNK ROCK ARTILLERY</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: P.neonCyan }}>
            💨 Vent: {wind > 0 ? '→' : '←'} {Math.abs(wind).toFixed(1)}
          </div>
          <div style={{ fontSize: 10, color: P.dim }}>Tour {turn + 1}</div>
        </div>
      </div>

      {/* HP bars */}
      <div style={{ display: 'flex', gap: 16, padding: '2px 12px 4px', width: '100%', maxWidth: 520 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: P.neonGreen, letterSpacing: 2 }}>TOI</div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(57,255,20,0.2)' }}>
            <motion.div animate={{ width: `${myHP}%` }}
              style={{ height: '100%', borderRadius: 3,
                background: myHP > 60 ? P.neonGreen : myHP > 30 ? P.neonYellow : '#ff0044',
                boxShadow: `0 0 6px ${myHP > 60 ? P.neonGreen : myHP > 30 ? P.neonYellow : '#ff0044'}` }} />
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: P.neonOrange, letterSpacing: 2, textAlign: 'right' }}>ENNEMI</div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,102,0,0.2)' }}>
            <motion.div animate={{ width: `${opHP}%` }}
              style={{ height: '100%', borderRadius: 3, background: P.neonOrange,
                boxShadow: `0 0 6px ${P.neonOrange}` }} />
          </div>
        </div>
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.div key={over ? 'over' : isPlayerTurn ? 't' : 'w'} initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
          style={{ padding: '2px 14px', borderRadius: 4, fontSize: 11, fontWeight: 900,
            background: 'rgba(255,0,255,0.05)', border: `1px solid ${P.dim}`,
            color: over ? (win === playerId ? P.neonGreen : '#ff0044') : isPlayerTurn ? P.neon : '#555',
            textShadow: over || isPlayerTurn ? `0 0 8px currentColor` : 'none', marginBottom: 2,
          }}>
          {over ? (win === playerId ? '🏆 VICTOIRE !!' : '💀 DÉFAITE...') : isPlayerTurn ? '🎯 À TOI DE TIRER !' : '⏳ TOUR ADVERSE...'}
        </motion.div>
      </AnimatePresence>

      {/* Message popup */}
      <AnimatePresence>
        {lastMsg && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
            style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)',
              padding: '6px 18px', borderRadius: 8, fontSize: 16, fontWeight: 900, zIndex: 20,
              background: 'rgba(0,0,0,0.8)', border: `2px solid ${P.neon}`,
              color: lastMsg.includes('HP') ? P.neonOrange : P.dim,
              textShadow: `0 0 10px currentColor`,
            }}>
            {lastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Battlefield */}
      <motion.div animate={shake ? { x: [0, -4, 4, -3, 3, 0], y: [0, 2, -2, 1, -1, 0] } : {}}
        transition={{ duration: 0.3 }}
        style={{ width: '100%', maxWidth: 520, position: 'relative', flex: 1 }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', filter: flash ? 'brightness(2)' : 'none' }}>

          {/* Sky gradient */}
          <defs>
            <linearGradient id="skyGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#0a0008" />
              <stop offset="40%" stopColor="#1a0020" />
              <stop offset="70%" stopColor="#2d0030" />
              <stop offset="100%" stopColor="#0a0a0a" />
            </linearGradient>
          </defs>
          <rect width={W} height={H} fill="url(#skyGrad)" />

          {/* Stars */}
          {Array.from({ length: 30 }, (_, i) => (
            <circle key={i} cx={(i * 37 + 11) % W} cy={(i * 13 + 7) % (H * 0.4)}
              r={0.5 + (i % 3) * 0.3} fill="white" opacity={0.3 + (i % 5) * 0.1}>
              <animate attributeName="opacity" values={`${0.2 + (i % 3) * 0.1};${0.6 + (i % 3) * 0.1};${0.2 + (i % 3) * 0.1}`}
                dur={`${2 + i % 3}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* Terrain */}
          {terrainPath && (
            <path d={terrainPath} fill="#1a1a1a" stroke={P.neon} strokeWidth={0.5} opacity={0.7} />
          )}

          {/* Tanks */}
          <TankSVG x={myPos.x} y={myPos.y} color={P.neonCyan} angle={isHost ? angle : 180 - angle}
            hp={myHP} isMe={true} flash={flash} />
          <TankSVG x={opPos.x} y={opPos.y} color={P.neonOrange} angle={isHost ? 180 - 45 : 45}
            hp={opHP} isMe={false} flash={false} />

          {/* Projectile trail */}
          {trail.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r={0.8} fill={P.neonYellow}
              opacity={(i / trail.length) * 0.5} />
          ))}

          {/* Projectile */}
          {projectile && (
            <g>
              <circle cx={projectile.x} cy={projectile.y} r={2.5} fill={P.neonYellow} />
              <circle cx={projectile.x} cy={projectile.y} r={4} fill="none"
                stroke={P.neonYellow} strokeWidth={0.5} opacity={0.4}>
                <animate attributeName="r" from="4" to="8" dur="0.3s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.4" to="0" dur="0.3s" repeatCount="indefinite" />
              </circle>
            </g>
          )}

          {/* Explosion */}
          {explosion && <Explosion x={explosion.x} y={explosion.y} r={explosion.r} />}
        </svg>
      </motion.div>

      {/* Controls */}
      {!over && (
        <div style={{ padding: '6px 12px 14px', width: '100%', maxWidth: 520 }}>
          {/* Angle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: P.dim, width: 50 }}>ANGLE</span>
            <input type="range" min={5} max={85} value={angle}
              onChange={e => setAngle(Number(e.target.value))}
              disabled={!isPlayerTurn || firing}
              style={{ flex: 1, accentColor: P.neon }} />
            <span style={{ fontSize: 12, color: P.neon, width: 30, textAlign: 'right',
              textShadow: `0 0 6px ${P.neon}` }}>{angle}°</span>
          </div>
          {/* Power */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: P.dim, width: 50 }}>POWER</span>
            <input type="range" min={10} max={100} value={power}
              onChange={e => setPower(Number(e.target.value))}
              disabled={!isPlayerTurn || firing}
              style={{ flex: 1, accentColor: P.neonYellow }} />
            <span style={{ fontSize: 12, color: P.neonYellow, width: 30, textAlign: 'right',
              textShadow: `0 0 6px ${P.neonYellow}` }}>{power}%</span>
          </div>
          {/* Fire button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={doFire}
            disabled={!isPlayerTurn || firing}
            style={{ width: '100%', padding: '10px 0', borderRadius: 8, fontSize: 16, fontWeight: 900,
              fontFamily: font, letterSpacing: 4,
              background: isPlayerTurn && !firing ? P.neon : '#333',
              color: isPlayerTurn && !firing ? '#000' : '#666',
              border: `2px solid ${isPlayerTurn && !firing ? P.neon : '#333'}`,
              cursor: isPlayerTurn && !firing ? 'pointer' : 'not-allowed',
              boxShadow: isPlayerTurn && !firing ? `0 0 20px ${P.neon}, 0 0 40px rgba(255,0,255,0.3)` : 'none',
              textShadow: isPlayerTurn && !firing ? 'none' : 'none',
            }}>
            ⚡ FIRE ⚡
          </motion.button>
        </div>
      )}
    </div>
  );
}
