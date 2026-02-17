import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Constants ────────────────────────────────────────────────────────────────

const TABLE_W = 400;
const TABLE_H = 600;
const CUP_R = 18;
const BALL_R = 8;
const GRAVITY = 0.25;
const BOUNCE_DAMP = 0.5;
const RIM_CHANCE = 0.3; // probability of rim bounce on near-miss

// Triangle formation for 10 cups
function triangleCups(startX: number, startY: number, rows: number): { x: number; y: number; id: number }[] {
  const cups: { x: number; y: number; id: number }[] = [];
  let id = 0;
  const spacing = CUP_R * 2.2;
  for (let row = 0; row < rows; row++) {
    const count = row + 1;
    const offsetX = -(count - 1) * spacing / 2;
    for (let col = 0; col < count; col++) {
      cups.push({ x: startX + offsetX + col * spacing, y: startY + row * spacing * 0.87, id: id++ });
    }
  }
  return cups;
}

const C = {
  bg: 'linear-gradient(180deg, #1a0f0a 0%, #2d1810 40%, #1a0f0a 100%)',
  table: 'linear-gradient(180deg, #5c3a1e, #3d2510)',
  glass: 'rgba(26, 15, 10, 0.85)',
  border: 'rgba(255, 180, 80, 0.2)',
  accent: '#f59e0b',
  cup: 'linear-gradient(135deg, #ef4444, #dc2626)',
  cupRim: '#fca5a5',
  beer: '#fbbf24',
  ball: '#f5f5f4',
  text: '#fde68a',
  dim: 'rgba(255, 180, 80, 0.5)',
};

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';

// ── Component ────────────────────────────────────────────────────────────────

interface Props {
  gameId: string; playerId: string; opponentId: string;
  isPlayerTurn: boolean; gameState: any;
  onMove: (data: any) => void; onGameOver: (data: any) => void;
}

