import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── POV Beer Pong ────────────────────────────────────────────────────────────
// First-person perspective: you look down a table. Cups at the far end appear
// smaller (perspective). Swipe up to throw. Ball arcs toward cups.

const W = 420;
const H = 600;
const HORIZON = 80;
const TABLE_TOP = HORIZON;
const TABLE_BOT = H - 20;
const TABLE_LEFT_TOP = W * 0.35;
const TABLE_RIGHT_TOP = W * 0.65;
const TABLE_LEFT_BOT = -40;
const TABLE_RIGHT_BOT = W + 40;

// Perspective helpers: y=0 is horizon (far), y=1 is bottom (near)
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function perspX(x01: number, depth01: number): number {
  const left = lerp(TABLE_LEFT_TOP, TABLE_LEFT_BOT, depth01);
  const right = lerp(TABLE_RIGHT_TOP, TABLE_RIGHT_BOT, depth01);
  return lerp(left, right, x01);
}
function perspY(depth01: number): number {
  return lerp(TABLE_TOP, TABLE_BOT, depth01);
}
function perspScale(depth01: number): number {
  return lerp(0.35, 1.2, depth01);
}

// Cup positions in normalized space (x: 0-1 across table, depth: 0=far, 1=near)
function triangleCups(): { x: number; depth: number; id: number }[] {
  const cups: { x: number; depth: number; id: number }[] = [];
  let id = 0;
  const rows = 4;
  for (let row = 0; row < rows; row++) {
    const count = row + 1;
    const d = 0.08 + row * 0.12; // depth from 0.08 to 0.44
    for (let col = 0; col < count; col++) {
      const x = 0.5 + (col - (count - 1) / 2) * 0.09;
      cups.push({ x, depth: d, id: id++ });
    }
  }
  return cups;
}

const C = {
  sky: '#1a0f0a',
  table: '#5c3a1e',
  tableDark: '#3d2510',
  cup: '#dc2626',
  cupLight: '#ef4444',
  cupRim: '#fca5a5',
  beer: '#fbbf24',
  ball: '#f5f5f4',
  text: '#fde68a',
  dim: 'rgba(255,180,80,0.5)',
  glass: 'rgba(26,15,10,0.85)',
  border: 'rgba(255,180,80,0.2)',
  accent: '#f59e0b',
};

interface Props {
  gameId: string; playerId: string; opponentId: string;
  isPlayerTurn: boolean; gameState: any;
  onMove: (data: any) => void; onGameOver: (data: any) => void;
}

