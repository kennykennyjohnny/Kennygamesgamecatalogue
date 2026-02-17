import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── NOUR ARCHERY — Immersive POV Archery ─────────────────────────────────────

const TOTAL_ROUNDS = 3;
const ARROWS_PER_ROUND = 3;
const W = 400;
const H = 550;
const TARGET_CX = W / 2;
const TARGET_CY = 200;
const TARGET_R = 100;

const RINGS = [
  { r: 1.0, score: 1,  fill: '#e2e8f0', stroke: '#cbd5e1' },
  { r: 0.82, score: 2, fill: '#dbeafe', stroke: '#93c5fd' },
  { r: 0.64, score: 3, fill: '#93c5fd', stroke: '#60a5fa' },
  { r: 0.46, score: 5, fill: '#ef4444', stroke: '#dc2626' },
  { r: 0.28, score: 8, fill: '#dc2626', stroke: '#b91c1c' },
  { r: 0.12, score: 10, fill: '#fbbf24', stroke: '#f59e0b' },
];

const C = {
  bg: '#0f1b12',
  sky: 'linear-gradient(180deg, #1a2e1c 0%, #243524 40%, #1a2e1c 100%)',
  accent: '#4ade80',
  gold: '#fbbf24',
  text: '#d1fae5',
  dim: 'rgba(74,222,128,0.5)',
  glass: 'rgba(15,27,18,0.85)',
  border: 'rgba(74,222,128,0.2)',
};

// Deterministic wind
function getWind(gameId: string, round: number): { x: number; y: number; speed: number; dir: string } {
  let h = 0;
  const s = `${gameId}-r${round}`;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  const wx = ((h & 0xff) / 255 - 0.5) * 2;
  const wy = (((h >> 8) & 0xff) / 255 - 0.5) * 2;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  const a = Math.atan2(-wy, wx);
  const idx = Math.round(((a + Math.PI) / (Math.PI * 2)) * 8) % 8;
  const speed = Math.sqrt(wx * wx + wy * wy);
  return { x: wx * 18, y: wy * 18, speed, dir: dirs[idx] };
}

interface Props {
  gameId: string; playerId: string; opponentId: string;
  isPlayerTurn: boolean; gameState: any;
  onMove: (data: any) => void; onGameOver: (data: any) => void;
}