export default function SandyGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: Props) {
  const isHost = playerId < opponentId;

  // Cups: host attacks opponent's cups (top), guest attacks host's cups (bottom)
  const initialMyCups = useMemo(() =>
    triangleCups(TABLE_W / 2, TABLE_H - 170, 4).map(c => ({ ...c, alive: true })), []);
  const initialOpCups = useMemo(() =>
    triangleCups(TABLE_W / 2, 80, 4).map(c => ({ ...c, alive: true })), []);

  const [myCups, setMyCups] = useState(initialMyCups);
  const [opCups, setOpCups] = useState(initialOpCups);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: TABLE_W / 2, y: TABLE_H - 40 });
  const [dragCurrent, setDragCurrent] = useState({ x: TABLE_W / 2, y: TABLE_H - 40 });
  const [ballFlight, setBallFlight] = useState<{ x: number; y: number }[] | null>(null);
  const [ballIdx, setBallIdx] = useState(0);
  const [flying, setFlying] = useState(false);
  const [hitEffect, setHitEffect] = useState<{ x: number; y: number; hit: boolean; id: number } | null>(null);
  const [gameOver, setGameOverState] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [splashCup, setSplashCup] = useState<number | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number>(0);
  const effectCounter = useRef(0);

  const myAlive = opCups.filter(c => c.alive).length;
  const opAlive = myCups.filter(c => c.alive).length;

  // ── Simulate ball trajectory ───────────────────────────────────────────────

  const simulateBall = useCallback((startX: number, startY: number, vx: number, vy: number, targetCups: typeof opCups) => {
    const path: { x: number; y: number }[] = [];
    let x = startX, y = startY;
    let bvx = vx, bvy = vy;

    for (let i = 0; i < 200; i++) {
      bvy += GRAVITY;
      x += bvx;
      y += bvy;
      path.push({ x, y });

      // Check cup collision
      for (const cup of targetCups) {
        if (!cup.alive) continue;
        const dist = Math.sqrt((x - cup.x) ** 2 + (y - cup.y) ** 2);
        if (dist < CUP_R + BALL_R) {
          // Direct hit!
          return { path, hitCupId: cup.id, rimBounce: false };
        }
        // Rim check
        if (dist < CUP_R + BALL_R + 4 && Math.random() < RIM_CHANCE) {
          // Rim bounce → ball bounces off
          const angle = Math.atan2(y - cup.y, x - cup.x);
          bvx = Math.cos(angle) * 2;
          bvy = Math.sin(angle) * 2 - 1;
          // After bounce, could still land in another cup...
          for (let j = 0; j < 40; j++) {
            bvy += GRAVITY;
            x += bvx;
            y += bvy;
            path.push({ x, y });
            for (const cup2 of targetCups) {
              if (!cup2.alive) continue;
              const d2 = Math.sqrt((x - cup2.x) ** 2 + (y - cup2.y) ** 2);
              if (d2 < CUP_R + BALL_R) {
                return { path, hitCupId: cup2.id, rimBounce: true };
              }
            }
            if (y > TABLE_H + 20 || x < -20 || x > TABLE_W + 20) break;
          }
          return { path, hitCupId: null, rimBounce: true };
        }
      }

      if (y > TABLE_H + 20 || y < -50 || x < -20 || x > TABLE_W + 20) break;
    }
    return { path, hitCupId: null, rimBounce: false };
  }, []);

  // ── Throw ball ─────────────────────────────────────────────────────────────

  const throwBall = useCallback((startX: number, startY: number, vx: number, vy: number, targetCups: typeof opCups, isMine: boolean) => {
    const result = simulateBall(startX, startY, vx, vy, targetCups);
    setBallFlight(result.path);
    setBallIdx(0);
    setFlying(true);

    let idx = 0;
    const step = () => {
      idx += 2;
      if (idx >= result.path.length) {
        setFlying(false);
        setBallFlight(null);

        const end = result.path[result.path.length - 1];
        effectCounter.current++;
        const effectId = effectCounter.current;

        if (result.hitCupId !== null) {
          // Cup hit!
          setHitEffect({ x: end.x, y: end.y, hit: true, id: effectId });
          setSplashCup(result.hitCupId);
          setTimeout(() => { setSplashCup(null); setHitEffect(null); }, 1000);

          if (isMine) {
            setOpCups(prev => {
              const next = prev.map(c => c.id === result.hitCupId ? { ...c, alive: false } : c);
              const alive = next.filter(c => c.alive).length;
              if (alive === 0) {
                setGameOverState(true);
                setWinner(playerId);
                onGameOver({ winner_id: playerId });
              }
              return next;
            });
          } else {
            setMyCups(prev => {
              const next = prev.map(c => c.id === result.hitCupId ? { ...c, alive: false } : c);
              const alive = next.filter(c => c.alive).length;
              if (alive === 0) {
                setGameOverState(true);
                setWinner(opponentId);
              }
              return next;
            });
          }
        } else {
          setHitEffect({ x: end.x, y: end.y, hit: false, id: effectId });
          setTimeout(() => setHitEffect(null), 800);
        }

        return;
      }
      setBallIdx(idx);
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, [simulateBall, playerId, opponentId, onGameOver]);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // ── Handle my throw ────────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isPlayerTurn || flying || gameOver) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * TABLE_W;
    const y = ((e.clientY - rect.top) / rect.height) * TABLE_H;
    setDragStart({ x, y });
    setDragCurrent({ x, y });
    setDragging(true);
  }, [isPlayerTurn, flying, gameOver]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * TABLE_W;
    const y = ((e.clientY - rect.top) / rect.height) * TABLE_H;
    setDragCurrent({ x, y });
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);

    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const vx = dx * 0.15;
    const vy = dy * 0.15;

    if (Math.abs(dy) < 10) return; // too small, ignore

    const startX = TABLE_W / 2;
    const startY = TABLE_H - 30;

    throwBall(startX, startY, vx, vy, opCups, true);
    onMove({ type: 'throw', vx, vy, startX, startY });
  }, [dragging, dragStart, dragCurrent, opCups, throwBall, onMove]);

  // ── Handle opponent throw ──────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const move = gameState.lastMove;
    if (move.playerId === playerId || move.type !== 'throw') return;

    // Mirror the throw (opponent shoots from their side → from top for us)
    setTimeout(() => {
      const startX = TABLE_W - move.startX; // mirror X
      const startY = 30; // from top
      const vx = -move.vx; // mirror velocity
      const vy = -move.vy;
      throwBall(startX, startY, vx, vy, myCups, false);
    }, 400);
  }, [gameState?.lastMove]);

  // ── Current ball position ──────────────────────────────────────────────────

  const ballPos = flying && ballFlight && ballFlight[ballIdx] ? ballFlight[ballIdx] : null;

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderCups = (cups: typeof myCups, isOpponent: boolean) =>
    cups.map(cup => (
      <g key={cup.id}>
        {cup.alive ? (
          <>
            <circle cx={cup.x} cy={cup.y} r={CUP_R} fill="url(#cupGrad)"
              stroke={C.cupRim} strokeWidth={1.5} opacity={splashCup === cup.id ? 0.5 : 1} />
            <circle cx={cup.x} cy={cup.y} r={CUP_R - 4} fill={C.beer} opacity={0.6} />
            <text x={cup.x} y={cup.y + 4} textAnchor="middle" fontSize={12}>🍺</text>
          </>
        ) : (
          <circle cx={cup.x} cy={cup.y} r={CUP_R} fill="rgba(0,0,0,0.2)"
            stroke="rgba(255,255,255,0.05)" strokeWidth={1} strokeDasharray="4 3" />
        )}
      </g>
    ));

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
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}
      >🏖️ SANDY PONG</motion.h1>

      {/* Scores */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 8, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase' }}>Tes cups</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.accent }}>
            {myCups.filter(c => c.alive).length}/10
          </div>
        </div>
        <div style={{
          padding: '4px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
          background: gameOver ? 'rgba(52,199,89,0.12)' : isPlayerTurn ? 'rgba(245,158,11,0.12)' : 'rgba(100,100,100,0.1)',
          color: gameOver ? '#34C759' : isPlayerTurn ? C.accent : '#8e8e93',
          border: `1px solid ${gameOver ? 'rgba(52,199,89,0.3)' : isPlayerTurn ? C.border : 'rgba(100,100,100,0.15)'}`,
        }}>
          {gameOver
            ? (winner === playerId ? '🏆 Victoire !' : '😔 Défaite...')
            : flying ? '🏐 ...'
              : isPlayerTurn ? '🎯 Tire !' : '⏳ Adversaire...'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase' }}>Cups adversaire</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#ef4444' }}>
            {opCups.filter(c => c.alive).length}/10
          </div>
        </div>
      </div>

      {/* Game area */}
      <div style={{
        borderRadius: 20, overflow: 'hidden', border: `1px solid ${C.border}`,
        boxShadow: '0 0 30px rgba(245,158,11,0.1)',
      }}>
        <svg
          ref={svgRef}
          width={TABLE_W} height={TABLE_H}
          viewBox={`0 0 ${TABLE_W} ${TABLE_H}`}
          onPointerDown={handlePointerDown as any}
          onPointerMove={handlePointerMove as any}
          onPointerUp={handlePointerUp}
          style={{ display: 'block', background: '#3d2510', touchAction: 'none' }}
        >
          <defs>
            <linearGradient id="cupGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            <linearGradient id="tableGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5c3a1e" />
              <stop offset="100%" stopColor="#3d2510" />
            </linearGradient>
          </defs>

          {/* Table surface */}
          <rect width={TABLE_W} height={TABLE_H} fill="url(#tableGrad)" />
          {/* Table edges */}
          <rect x={0} y={0} width={4} height={TABLE_H} fill="#2a180c" />
          <rect x={TABLE_W - 4} y={0} width={4} height={TABLE_H} fill="#2a180c" />
          {/* Center line */}
          <line x1={0} y1={TABLE_H / 2} x2={TABLE_W} y2={TABLE_H / 2}
            stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="8 6" />

          {/* Opponent cups (top) */}
          {renderCups(opCups, true)}
          {/* My cups (bottom) */}
          {renderCups(myCups, false)}

          {/* Throw trajectory preview */}
          {dragging && (
            <>
              <line
                x1={TABLE_W / 2} y1={TABLE_H - 30}
                x2={TABLE_W / 2 + (dragStart.x - dragCurrent.x) * 0.5}
                y2={TABLE_H - 30 + (dragStart.y - dragCurrent.y) * 0.5}
                stroke="rgba(255,255,255,0.3)" strokeWidth={2} strokeDasharray="4 3"
              />
              <circle
                cx={TABLE_W / 2} cy={TABLE_H - 30}
                r={BALL_R + 2} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={1}
              />
            </>
          )}

          {/* Ball in flight */}
          {ballPos && (
            <>
              <circle cx={ballPos.x} cy={ballPos.y} r={BALL_R} fill={C.ball}
                stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
              <circle cx={ballPos.x} cy={ballPos.y} r={BALL_R + 8}
                fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
            </>
          )}

          {/* Ball at rest (when not throwing) */}
          {!flying && !dragging && isPlayerTurn && !gameOver && (
            <circle cx={TABLE_W / 2} cy={TABLE_H - 30} r={BALL_R} fill={C.ball}
              stroke="rgba(0,0,0,0.2)" strokeWidth={1}>
              <animate attributeName="r" values={`${BALL_R};${BALL_R + 1};${BALL_R}`} dur="1.5s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Hit/Miss effect */}
          {hitEffect && (
            <g>
              <circle cx={hitEffect.x} cy={hitEffect.y} r={5}
                fill={hitEffect.hit ? '#fbbf24' : 'rgba(255,255,255,0.3)'}>
                <animate attributeName="r" from="5" to={hitEffect.hit ? '40' : '20'} dur="0.6s" fill="freeze" />
                <animate attributeName="opacity" from="0.8" to="0" dur="0.8s" fill="freeze" />
              </circle>
              {hitEffect.hit && (
                <text x={hitEffect.x} y={hitEffect.y - 20} textAnchor="middle"
                  fill="#fbbf24" fontSize="16" fontWeight="bold">
                  🎉 SPLASH!
                  <animate attributeName="y" from={hitEffect.y - 10} to={hitEffect.y - 40} dur="0.8s" fill="freeze" />
                  <animate attributeName="opacity" from="1" to="0" dur="1s" fill="freeze" />
                </text>
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Instructions */}
      {isPlayerTurn && !flying && !gameOver && (
        <p style={{ marginTop: 10, fontSize: 12, color: C.dim, fontWeight: 600 }}>
          ↕ Glisse vers le haut pour lancer la balle
        </p>
      )}

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
                {winner === playerId ? '🏆' : '🍻'}
              </p>
              <h2 style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 4 }}>
                {winner === playerId ? 'Victoire !' : 'Tu dois boire ! 🍺'}
              </h2>
              <p style={{ fontSize: 14, color: C.dim }}>
                {winner === playerId ? 'Tous les cups adverses sont tombés !' : 'Tes cups sont tous tombés...'}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
