import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════
// NOUR PIGEON — Tir aux Pigeons d'Argile
//
// Stand de tir en pleine campagne, ciel bleu, herbe verte
// Pigeons d'argile lancés en arc — tape pour tirer au bon moment !
// Scoring : touché = points selon distance du centre du pigeon
// ═══════════════════════════════════════════════════════════════════════════

const ROUNDS = 5;
const SHOTS_PER_ROUND = 3;

const P = {
  sky1: '#4a90d9',
  sky2: '#87ceeb',
  sky3: '#b8dff0',
  grass1: '#2d5a1e',
  grass2: '#3a7a28',
  grass3: '#4a8a34',
  wood: '#6b4226',
  woodLight: '#8b5e3c',
  orange: '#e8762a',
  orangeGlow: 'rgba(232,118,42,0.3)',
  clay: '#c45a20',
  clayDark: '#8b3a10',
  hit: '#ff4444',
  miss: '#888888',
  gold: '#d4a853',
  white: '#f0f0f0',
  text: '#2a1a0a',
  dim: 'rgba(42,26,10,0.4)',
};

// ── Clay Pigeon SVG ─────────────────────────────────────────────────────────

function ClayPigeon({ cx, cy, r, breaking }: {
  cx: number; cy: number; r: number; breaking: boolean;
}) {
  if (breaking) {
    // Shatter into fragments
    return (
      <g>
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
          const dist = r * 0.5 + Math.random() * r;
          return (
            <motion.g key={i}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{
                x: Math.cos(angle) * dist * 2,
                y: Math.sin(angle) * dist * 2 + dist,
                opacity: 0,
              }}
              transition={{ duration: 0.6, ease: 'easeOut' }}>
              <ellipse
                cx={cx} cy={cy}
                rx={r * 0.25 + Math.random() * r * 0.15}
                ry={r * 0.12 + Math.random() * r * 0.08}
                fill={P.clay}
                transform={`rotate(${Math.random() * 360}, ${cx}, ${cy})`}
              />
            </motion.g>
          );
        })}
        {/* Puff cloud */}
        <motion.circle initial={{ r: r * 0.5, opacity: 0.6 }} animate={{ r: r * 3, opacity: 0 }}
          transition={{ duration: 0.5 }}
          cx={cx} cy={cy} fill="rgba(200,160,120,0.3)" />
      </g>
    );
  }

  return (
    <g>
      {/* Shadow */}
      <ellipse cx={cx + 0.3} cy={cy + 0.3} rx={r} ry={r * 0.4} fill="rgba(0,0,0,0.15)" />
      {/* Main disc */}
      <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.4} fill={P.clay} stroke={P.clayDark} strokeWidth={0.3} />
      {/* Top highlight */}
      <ellipse cx={cx - r * 0.2} cy={cy - r * 0.1} rx={r * 0.5} ry={r * 0.15}
        fill="rgba(255,200,150,0.3)" />
      {/* Center ring */}
      <ellipse cx={cx} cy={cy} rx={r * 0.4} ry={r * 0.15}
        fill="none" stroke={P.clayDark} strokeWidth={0.2} opacity={0.5} />
    </g>
  );
}

// ── Shotgun ──────────────────────────────────────────────────────────────────