export default function NourarcheryGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: Props) {
  const [round, setRound] = useState(0);
  const [arrowInRound, setArrowInRound] = useState(0);
  const [myScores, setMyScores] = useState<number[]>([]);
  const [opScores, setOpScores] = useState<number[]>([]);
  const [myArrows, setMyArrows] = useState<{ x: number; y: number; score: number }[]>([]);
  const [aiming, setAiming] = useState(false);
  const [aimPos, setAimPos] = useState({ x: 0, y: 0 });
  const [drawStrength, setDrawStrength] = useState(0); // 0-1 how far pulled back
  const [arrowFlight, setArrowFlight] = useState<{ t: number; targetX: number; targetY: number; score: number } | null>(null);
  const [flying, setFlying] = useState(false);
  const [showScore, setShowScore] = useState<{ x: number; y: number; score: number } | null>(null);
  const [gameOver, setGameOverState] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number>(0);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const totalMyScore = myScores.reduce((a, b) => a + b, 0);
  const totalOpScore = opScores.reduce((a, b) => a + b, 0);
  const totalArrows = TOTAL_ROUNDS * ARROWS_PER_ROUND;
  const allDone = myScores.length >= totalArrows;
  const wind = useMemo(() => getWind(gameId, round), [gameId, round]);

  // ── Opponent sync ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId || m.type !== 'arrow') return;
    setOpScores(prev => [...prev, m.score]);
  }, [gameState?.lastMove]);

  useEffect(() => {
    if (!allDone || opScores.length < totalArrows) return;
    setGameOverState(true);
    const w = totalMyScore > totalOpScore ? playerId : totalMyScore < totalOpScore ? opponentId : null;
    setWinner(w);
    if (w === playerId) onGameOver({ winner_id: playerId });
  }, [myScores, opScores, allDone, totalArrows]);

  // ── Drag-to-aim (pull back from target area) ──────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isPlayerTurn || flying || allDone || gameOver) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width * W;
    const y = (e.clientY - rect.top) / rect.height * H;
    dragStartRef.current = { x, y };
    setAiming(true);
    setAimPos({ x: x - TARGET_CX, y: y - TARGET_CY });
    setDrawStrength(0);
  }, [isPlayerTurn, flying, allDone, gameOver]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!aiming || !dragStartRef.current) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width * W;
    const y = (e.clientY - rect.top) / rect.height * H;
    // Aim is where the arrow goes (opposite of pull)
    const dx = dragStartRef.current.x - x;
    const dy = dragStartRef.current.y - y;
    setAimPos({ x: dx * 0.6, y: dy * 0.6 });
    setDrawStrength(Math.min(Math.sqrt(dx * dx + dy * dy) / 200, 1));
  }, [aiming]);

  const handlePointerUp = useCallback(() => {
    if (!aiming) return;
    setAiming(false);
    dragStartRef.current = null;

    if (drawStrength < 0.1) { setDrawStrength(0); return; } // too weak

    // Apply wind
    const fx = aimPos.x + wind.x * drawStrength;
    const fy = aimPos.y + wind.y * drawStrength;

    // Score
    const dist = Math.sqrt(fx * fx + fy * fy);
    const ratio = dist / TARGET_R;
    let score = 0;
    for (const ring of RINGS) {
      if (ratio <= ring.r) score = ring.score;
    }

    // Animate arrow flight
    setFlying(true);
    const targetX = TARGET_CX + fx;
    const targetY = TARGET_CY + fy;
    let t = 0;
    const step = () => {
      t += 0.04;
      setArrowFlight({ t: Math.min(t, 1), targetX, targetY, score });
      if (t >= 1) {
        setFlying(false);
        setArrowFlight(null);
        // Land
        setMyArrows(prev => [...prev, { x: fx, y: fy, score }]);
        setMyScores(prev => [...prev, score]);
        setShowScore({ x: targetX, y: targetY, score });
        setTimeout(() => setShowScore(null), 1200);

        const nextArr = arrowInRound + 1;
        if (nextArr >= ARROWS_PER_ROUND) {
          setArrowInRound(0);
          setRound(prev => prev + 1);
          setTimeout(() => setMyArrows([]), 1500);
        } else {
          setArrowInRound(nextArr);
        }

        onMove({ type: 'arrow', score, x: fx, y: fy, round, arrowInRound: nextArr });
        return;
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    setDrawStrength(0);
  }, [aiming, drawStrength, aimPos, wind, round, arrowInRound, onMove]);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // ── Arrow flight position ──────────────────────────────────────────────────

  let flightSvg = null;
  if (arrowFlight) {
    const { t, targetX, targetY } = arrowFlight;
    // Arrow starts from bottom center, flies to target with scaling
    const sx = W / 2, sy = H - 40;
    const cx = sx + (targetX - sx) * t;
    const cy = sy + (targetY - sy) * t;
    const scale = 1 - t * 0.6; // gets smaller as it goes away
    const arrowLen = 20 * scale;
    const angle = Math.atan2(targetY - sy, targetX - sx);

    flightSvg = (
      <g>
        {/* Arrow shaft */}
        <line
          x1={cx - Math.cos(angle) * arrowLen} y1={cy - Math.sin(angle) * arrowLen}
          x2={cx} y2={cy}
          stroke="#854d0e" strokeWidth={2.5 * scale} strokeLinecap="round"
        />
        {/* Arrowhead */}
        <polygon
          points={`${cx},${cy} ${cx - Math.cos(angle - 0.4) * 8 * scale},${cy - Math.sin(angle - 0.4) * 8 * scale} ${cx - Math.cos(angle + 0.4) * 8 * scale},${cy - Math.sin(angle + 0.4) * 8 * scale}`}
          fill={C.accent}
        />
        {/* Fletching */}
        <line
          x1={cx - Math.cos(angle) * arrowLen} y1={cy - Math.sin(angle) * arrowLen}
          x2={cx - Math.cos(angle) * arrowLen - Math.cos(angle + 0.5) * 6 * scale}
          y2={cy - Math.sin(angle) * arrowLen - Math.sin(angle + 0.5) * 6 * scale}
          stroke={C.accent} strokeWidth={1.5 * scale}
        />
        <line
          x1={cx - Math.cos(angle) * arrowLen} y1={cy - Math.sin(angle) * arrowLen}
          x2={cx - Math.cos(angle) * arrowLen - Math.cos(angle - 0.5) * 6 * scale}
          y2={cy - Math.sin(angle) * arrowLen - Math.sin(angle - 0.5) * 6 * scale}
          stroke={C.accent} strokeWidth={1.5 * scale}
        />
      </g>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: C.bg, fontFamily: '-apple-system, sans-serif',
      padding: 12, userSelect: 'none',
    }}>
      {/* Header */}
      <motion.h1
        initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          fontSize: 22, fontWeight: 900, marginBottom: 2,
          background: 'linear-gradient(135deg, #4ade80, #fbbf24)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}
      >🏹 NOUR ARCHERY</motion.h1>

      {/* Scores */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 4, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase' }}>Toi</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: C.accent }}>{totalMyScore}</div>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: C.dim, padding: '3px 10px', borderRadius: 8,
          background: C.glass, border: `1px solid ${C.border}`,
        }}>
          R{Math.min(round + 1, TOTAL_ROUNDS)} • {Math.min(arrowInRound + 1, ARROWS_PER_ROUND)}/{ARROWS_PER_ROUND}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase' }}>Adversaire</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#ef4444' }}>{totalOpScore}</div>
        </div>
      </div>

      {/* Wind + Turn */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.dim }}>
          🌬️ {wind.dir} {(wind.speed * 10).toFixed(0)} km/h
        </span>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
          background: gameOver ? 'rgba(52,199,89,0.12)' : isPlayerTurn ? 'rgba(74,222,128,0.1)' : 'rgba(80,80,80,0.08)',
          color: gameOver ? '#34C759' : isPlayerTurn ? C.accent : '#6b7280',
          border: `1px solid ${gameOver ? 'rgba(52,199,89,0.2)' : C.border}`,
        }}>
          {gameOver
            ? (winner === playerId ? '🏆 Victoire' : winner === null ? '🤝 Égalité' : '😔 Défaite')
            : allDone ? '⏳ Adversaire...'
              : isPlayerTurn ? '🎯 Tire !' : '⏳ Attends'}
        </span>
      </div>

      {/* Game area */}
      <div style={{
        borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.border}`,
        boxShadow: '0 0 30px rgba(74,222,128,0.06)',
      }}>
        <svg
          ref={svgRef}
          width={W} height={H} viewBox={`0 0 ${W} ${H}`}
          onPointerDown={handlePointerDown as any}
          onPointerMove={handlePointerMove as any}
          onPointerUp={handlePointerUp}
          style={{ display: 'block', touchAction: 'none', background: '#162215' }}
        >
          {/* Sky/forest bg */}
          <rect width={W} height={H} fill="#0f1b12" />
          {/* Trees silhouettes */}
          <polygon points="0,120 20,40 40,120" fill="#0d1a0f" opacity={0.6} />
          <polygon points="30,120 55,20 80,120" fill="#0d1a0f" opacity={0.5} />
          <polygon points={`${W - 80},120 ${W - 55},25 ${W - 30},120`} fill="#0d1a0f" opacity={0.5} />
          <polygon points={`${W - 40},120 ${W - 20},50 ${W},120`} fill="#0d1a0f" opacity={0.6} />
          {/* Ground */}
          <rect x={0} y={350} width={W} height={H - 350} fill="#14280f" opacity={0.5} />
          <path d={`M0,355 Q${W * 0.25},348 ${W * 0.5},355 T${W},355`}
            fill="none" stroke="#1a3315" strokeWidth={2} opacity={0.4} />

          {/* Target stand */}
          <rect x={TARGET_CX - 4} y={TARGET_CY + TARGET_R + 5} width={8} height={60}
            fill="#5c3c1e" rx={2} />
          <rect x={TARGET_CX - 3} y={TARGET_CY + TARGET_R + 5} width={3} height={60}
            fill="#7c5a36" rx={1} opacity={0.5} />
          <rect x={TARGET_CX - 20} y={TARGET_CY + TARGET_R + 60} width={40} height={8}
            fill="#4a2d14" rx={3} />

          {/* Target */}
          {RINGS.map((ring, i) => (
            <circle key={i} cx={TARGET_CX} cy={TARGET_CY} r={TARGET_R * ring.r}
              fill={ring.fill} stroke={ring.stroke} strokeWidth={1.5} />
          ))}
          {/* Bullseye center */}
          <circle cx={TARGET_CX} cy={TARGET_CY} r={TARGET_R * 0.04} fill="#fef3c7" />
          {/* Target shadow */}
          <ellipse cx={TARGET_CX} cy={TARGET_CY + TARGET_R + 8} rx={TARGET_R * 0.8} ry={4}
            fill="rgba(0,0,0,0.2)" />

          {/* Ring score labels */}
          {RINGS.slice(0, 5).map((ring, i) => (
            <text key={i} x={TARGET_CX + TARGET_R * ring.r + 4} y={TARGET_CY + 3}
              fontSize={8} fontWeight={700} fill="rgba(0,0,0,0.3)">{ring.score}</text>
          ))}

          {/* Crosshair on target */}
          <line x1={TARGET_CX} y1={TARGET_CY - TARGET_R - 8} x2={TARGET_CX} y2={TARGET_CY + TARGET_R + 8}
            stroke="rgba(0,0,0,0.08)" strokeWidth={0.5} />
          <line x1={TARGET_CX - TARGET_R - 8} y1={TARGET_CY} x2={TARGET_CX + TARGET_R + 8} y2={TARGET_CY}
            stroke="rgba(0,0,0,0.08)" strokeWidth={0.5} />

          {/* Landed arrows */}
          {myArrows.map((arrow, i) => {
            const ax = TARGET_CX + arrow.x;
            const ay = TARGET_CY + arrow.y;
            return (
              <g key={i}>
                {/* Arrow shaft sticking out */}
                <line x1={ax} y1={ay} x2={ax + 4} y2={ay - 14}
                  stroke="#854d0e" strokeWidth={2} strokeLinecap="round" />
                {/* Fletching */}
                <line x1={ax + 3} y1={ay - 11} x2={ax + 7} y2={ay - 16}
                  stroke={C.accent} strokeWidth={1.5} />
                <line x1={ax + 5} y1={ay - 13} x2={ax + 1} y2={ay - 18}
                  stroke={C.accent} strokeWidth={1.5} />
                {/* Entry point */}
                <circle cx={ax} cy={ay} r={2.5} fill="rgba(0,0,0,0.5)" />
              </g>
            );
          })}

          {/* Aim crosshair when dragging */}
          {aiming && (
            <g>
              <circle cx={TARGET_CX + aimPos.x} cy={TARGET_CY + aimPos.y} r={8}
                fill="none" stroke={C.gold} strokeWidth={1.5} opacity={0.7} />
              <line x1={TARGET_CX + aimPos.x} y1={TARGET_CY + aimPos.y - 12}
                x2={TARGET_CX + aimPos.x} y2={TARGET_CY + aimPos.y + 12}
                stroke={C.gold} strokeWidth={0.8} opacity={0.5} />
              <line x1={TARGET_CX + aimPos.x - 12} y1={TARGET_CY + aimPos.y}
                x2={TARGET_CX + aimPos.x + 12} y2={TARGET_CY + aimPos.y}
                stroke={C.gold} strokeWidth={0.8} opacity={0.5} />
              {/* Draw strength arc */}
              <circle cx={W / 2} cy={H - 40} r={20 + drawStrength * 20}
                fill="none" stroke={C.accent} strokeWidth={2} opacity={drawStrength * 0.6}
                strokeDasharray={`${drawStrength * 130} 200`}
              />
            </g>
          )}

          {/* Arrow in flight */}
          {flightSvg}

          {/* Score popup */}
          {showScore && (
            <g>
              <text x={showScore.x} y={showScore.y - 15}
                textAnchor="middle" fontSize={22} fontWeight={900}
                fill={showScore.score >= 8 ? C.gold : showScore.score >= 5 ? '#f59e0b' : C.accent}
              >
                +{showScore.score}
                <animate attributeName="y" from={`${showScore.y - 10}`} to={`${showScore.y - 40}`} dur="0.8s" fill="freeze" />
                <animate attributeName="opacity" from="1" to="0" dur="1s" fill="freeze" />
              </text>
            </g>
          )}

          {/* Bow at bottom (first person) */}
          {!flying && isPlayerTurn && !gameOver && !allDone && (
            <g opacity={0.6}>
              {/* Bow arc */}
              <path d={`M${W / 2 - 25},${H - 20} Q${W / 2},${H - 80 - drawStrength * 30} ${W / 2 + 25},${H - 20}`}
                fill="none" stroke="#854d0e" strokeWidth={4} strokeLinecap="round" />
              {/* String */}
              <line x1={W / 2 - 25} y1={H - 20} x2={W / 2} y2={H - 40 + drawStrength * 30}
                stroke="#d4d4d8" strokeWidth={1} />
              <line x1={W / 2 + 25} y1={H - 20} x2={W / 2} y2={H - 40 + drawStrength * 30}
                stroke="#d4d4d8" strokeWidth={1} />
              {/* Nocking point / arrow on string */}
              {aiming && (
                <circle cx={W / 2} cy={H - 40 + drawStrength * 30} r={3} fill={C.accent} />
              )}
            </g>
          )}

          {/* Wind indicator arrow on field */}
          <g transform={`translate(${W - 45}, 30)`} opacity={0.5}>
            <text x={0} y={0} fontSize={9} fontWeight={700} fill={C.dim} textAnchor="middle">🌬️</text>
            <line x1={0} y1={6} x2={wind.x * 1.5} y2={6 + wind.y * 1.5}
              stroke={C.accent} strokeWidth={1.5} markerEnd="none" />
            <circle cx={wind.x * 1.5} cy={6 + wind.y * 1.5} r={2} fill={C.accent} />
          </g>
        </svg>
      </div>

      {/* Arrow scores */}
      <div style={{
        display: 'flex', gap: 3, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 340,
      }}>
        {myScores.map((s, i) => (
          <span key={i} style={{
            width: 22, height: 22, borderRadius: 5, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800,
            background: s >= 8 ? 'rgba(251,191,36,0.2)' : s >= 5 ? 'rgba(245,158,11,0.15)' : 'rgba(74,222,128,0.1)',
            color: s >= 8 ? C.gold : s >= 5 ? '#f59e0b' : C.accent,
            border: `1px solid ${s >= 8 ? 'rgba(251,191,36,0.3)' : C.border}`,
          }}>{s}</span>
        ))}
        {Array.from({ length: totalArrows - myScores.length }, (_, i) => (
          <span key={`e${i}`} style={{
            width: 22, height: 22, borderRadius: 5, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: C.dim,
            background: 'rgba(15,27,18,0.4)', border: `1px solid ${C.border}`,
          }}>·</span>
        ))}
      </div>

      {/* Instructions */}
      {isPlayerTurn && !flying && !gameOver && !allDone && (
        <p style={{ marginTop: 6, fontSize: 11, color: C.dim, fontWeight: 600 }}>
          ☝️ Tire la corde vers l'arrière puis relâche
        </p>
      )}

      {/* Game Over */}
      <AnimatePresence>
        {gameOver && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{
              position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.75)', zIndex: 100,
            }}
          >
            <motion.div
              initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              style={{
                padding: '28px 44px', borderRadius: 24, textAlign: 'center',
                background: C.glass, border: `1px solid ${C.border}`,
              }}
            >
              <p style={{ fontSize: 48, marginBottom: 8 }}>
                {winner === playerId ? '🏆' : winner === null ? '🤝' : '😔'}
              </p>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 6 }}>
                {winner === playerId ? 'Victoire !' : winner === null ? 'Égalité !' : 'Défaite...'}
              </h2>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: C.dim }}>Toi</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: C.accent }}>{totalMyScore}</div>
                </div>
                <div style={{ fontSize: 18, color: C.dim, alignSelf: 'center' }}>vs</div>
                <div>
                  <div style={{ fontSize: 10, color: C.dim }}>Adversaire</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#ef4444' }}>{totalOpScore}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