export default function SandyGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: Props) {
  const initCups = useMemo(() => triangleCups().map(c => ({ ...c, alive: true })), []);
  const [cups, setCups] = useState(initCups);
  const [myCupsRemoved, setMyCupsRemoved] = useState(0); // cups opponent removed from our side
  const [opCupsRemoved, setOpCupsRemoved] = useState(0); // cups we removed from opponent
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const [ballAnim, setBallAnim] = useState<{ t: number; targetX: number; targetDepth: number; hit: boolean; cupId: number | null } | null>(null);
  const [flying, setFlying] = useState(false);
  const [splashId, setSplashId] = useState<number | null>(null);
  const [missAnim, setMissAnim] = useState<{ x: number; y: number } | null>(null);
  const [gameOver, setGameOverState] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [opThrowAnim, setOpThrowAnim] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const animRef = useRef<number>(0);
  const ballT = useRef(0);

  const aliveCups = cups.filter(c => c.alive);

  // ── Ball arc animation ─────────────────────────────────────────────────────

  const animateBall = useCallback((targetX01: number, targetDepth: number, hitCupId: number | null, isMine: boolean) => {
    setFlying(true);
    ballT.current = 0;
    const duration = 50; // frames

    const step = () => {
      ballT.current++;
      const t = ballT.current / duration;
      setBallAnim({ t, targetX: targetX01, targetDepth, hit: hitCupId !== null, cupId: hitCupId });

      if (t >= 1) {
        setFlying(false);
        setBallAnim(null);

        if (hitCupId !== null) {
          setSplashId(hitCupId);
          setTimeout(() => setSplashId(null), 800);
          if (isMine) {
            setCups(prev => {
              const next = prev.map(c => c.id === hitCupId ? { ...c, alive: false } : c);
              const alive = next.filter(c => c.alive).length;
              setOpCupsRemoved(10 - alive);
              if (alive === 0) {
                setGameOverState(true);
                setWinner(playerId);
                onGameOver({ winner_id: playerId });
              }
              return next;
            });
          } else {
            setMyCupsRemoved(prev => {
              const next = prev + 1;
              if (next >= 10) {
                setGameOverState(true);
                setWinner(opponentId);
              }
              return next;
            });
          }
        } else {
          // Miss splash
          const mx = perspX(targetX01, targetDepth);
          const my = perspY(targetDepth);
          setMissAnim({ x: mx, y: my });
          setTimeout(() => setMissAnim(null), 600);
        }
        return;
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, [playerId, opponentId, onGameOver]);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  // ── Throw logic ────────────────────────────────────────────────────────────

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isPlayerTurn || flying || gameOver) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (y < 0.6) return; // only start drag from bottom half
    setDragStart({ x, y });
    setDragCurrent({ x, y });
    setDragging(true);
  }, [isPlayerTurn, flying, gameOver]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragCurrent({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  }, [dragging]);

  const handlePointerUp = useCallback(() => {
    if (!dragging || !dragStart || !dragCurrent) return;
    setDragging(false);

    const dy = dragStart.y - dragCurrent.y;
    const dx = dragCurrent.x - dragStart.x;
    if (dy < 0.05) return; // too small

    // Determine aim: straight ahead = 0.5, offset by dx
    const aimX = 0.5 + dx * 1.5;
    const power = Math.min(dy * 2, 1); // 0-1

    // Find closest alive cup to aim point
    let bestCup: typeof cups[0] | null = null;
    let bestDist = Infinity;
    for (const cup of aliveCups) {
      const dist = Math.abs(cup.x - aimX);
      if (dist < 0.06 && dist < bestDist) {
        bestDist = dist;
        bestCup = cup;
      }
    }

    // Some randomness — farther cups harder to hit
    const accuracy = 0.04 + Math.random() * 0.03;
    const hitCupId = bestCup && bestDist < accuracy ? bestCup.id : null;

    const targetX = hitCupId !== null ? bestCup!.x : aimX;
    const targetDepth = hitCupId !== null ? bestCup!.depth : 0.15 + Math.random() * 0.3;

    animateBall(targetX, targetDepth, hitCupId, true);
    onMove({ type: 'throw', aimX, power, hitCupId, targetX, targetDepth });
  }, [dragging, dragStart, dragCurrent, aliveCups, animateBall, onMove]);

  // ── Opponent throw ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId || m.type !== 'throw') return;

    setOpThrowAnim(true);
    setTimeout(() => {
      setOpThrowAnim(false);
      // Opponent hit one of our cups — we show the ball coming from behind us
      animateBall(m.targetX, m.targetDepth, m.hitCupId, false);
    }, 600);
  }, [gameState?.lastMove]);

  // ── Ball position during flight ────────────────────────────────────────────

  let ballSvg = null;
  if (ballAnim) {
    const { t, targetX, targetDepth } = ballAnim;
    // Ball starts at bottom center, arcs up then down to target
    const startX = 0.5, startDepth = 0.95;
    const curDepth = lerp(startDepth, targetDepth, t);
    const curX = lerp(startX, targetX, t);
    // Arc: ball goes up then comes down
    const arc = Math.sin(t * Math.PI) * 120 * (1 - targetDepth);
    const px = perspX(curX, curDepth);
    const py = perspY(curDepth) - arc;
    const scale = perspScale(curDepth);
    const r = 6 * scale;

    ballSvg = (
      <g>
        {/* Ball shadow on table */}
        <ellipse cx={px} cy={perspY(curDepth) + 2} rx={r * 1.2} ry={r * 0.3}
          fill="rgba(0,0,0,0.3)" />
        {/* Ball */}
        <circle cx={px} cy={py} r={r} fill={C.ball} stroke="rgba(0,0,0,0.15)" strokeWidth={1} />
        <circle cx={px - r * 0.3} cy={py - r * 0.3} r={r * 0.35} fill="white" opacity={0.8} />
      </g>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // Table trapezoid points
  const tablePoints = `${TABLE_LEFT_TOP},${TABLE_TOP} ${TABLE_RIGHT_TOP},${TABLE_TOP} ${TABLE_RIGHT_BOT},${TABLE_BOT} ${TABLE_LEFT_BOT},${TABLE_BOT}`;
  
  // Drag arrow
  const showArrow = dragging && dragStart && dragCurrent && (dragStart.y - dragCurrent.y > 0.02);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: C.sky, fontFamily: '-apple-system, sans-serif',
      padding: 16, userSelect: 'none',
    }}>
      {/* Header */}
      <motion.h1
        initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{
          fontSize: 22, fontWeight: 900, marginBottom: 4,
          background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}
      >🏖️ SANDY PONG</motion.h1>

      {/* Score bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 6, alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase' }}>Tes cups</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.accent }}>{10 - myCupsRemoved}</div>
        </div>
        <div style={{
          padding: '3px 12px', borderRadius: 10, fontSize: 12, fontWeight: 700,
          background: gameOver ? 'rgba(52,199,89,0.12)' : isPlayerTurn ? 'rgba(245,158,11,0.12)' : 'rgba(100,100,100,0.08)',
          color: gameOver ? '#34C759' : isPlayerTurn ? C.accent : '#6b7280',
          border: `1px solid ${gameOver ? 'rgba(52,199,89,0.25)' : isPlayerTurn ? C.border : 'rgba(100,100,100,0.12)'}`,
        }}>
          {gameOver
            ? (winner === playerId ? '🏆 Victoire !' : '🍺 Défaite...')
            : flying ? '🏐 ...'
              : isPlayerTurn ? '🎯 Lance !' : '⏳ Adversaire...'}
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase' }}>Adversaire</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#ef4444' }}>{10 - opCupsRemoved}</div>
        </div>
      </div>

      {/* POV Canvas */}
      <div style={{
        borderRadius: 18, overflow: 'hidden', border: `1px solid ${C.border}`,
        boxShadow: '0 0 40px rgba(245,158,11,0.08)',
      }}>
        <svg
          ref={svgRef}
          width={W} height={H}
          viewBox={`0 0 ${W} ${H}`}
          onPointerDown={handlePointerDown as any}
          onPointerMove={handlePointerMove as any}
          onPointerUp={handlePointerUp}
          style={{ display: 'block', touchAction: 'none', background: '#0d0906' }}
        >
          <defs>
            <linearGradient id="spTableGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a2d14" />
              <stop offset="40%" stopColor="#5c3a1e" />
              <stop offset="100%" stopColor="#6b4226" />
            </linearGradient>
            <radialGradient id="spCupGrad">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="70%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#b91c1c" />
            </radialGradient>
            <linearGradient id="spWall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1008" />
              <stop offset="100%" stopColor="#0d0906" />
            </linearGradient>
          </defs>

          {/* Background wall */}
          <rect width={W} height={HORIZON + 30} fill="url(#spWall)" />
          {/* Distant wall detail */}
          <rect x={TABLE_LEFT_TOP - 10} y={HORIZON - 20} width={TABLE_RIGHT_TOP - TABLE_LEFT_TOP + 20} height={20}
            fill="rgba(90,60,30,0.15)" rx={2} />

          {/* Table surface — perspective trapezoid */}
          <polygon points={tablePoints} fill="url(#spTableGrad)" />
          {/* Table edges */}
          <line x1={TABLE_LEFT_TOP} y1={TABLE_TOP} x2={TABLE_LEFT_BOT} y2={TABLE_BOT}
            stroke="#2a180c" strokeWidth={3} />
          <line x1={TABLE_RIGHT_TOP} y1={TABLE_TOP} x2={TABLE_RIGHT_BOT} y2={TABLE_BOT}
            stroke="#2a180c" strokeWidth={3} />
          <line x1={TABLE_LEFT_TOP} y1={TABLE_TOP} x2={TABLE_RIGHT_TOP} y2={TABLE_TOP}
            stroke="#2a180c" strokeWidth={2} />

          {/* Center line (perspective) */}
          <line x1={perspX(0.5, 0)} y1={perspY(0)} x2={perspX(0.5, 1)} y2={perspY(1)}
            stroke="rgba(255,255,255,0.04)" strokeWidth={1} strokeDasharray="6 8" />

          {/* Cups in perspective */}
          {cups.map(cup => {
            const px = perspX(cup.x, cup.depth);
            const py = perspY(cup.depth);
            const sc = perspScale(cup.depth);
            const r = 14 * sc;
            const isSplash = splashId === cup.id;

            if (!cup.alive) {
              // Empty ring
              return (
                <ellipse key={cup.id} cx={px} cy={py} rx={r} ry={r * 0.6}
                  fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="3 3" />
              );
            }

            return (
              <g key={cup.id}>
                {/* Cup shadow */}
                <ellipse cx={px} cy={py + r * 0.3} rx={r * 1.1} ry={r * 0.35}
                  fill="rgba(0,0,0,0.4)" />
                {/* Cup body — ellipse (seen from above at angle) */}
                <ellipse cx={px} cy={py} rx={r} ry={r * 0.6}
                  fill={C.cup} stroke={isSplash ? '#fbbf24' : C.cupRim} strokeWidth={isSplash ? 2.5 : 1.2}
                  opacity={isSplash ? 0.6 : 1} />
                {/* Beer surface */}
                <ellipse cx={px} cy={py - r * 0.1} rx={r * 0.75} ry={r * 0.4}
                  fill={C.beer} opacity={0.5} />
                {/* Rim highlight */}
                <ellipse cx={px} cy={py - r * 0.15} rx={r * 0.5} ry={r * 0.2}
                  fill="white" opacity={0.12} />

                {/* Splash effect */}
                {isSplash && (
                  <>
                    <circle cx={px} cy={py} r={r * 0.5} fill={C.beer} opacity={0.6}>
                      <animate attributeName="r" from={`${r * 0.5}`} to={`${r * 2}`} dur="0.5s" fill="freeze" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="0.5s" fill="freeze" />
                    </circle>
                    {/* Droplets */}
                    {[0, 60, 120, 180, 240, 300].map(angle => (
                      <circle key={angle} cx={px} cy={py} r={2 * sc} fill={C.beer} opacity={0.7}>
                        <animate attributeName="cx" from={`${px}`}
                          to={`${px + Math.cos(angle * Math.PI / 180) * r * 2}`} dur="0.4s" fill="freeze" />
                        <animate attributeName="cy" from={`${py}`}
                          to={`${py + Math.sin(angle * Math.PI / 180) * r * 1.5}`} dur="0.4s" fill="freeze" />
                        <animate attributeName="opacity" from="0.7" to="0" dur="0.5s" fill="freeze" />
                      </circle>
                    ))}
                  </>
                )}
              </g>
            );
          })}

          {/* Ball in flight */}
          {ballSvg}

          {/* Miss splash */}
          {missAnim && (
            <circle cx={missAnim.x} cy={missAnim.y} r={4} fill="rgba(255,255,255,0.3)">
              <animate attributeName="r" from="4" to="20" dur="0.4s" fill="freeze" />
              <animate attributeName="opacity" from="0.3" to="0" dur="0.5s" fill="freeze" />
            </circle>
          )}

          {/* Ball at rest (waiting to throw) */}
          {!flying && !dragging && isPlayerTurn && !gameOver && (
            <g>
              <circle cx={W / 2} cy={H - 50} r={8} fill={C.ball} stroke="rgba(0,0,0,0.15)" strokeWidth={1}>
                <animate attributeName="r" values="7;9;7" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={W / 2 - 2.5} cy={H - 53} r={3} fill="white" opacity={0.7} />
            </g>
          )}

          {/* Drag aim indicator */}
          {showArrow && dragStart && dragCurrent && (
            <g>
              {/* Direction line */}
              <line
                x1={W / 2} y1={H - 50}
                x2={W / 2 + (dragCurrent.x - dragStart.x) * W * 0.6}
                y2={H - 50 - (dragStart.y - dragCurrent.y) * H * 0.4}
                stroke="rgba(245,158,11,0.5)" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round"
              />
              {/* Power indicator */}
              <circle cx={W / 2} cy={H - 50} r={12}
                fill="none" stroke="rgba(245,158,11,0.3)" strokeWidth={1.5} />
            </g>
          )}

          {/* Opponent throwing indicator */}
          {opThrowAnim && (
            <text x={W / 2} y={HORIZON + 30} textAnchor="middle"
              fill="rgba(255,255,255,0.5)" fontSize={12} fontWeight={700}>
              L'adversaire lance...
            </text>
          )}

          {/* Hand/arm hint at bottom */}
          {isPlayerTurn && !flying && !gameOver && (
            <g opacity={0.15}>
              <ellipse cx={W / 2} cy={H + 30} rx={80} ry={60} fill="#d4a574" />
            </g>
          )}
        </svg>
      </div>

      {/* Instructions */}
      {isPlayerTurn && !flying && !gameOver && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ marginTop: 8, fontSize: 12, color: C.dim, fontWeight: 600 }}
        >
          ☝️ Glisse vers le haut pour lancer
        </motion.p>
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
              <p style={{ fontSize: 48, marginBottom: 8 }}>{winner === playerId ? '🏆' : '🍻'}</p>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }}>
                {winner === playerId ? 'Victoire !' : 'Tu bois ! 🍺'}
              </h2>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
