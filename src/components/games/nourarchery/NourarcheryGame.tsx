import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Constants ────────────────────────────────────────────────────────────────

const TOTAL_ROUNDS = 3;
const ARROWS_PER_ROUND = 3;
const TARGET_RADIUS = 130;
const RINGS = [
  { r: 1.0, score: 1, color: '#e2e8f0', label: '1' },
  { r: 0.8, score: 2, color: '#93c5fd', label: '2' },
  { r: 0.6, score: 3, color: '#60a5fa', label: '3' },
  { r: 0.4, score: 5, color: '#f59e0b', label: '5' },
  { r: 0.2, score: 8, color: '#ef4444', label: '8' },
  { r: 0.08, score: 10, color: '#fbbf24', label: '10' },
];

const C = {
  bg: 'linear-gradient(180deg, #0f1b12 0%, #162215 40%, #0d1a10 100%)',
  glass: 'rgba(15, 27, 18, 0.8)',
  border: 'rgba(74, 222, 128, 0.2)',
  accent: '#4ade80',
  gold: '#fbbf24',
  text: '#d1fae5',
  dim: 'rgba(74, 222, 128, 0.5)',
};

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';

// Deterministic wind per round (same for both players)
function getWind(gameId: string, round: number): { x: number; y: number; label: string } {
  let h = 0;
  const s = `${gameId}-r${round}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  const wx = ((h & 0xff) / 255 - 0.5) * 2;
  const wy = (((h >> 8) & 0xff) / 255 - 0.5) * 2;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const a = Math.atan2(-wy, wx);
  const idx = Math.round(((a + Math.PI) / (Math.PI * 2)) * 8) % 8;
  const spd = Math.sqrt(wx * wx + wy * wy);
  return { x: wx * 15, y: wy * 15, label: `${dirs[idx]} ${(spd * 10).toFixed(0)} km/h` };
}

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  gameId: string; playerId: string; opponentId: string;
  isPlayerTurn: boolean; gameState: any;
  onMove: (data: any) => void; onGameOver: (data: any) => void;
}

export default function NourarcheryGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: Props) {
  const [round, setRound] = useState(0);
  const [arrowInRound, setArrowInRound] = useState(0);
  const [myScores, setMyScores] = useState<number[]>([]); // per-arrow
  const [opScores, setOpScores] = useState<number[]>([]);
  const [myArrows, setMyArrows] = useState<{ x: number; y: number; score: number }[]>([]);
  const [aiming, setAiming] = useState(false);
  const [aimPos, setAimPos] = useState({ x: 0, y: 0 });
  const [landed, setLanded] = useState<{ x: number; y: number; score: number } | null>(null);
  const [gameOver, setGameOverState] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showScore, setShowScore] = useState<number | null>(null);

  const targetRef = useRef<HTMLDivElement>(null);

  const totalMyScore = myScores.reduce((a, b) => a + b, 0);
  const totalOpScore = opScores.reduce((a, b) => a + b, 0);
  const totalArrows = TOTAL_ROUNDS * ARROWS_PER_ROUND;
  const wind = useMemo(() => getWind(gameId, round), [gameId, round]);
  const myArrowCount = myScores.length;
  const allMyArrowsDone = myArrowCount >= totalArrows;

  // ── Process opponent's moves ───────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const move = gameState.lastMove;
    if (move.playerId === playerId || move.type !== 'arrow') return;

    setOpScores(prev => [...prev, move.score]);
  }, [gameState?.lastMove]);

  // ── Check game over ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!allMyArrowsDone) return;
    // Check if opponent also done
    if (opScores.length < totalArrows) return;

    setGameOverState(true);
    const myTotal = myScores.reduce((a, b) => a + b, 0);
    const opTotal = opScores.reduce((a, b) => a + b, 0);
    const w = myTotal > opTotal ? playerId : myTotal < opTotal ? opponentId : null;
    setWinner(w);
    if (w === playerId) onGameOver({ winner_id: playerId });
  }, [myScores, opScores, allMyArrowsDone, totalArrows]);

  // ── Aiming ─────────────────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isPlayerTurn || gameOver || allMyArrowsDone) return;
    const rect = targetRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAiming(true);
    setAimPos({ x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 });
  }, [isPlayerTurn, gameOver, allMyArrowsDone]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!aiming) return;
    const rect = targetRef.current?.getBoundingClientRect();
    if (!rect) return;
    setAimPos({ x: e.clientX - rect.left - rect.width / 2, y: e.clientY - rect.top - rect.height / 2 });
  }, [aiming]);

  const handlePointerUp = useCallback(() => {
    if (!aiming) return;
    setAiming(false);

    // Apply wind drift
    const finalX = aimPos.x + wind.x;
    const finalY = aimPos.y + wind.y;

    // Score
    const dist = Math.sqrt(finalX * finalX + finalY * finalY);
    const ratio = dist / TARGET_RADIUS;
    let score = 0;
    for (const ring of RINGS) {
      if (ratio <= ring.r) score = ring.score;
    }

    const arrow = { x: finalX, y: finalY, score };
    setMyArrows(prev => [...prev, arrow]);
    setMyScores(prev => [...prev, score]);
    setLanded(arrow);
    setShowScore(score);
    setTimeout(() => { setShowScore(null); setLanded(null); }, 1200);

    // Advance round/arrow
    const nextArrow = arrowInRound + 1;
    if (nextArrow >= ARROWS_PER_ROUND) {
      setArrowInRound(0);
      setRound(prev => prev + 1);
      // Clear arrows for next round
      setTimeout(() => setMyArrows([]), 1500);
    } else {
      setArrowInRound(nextArrow);
    }

    // Send to opponent
    onMove({ type: 'arrow', score, x: finalX, y: finalY, round, arrowInRound: nextArrow });
  }, [aiming, aimPos, wind, round, arrowInRound, onMove]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: C.bg, fontFamily: font, padding: 16,
      userSelect: 'none',
    }}>
      {/* Header */}
      <motion.h1
        initial={{ y: -15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          fontSize: 22, fontWeight: 900, marginBottom: 4,
          background: 'linear-gradient(135deg, #4ade80, #fbbf24)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}
      >🏹 NOUR ARCHERY</motion.h1>

      {/* Scores */}
      <div style={{
        display: 'flex', gap: 24, marginBottom: 8, alignItems: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase' }}>Toi</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.accent }}>{totalMyScore}</div>
        </div>
        <div style={{
          fontSize: 12, fontWeight: 700, color: C.dim,
          padding: '4px 12px', borderRadius: 10, background: C.glass, border: `1px solid ${C.border}`,
        }}>
          Round {Math.min(round + 1, TOTAL_ROUNDS)}/{TOTAL_ROUNDS} • Flèche {Math.min(arrowInRound + 1, ARROWS_PER_ROUND)}/{ARROWS_PER_ROUND}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase' }}>Adversaire</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#ef4444' }}>{totalOpScore}</div>
        </div>
      </div>

      {/* Wind */}
      <div style={{
        fontSize: 12, fontWeight: 600, color: C.dim, marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>🌬️</span>
        <span>{wind.label}</span>
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          background: C.accent, transform: `translate(${wind.x / 2}px, ${wind.y / 2}px)`,
        }} />
      </div>

      {/* Turn indicator */}
      <div style={{
        padding: '4px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, marginBottom: 10,
        background: gameOver ? 'rgba(52,199,89,0.12)' : isPlayerTurn ? 'rgba(74,222,128,0.12)' : 'rgba(100,100,100,0.1)',
        color: gameOver ? '#34C759' : isPlayerTurn ? C.accent : '#8e8e93',
        border: `1px solid ${gameOver ? 'rgba(52,199,89,0.3)' : isPlayerTurn ? C.border : 'rgba(100,100,100,0.15)'}`,
      }}>
        {gameOver
          ? (winner === playerId ? '🏆 Victoire !' : winner === null ? '🤝 Égalité !' : '😔 Défaite...')
          : allMyArrowsDone
            ? '⏳ En attente de l\'adversaire...'
            : isPlayerTurn ? '🎯 Vise et tire !' : '⏳ L\'adversaire tire...'}
      </div>

      {/* Target area */}
      <div
        ref={targetRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'relative', width: TARGET_RADIUS * 2 + 40, height: TARGET_RADIUS * 2 + 40,
          borderRadius: 24, background: C.glass, border: `1px solid ${C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isPlayerTurn && !gameOver && !allMyArrowsDone ? 'crosshair' : 'default',
          touchAction: 'none',
          boxShadow: `0 0 40px rgba(74,222,128,0.08)`,
        }}
      >
        {/* Rings */}
        <svg width={TARGET_RADIUS * 2 + 40} height={TARGET_RADIUS * 2 + 40}
          viewBox={`0 0 ${TARGET_RADIUS * 2 + 40} ${TARGET_RADIUS * 2 + 40}`}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {RINGS.map((ring, i) => (
            <circle
              key={i}
              cx={TARGET_RADIUS + 20} cy={TARGET_RADIUS + 20}
              r={TARGET_RADIUS * ring.r}
              fill="none" stroke={ring.color} strokeWidth={2} opacity={0.4}
            />
          ))}
          {/* Bullseye */}
          <circle cx={TARGET_RADIUS + 20} cy={TARGET_RADIUS + 20} r={TARGET_RADIUS * 0.08}
            fill="rgba(251,191,36,0.3)" stroke="#fbbf24" strokeWidth={1} />
          {/* Crosshair */}
          <line x1={TARGET_RADIUS + 20} y1={0} x2={TARGET_RADIUS + 20} y2={TARGET_RADIUS * 2 + 40}
            stroke="rgba(74,222,128,0.15)" strokeWidth={1} />
          <line x1={0} y1={TARGET_RADIUS + 20} x2={TARGET_RADIUS * 2 + 40} y2={TARGET_RADIUS + 20}
            stroke="rgba(74,222,128,0.15)" strokeWidth={1} />
        </svg>

        {/* Ring labels */}
        {RINGS.slice(0, 5).map((ring, i) => (
          <span key={i} style={{
            position: 'absolute', fontSize: 9, fontWeight: 700, color: ring.color,
            top: TARGET_RADIUS + 20 - TARGET_RADIUS * ring.r - 6,
            left: TARGET_RADIUS + 20 + 6,
            opacity: 0.5,
          }}>{ring.label}</span>
        ))}

        {/* Landed arrows */}
        {myArrows.map((arrow, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              left: TARGET_RADIUS + 20 + arrow.x - 6,
              top: TARGET_RADIUS + 20 + arrow.y - 6,
              width: 12, height: 12, borderRadius: '50%',
              background: arrow.score >= 8 ? '#fbbf24' : arrow.score >= 5 ? '#f59e0b' : '#4ade80',
              border: '2px solid rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 7, fontWeight: 900, color: '#000',
            }}
          >{arrow.score}</motion.div>
        ))}

        {/* Aiming cursor */}
        {aiming && (
          <motion.div
            style={{
              position: 'absolute',
              left: TARGET_RADIUS + 20 + aimPos.x - 10,
              top: TARGET_RADIUS + 20 + aimPos.y - 10,
              width: 20, height: 20, borderRadius: '50%',
              border: `2px solid ${C.gold}`,
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Score popup */}
        <AnimatePresence>
          {showScore !== null && landed && (
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 0 }}
              animate={{ scale: 1.2, opacity: 1, y: -30 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                left: TARGET_RADIUS + 20 + landed.x - 20,
                top: TARGET_RADIUS + 20 + landed.y - 20,
                fontSize: 22, fontWeight: 900,
                color: showScore >= 8 ? '#fbbf24' : showScore >= 5 ? '#f59e0b' : '#4ade80',
                textShadow: '0 0 12px rgba(0,0,0,0.8)',
                pointerEvents: 'none',
              }}
            >+{showScore}</motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Arrow scores list */}
      <div style={{
        display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 360,
      }}>
        {myScores.map((s, i) => (
          <span key={i} style={{
            width: 24, height: 24, borderRadius: 6, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700,
            background: s >= 8 ? 'rgba(251,191,36,0.2)' : s >= 5 ? 'rgba(245,158,11,0.15)' : 'rgba(74,222,128,0.12)',
            color: s >= 8 ? '#fbbf24' : s >= 5 ? '#f59e0b' : C.accent,
            border: `1px solid ${s >= 8 ? 'rgba(251,191,36,0.3)' : s >= 5 ? 'rgba(245,158,11,0.2)' : C.border}`,
          }}>{s}</span>
        ))}
        {/* Empty slots */}
        {Array.from({ length: totalArrows - myScores.length }, (_, i) => (
          <span key={`e${i}`} style={{
            width: 24, height: 24, borderRadius: 6, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: C.dim,
            background: 'rgba(15,27,18,0.4)', border: `1px solid ${C.border}`,
          }}>·</span>
        ))}
      </div>

      {/* Game Over overlay */}
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
              <p style={{ fontSize: 48, marginBottom: 8 }}>
                {winner === playerId ? '🏆' : winner === null ? '🤝' : '😔'}
              </p>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 8 }}>
                {winner === playerId ? 'Victoire !' : winner === null ? 'Égalité !' : 'Défaite...'}
              </h2>
              <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: C.dim }}>Toi</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: C.accent }}>{totalMyScore}</div>
                </div>
                <div style={{ fontSize: 20, color: C.dim, alignSelf: 'center' }}>vs</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, color: C.dim }}>Adversaire</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#ef4444' }}>{totalOpScore}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