function Shotgun({ recoil }: { recoil: boolean }) {
  return (
    <motion.g animate={recoil ? { y: [0, -2, 0.5, 0] } : {}} transition={{ duration: 0.15 }}>
      {/* Barrels */}
      <rect x={44} y={86} width={12} height={3} rx={0.5}
        fill="#444" stroke="#333" strokeWidth={0.3} />
      <rect x={44} y={89.5} width={12} height={3} rx={0.5}
        fill="#555" stroke="#333" strokeWidth={0.3} />
      {/* Barrel openings */}
      <ellipse cx={44} cy={87.5} rx={0.6} ry={1.2} fill="#222" />
      <ellipse cx={44} cy={91} rx={0.6} ry={1.2} fill="#222" />
      {/* Stock */}
      <path d={`M 56 86 Q 62 86, 66 88 Q 70 90, 72 93 L 68 94 Q 65 91, 60 90 Q 57 89.5, 56 92.5 Z`}
        fill={P.wood} stroke={P.woodLight} strokeWidth={0.3} />
      {/* Stock grain */}
      <path d={`M 58 87.5 Q 63 88, 67 90`}
        fill="none" stroke="rgba(139,94,60,0.3)" strokeWidth={0.3} />
      {/* Trigger guard */}
      <path d={`M 57 89 Q 57 91, 58 92 L 59 91 Q 58 90, 58 89 Z`}
        fill="#333" />
      {/* Muzzle flash on recoil */}
      {recoil && (
        <g>
          <circle cx={43} cy={87.5} r={2} fill="rgba(255,200,50,0.6)" />
          <circle cx={43} cy={91} r={2} fill="rgba(255,200,50,0.6)" />
          <circle cx={42} cy={89} r={3.5} fill="rgba(255,150,30,0.3)" />
        </g>
      )}
    </motion.g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════

interface Pigeon {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  peakY: number;
  speed: number;
  launched: boolean;
  hit: boolean;
  missed: boolean;
  t: number;
}

function makePigeon(id: number, wind: number): Pigeon {
  const fromLeft = Math.random() > 0.5;
  const startX = fromLeft ? -5 : 105;
  const targetX = fromLeft ? 80 + Math.random() * 25 : -5 - Math.random() * 25;
  return {
    id,
    startX,
    startY: 70 + Math.random() * 10,
    targetX,
    peakY: 15 + Math.random() * 25,
    speed: 0.006 + Math.random() * 0.004,
    launched: false,
    hit: false,
    missed: false,
    t: 0,
  };
}

function pigeonPos(p: Pigeon): { x: number; y: number } {
  const t = p.t;
  const x = p.startX + (p.targetX - p.startX) * t;
  const y = p.startY + (p.peakY - p.startY) * Math.sin(t * Math.PI);
  return { x, y };
}

export default function NourarcheryGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: any) {
  const [round, setRound] = useState(1);
  const [shot, setShot] = useState(1);
  const [myScore, setMyScore] = useState(0);
  const [opScore, setOpScore] = useState(0);
  const [pigeon, setPigeon] = useState<Pigeon | null>(null);
  const [firing, setFiring] = useState(false);
  const [recoil, setRecoil] = useState(false);
  const [hitEffect, setHitEffect] = useState<{x: number; y: number; score: number} | null>(null);
  const [missEffect, setMissEffect] = useState(false);
  const [wind, setWind] = useState(0);
  const [over, setOver] = useState(false);
  const [win, setWin] = useState<string | null>(null);
  const [opInfo, setOpInfo] = useState<string | null>(null);
  const [crosshair, setCrosshair] = useState({ x: 50, y: 50 });
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [launching, setLaunching] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const raf = useRef<number>(0);
  const infoT = useRef<ReturnType<typeof setTimeout>>();
  const launchT = useRef<ReturnType<typeof setTimeout>>();

  // Deterministic wind per round
  useEffect(() => {
    let h = 0;
    const seed = `${gameId}-${round}`;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    setWind(((h % 100) / 100) * 6 - 3);
  }, [gameId, round]);

  // Launch pigeon when it's player turn
  useEffect(() => {
    if (!isPlayerTurn || over || firing || pigeon?.launched) return;
    const delay = 500 + Math.random() * 1000;
    setLaunching(true);
    launchT.current = setTimeout(() => {
      const p = makePigeon(round * 10 + shot, wind);
      p.launched = true;
      setPigeon(p);
      setLaunching(false);
    }, delay);
    return () => { if (launchT.current) clearTimeout(launchT.current); };
  }, [isPlayerTurn, over, firing, round, shot, pigeon?.launched, wind]);

  // Animate pigeon flight
  useEffect(() => {
    if (!pigeon || !pigeon.launched || pigeon.hit || pigeon.missed) return;

    const animate = () => {
      setPigeon(prev => {
        if (!prev || prev.hit || prev.missed) return prev;
        const nextT = prev.t + prev.speed;
        if (nextT >= 1) {
          // Pigeon escaped
          return { ...prev, t: 1, missed: true };
        }
        return { ...prev, t: nextT };
      });
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [pigeon?.launched, pigeon?.hit, pigeon?.missed]);

  // Handle pigeon miss (escaped)
  useEffect(() => {
    if (!pigeon?.missed || firing) return;
    setMissEffect(true);
    setRoundScores(prev => [...prev, 0]);

    onMove({
      type: 'shoot', round, arrow: shot, score: 0,
      _keepTurn: shot < SHOTS_PER_ROUND,
    });

    setTimeout(() => {
      setMissEffect(false);
      setPigeon(null);
      setFiring(false);
      if (shot < SHOTS_PER_ROUND) {
        setShot(s => s + 1);
      } else if (round < ROUNDS) {
        setRound(r => r + 1); setShot(1); setRoundScores([]);
      }
    }, 800);
  }, [pigeon?.missed, firing, round, shot, onMove]);

  // ── Sync ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId) return;

    if (m.type === 'shoot') {
      setOpScore(prev => prev + m.score);
      setOpInfo(m.score > 0 ? `🎯 ${m.score} pts` : '💨 Raté !');
      if (infoT.current) clearTimeout(infoT.current);
      infoT.current = setTimeout(() => setOpInfo(null), 1500);

      if (m.round === ROUNDS && m.arrow === SHOTS_PER_ROUND) {
        setTimeout(() => {
          const finalOp = opScore + m.score;
          if (myScore > finalOp) {
            setOver(true); setWin(playerId); onGameOver({ winner_id: playerId });
          } else if (finalOp > myScore) {
            setOver(true); setWin(opponentId);
          } else {
            // Tie - give win to current player as tiebreaker
            setOver(true); setWin(playerId); onGameOver({ winner_id: playerId });
          }
        }, 1000);
      }
    }
  }, [gameState?.lastMove, opScore, myScore, playerId, opponentId, onGameOver]);

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    if (infoT.current) clearTimeout(infoT.current);
    if (launchT.current) clearTimeout(launchT.current);
  }, []);

  // ── Controls ──────────────────────────────────────────────────────────────

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 50, y: 50 };
    const rect = svg.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) / rect.width * 100, y: (cy - rect.top) / rect.height * 100 };
  };

  const onPointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlayerTurn || over) return;
    e.preventDefault();
    const p = getPos(e);
    setCrosshair(p);
    setShowCrosshair(true);
  };

  const onShoot = useCallback(() => {
    if (!isPlayerTurn || !pigeon || pigeon.hit || pigeon.missed || firing || over) return;
    setFiring(true);
    setRecoil(true);
    setTimeout(() => setRecoil(false), 150);

    const pos = pigeonPos(pigeon);
    const dist = Math.sqrt((crosshair.x - pos.x) ** 2 + (crosshair.y - pos.y) ** 2);

    // Spread radius — shotgun has a wide spread
    const spreadR = 8;
    let score = 0;
    if (dist < spreadR * 0.3) score = 10;
    else if (dist < spreadR * 0.5) score = 7;
    else if (dist < spreadR * 0.75) score = 5;
    else if (dist < spreadR) score = 3;

    if (score > 0) {
      setPigeon(prev => prev ? { ...prev, hit: true } : null);
      setHitEffect({ x: pos.x, y: pos.y, score });
      setMyScore(prev => prev + score);
      setRoundScores(prev => [...prev, score]);
    } else {
      // Missed — pigeon continues flying
      setRoundScores(prev => [...prev, 0]);
    }

    onMove({
      type: 'shoot', round, arrow: shot, score,
      _keepTurn: shot < SHOTS_PER_ROUND,
    });

    setTimeout(() => {
      setHitEffect(null);
      setPigeon(null);
      setFiring(false);
      if (shot < SHOTS_PER_ROUND) {
        setShot(s => s + 1);
      } else if (round < ROUNDS) {
        setRound(r => r + 1); setShot(1); setRoundScores([]);
      }
    }, score > 0 ? 800 : 500);
  }, [isPlayerTurn, pigeon, firing, over, crosshair, round, shot, onMove]);

  const pigeonVisible = pigeon && pigeon.launched && !pigeon.hit && !pigeon.missed;
  const pPos = pigeon && pigeon.launched ? pigeonPos(pigeon) : null;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: '#1a3a1a', overflow: 'hidden', touchAction: 'none',
      fontFamily: "'Georgia', 'Times New Roman', serif", position: 'relative',
    }}>

      {/* HUD Header */}
      <div style={{ padding: '8px 14px 2px', width: '100%', maxWidth: 500, zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, fontStyle: 'italic',
            color: P.gold, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
            🪶 Nour Pigeon
          </h1>
          <div style={{ fontSize: 9, color: P.dim, fontStyle: 'italic' }}>Tir aux Pigeons d'Argile</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: P.orange, fontWeight: 700 }}>
            Manche {round}/{ROUNDS} • Tir {shot}/{SHOTS_PER_ROUND}
          </div>
          <div style={{ fontSize: 9, color: P.dim, fontStyle: 'italic' }}>
            Vent : {wind > 0 ? '→' : wind < 0 ? '←' : '○'} {Math.abs(wind).toFixed(1)} km/h
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 30, padding: '2px 0 4px', width: '100%', zIndex: 2 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: P.dim, letterSpacing: 2, fontWeight: 700 }}>TOI</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: P.orange,
            textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{myScore}</div>
        </div>
        <div style={{ fontSize: 12, color: P.dim, alignSelf: 'center', fontStyle: 'italic' }}>vs</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: P.dim, letterSpacing: 2, fontWeight: 700 }}>ADV</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#c44',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{opScore}</div>
        </div>
      </div>

      {/* Round scores */}
      {roundScores.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 2, zIndex: 2 }}>
          {roundScores.map((s, i) => (
            <span key={i} style={{ padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
              background: s > 0 ? 'rgba(232,118,42,0.15)' : 'rgba(0,0,0,0.1)',
              color: s > 0 ? P.orange : '#666',
              border: `1px solid ${s > 0 ? 'rgba(232,118,42,0.2)' : 'rgba(0,0,0,0.05)'}`,
            }}>{s > 0 ? `+${s}` : '✗'}</span>
          ))}
        </div>
      )}

      {/* Status */}
      <motion.div key={over ? 'o' : isPlayerTurn ? 't' : 'w'} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '2px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, fontStyle: 'italic', marginBottom: 2, zIndex: 2,
          background: over ? 'rgba(52,199,89,0.1)' : isPlayerTurn ? 'rgba(232,118,42,0.08)' : 'rgba(80,80,80,0.06)',
          color: over ? (win === playerId ? '#4ade80' : '#c44') : isPlayerTurn ? P.orange : '#555',
          border: `1px solid ${over ? 'rgba(52,199,89,0.15)' : isPlayerTurn ? 'rgba(232,118,42,0.12)' : 'rgba(80,80,80,0.06)'}`,
        }}>
        {over ? (win === playerId ? '🏆 Victoire !' : '💔 Défaite…')
          : isPlayerTurn
            ? (launching ? '🪶 Pigeon en approche…' : pigeon?.launched ? '🎯 Tire !' : '⏳ Prépare-toi…')
            : '⏳ Tour adverse…'}
      </motion.div>

      {/* Opponent info */}
      <AnimatePresence>
        {opInfo && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ padding: '2px 10px', borderRadius: 6, fontSize: 10, zIndex: 2, fontWeight: 700,
              color: opInfo.includes('Raté') ? '#888' : '#c44',
              background: opInfo.includes('Raté') ? 'rgba(0,0,0,0.05)' : 'rgba(200,50,50,0.06)',
              border: `1px solid ${opInfo.includes('Raté') ? 'rgba(0,0,0,0.05)' : 'rgba(200,50,50,0.1)'}`,
            }}>
            {opInfo}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game SVG */}
      <div style={{ flex: 1, width: '100%', maxWidth: 500, position: 'relative', zIndex: 1 }}>
        <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', cursor: isPlayerTurn && pigeon?.launched ? 'crosshair' : 'default' }}
          onMouseMove={onPointerMove} onTouchMove={onPointerMove}
          onClick={onShoot} onTouchEnd={(e) => { e.preventDefault(); onShoot(); }}>

          <defs>
            {/* Sky gradient */}
            <linearGradient id="pigeonSky" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor={P.sky1} />
              <stop offset="50%" stopColor={P.sky2} />
              <stop offset="80%" stopColor={P.sky3} />
              <stop offset="100%" stopColor="#c8e8c0" />
            </linearGradient>
            {/* Ground */}
            <linearGradient id="pigeonGround" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor={P.grass2} />
              <stop offset="40%" stopColor={P.grass1} />
              <stop offset="100%" stopColor="#1a3a12" />
            </linearGradient>
          </defs>

          {/* Sky */}
          <rect width="100" height="100" fill="url(#pigeonSky)" />

          {/* Clouds */}
          {[
            { cx: 15, cy: 12, rx: 12, ry: 4 },
            { cx: 70, cy: 8, rx: 15, ry: 5 },
            { cx: 45, cy: 18, rx: 8, ry: 3 },
            { cx: 88, cy: 22, rx: 10, ry: 3.5 },
          ].map((c, i) => (
            <g key={i}>
              <ellipse cx={c.cx} cy={c.cy} rx={c.rx} ry={c.ry} fill="rgba(255,255,255,0.6)" />
              <ellipse cx={c.cx - c.rx * 0.3} cy={c.cy - c.ry * 0.3} rx={c.rx * 0.6} ry={c.ry * 0.7}
                fill="rgba(255,255,255,0.4)" />
            </g>
          ))}

          {/* Distant trees on horizon */}
          {[8, 18, 25, 35, 42, 55, 62, 72, 80, 90].map((tx, i) => (
            <g key={i}>
              <ellipse cx={tx} cy={72} rx={3 + (i % 3)} ry={5 + (i % 4)} fill={`rgba(30,${70 + i * 5},20,0.6)`} />
            </g>
          ))}

          {/* Ground */}
          <rect x={0} y={72} width={100} height={28} fill="url(#pigeonGround)" />

          {/* Ground texture — grass tufts */}
          {[5, 12, 22, 30, 38, 48, 58, 65, 75, 85, 95].map((gx, i) => (
            <g key={i}>
              <line x1={gx} y1={74 + (i % 3)} x2={gx - 1} y2={72 + (i % 3)}
                stroke="rgba(70,140,50,0.4)" strokeWidth={0.4} />
              <line x1={gx + 0.5} y1={74 + (i % 3)} x2={gx + 1.5} y2={71.5 + (i % 3)}
                stroke="rgba(60,130,40,0.3)" strokeWidth={0.3} />
            </g>
          ))}

          {/* Trap machine */}
          <g>
            <rect x={46} y={73} width={8} height={4} rx={0.5} fill="#555" stroke="#444" strokeWidth={0.3} />
            <rect x={48} y={71.5} width={4} height={2} rx={0.3} fill="#666" />
            <ellipse cx={50} cy={73} rx={3} ry={0.8} fill="#444" />
          </g>

          {/* Wind indicator */}
          <g transform="translate(50, 68)">
            <rect x={-14} y={-3} width={28} height={6} rx={3} fill="rgba(0,0,0,0.15)" />
            <text x={0} y={1.5} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={3}
              fontFamily="Georgia, serif" fontWeight={700}>
              {wind > 0 ? '→' : wind < 0 ? '←' : '○'} Vent {Math.abs(wind).toFixed(1)}
            </text>
          </g>

          {/* ── Flying pigeon ── */}
          {pigeonVisible && pPos && (
            <ClayPigeon cx={pPos.x} cy={pPos.y} r={3.5} breaking={false} />
          )}

          {/* ── Hit effect ── */}
          <AnimatePresence>
            {hitEffect && (
              <g>
                <ClayPigeon cx={hitEffect.x} cy={hitEffect.y} r={3.5} breaking={true} />
                <motion.text initial={{ opacity: 0, y: hitEffect.y }} animate={{ opacity: 1, y: hitEffect.y - 8 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  x={hitEffect.x} textAnchor="middle"
                  fill={hitEffect.score >= 7 ? '#ff4444' : P.orange}
                  fontSize={hitEffect.score === 10 ? 7 : 5} fontFamily="Georgia, serif" fontWeight={900}
                  stroke="rgba(255,255,255,0.3)" strokeWidth={0.2}>
                  +{hitEffect.score}
                </motion.text>
              </g>
            )}
          </AnimatePresence>

          {/* ── Miss text ── */}
          <AnimatePresence>
            {missEffect && (
              <motion.text initial={{ opacity: 0, y: 40 }} animate={{ opacity: 0.8, y: 35 }}
                exit={{ opacity: 0, y: 30 }}
                transition={{ duration: 0.4 }}
                x={50} textAnchor="middle" fill="rgba(255,255,255,0.5)"
                fontSize={4} fontFamily="Georgia, serif" fontWeight={700} fontStyle="italic">
                Envolé !
              </motion.text>
            )}
          </AnimatePresence>

          {/* Shotgun */}
          <Shotgun recoil={recoil} />

          {/* Crosshair */}
          {showCrosshair && isPlayerTurn && pigeon?.launched && (
            <g>
              <circle cx={crosshair.x} cy={crosshair.y} r={4} fill="none"
                stroke="rgba(255,255,255,0.5)" strokeWidth={0.3} />
              <circle cx={crosshair.x} cy={crosshair.y} r={1.5} fill="none"
                stroke="rgba(255,255,255,0.6)" strokeWidth={0.2} />
              <line x1={crosshair.x - 6} y1={crosshair.y} x2={crosshair.x - 2} y2={crosshair.y}
                stroke="rgba(255,255,255,0.5)" strokeWidth={0.3} />
              <line x1={crosshair.x + 2} y1={crosshair.y} x2={crosshair.x + 6} y2={crosshair.y}
                stroke="rgba(255,255,255,0.5)" strokeWidth={0.3} />
              <line x1={crosshair.x} y1={crosshair.y - 6} x2={crosshair.x} y2={crosshair.y - 2}
                stroke="rgba(255,255,255,0.5)" strokeWidth={0.3} />
              <line x1={crosshair.x} y1={crosshair.y + 2} x2={crosshair.x} y2={crosshair.y + 6}
                stroke="rgba(255,255,255,0.5)" strokeWidth={0.3} />
              <circle cx={crosshair.x} cy={crosshair.y} r={0.5} fill="rgba(255,50,50,0.7)" />
            </g>
          )}

          {/* Instruction */}
          {isPlayerTurn && !pigeon?.launched && !firing && !over && !launching && (
            <motion.text animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity }}
              x="50" y="55" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="3"
              fontFamily="Georgia, serif" fontStyle="italic">
              Le pigeon arrive… prépare-toi !
            </motion.text>
          )}
          {isPlayerTurn && pigeon?.launched && !pigeon.hit && !pigeon.missed && !firing && (
            <motion.text animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1, repeat: Infinity }}
              x="50" y="96" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="2.8"
              fontFamily="Georgia, serif" fontWeight={700}>
              🎯 Clique pour tirer !
            </motion.text>
          )}
        </svg>
      </div>
    </div>
  );
}
