import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════
// EMMA BALLS — Basketball Street Art
//
// Mur de briques, graffiti, street art
// Swipe vers le haut pour lancer le ballon — score max en 30 secondes !
// Streak : 1pt, 2pts, 3pts, 4pts, 5pts max. Miss = reset streak
// ═══════════════════════════════════════════════════════════════════════════

const TURN_DURATION = 30;
const HOOP_CX = 50;
const HOOP_CY = 22;
const HOOP_R = 5.5;
const SWEET_SPOT = 6;

const SPLASH_COLORS = ['#ff006e', '#00f5d4', '#fee440', '#8338ec', '#ff6b35'];

const STREAK_MESSAGES = [
  '', // 0
  'NICE!',
  'SWAG!',
  'SPLASH!',
  'ON FIRE!',
  'LEGENDARY!',
];

interface Splatter {
  x: number;
  y: number;
  color: string;
  r: number;
  id: number;
  offsets: { dx: number; dy: number; r: number }[];
}

interface BallState {
  x: number;
  y: number;
  s: number;
  rotation: number;
}

// ── Brick Pattern ────────────────────────────────────────────────────────────

function BrickWall() {
  const bricks: JSX.Element[] = [];
  const bh = 5;
  const bw = 12;
  for (let row = 0; row < 20; row++) {
    const offset = row % 2 === 0 ? 0 : bw / 2;
    for (let col = -1; col < 10; col++) {
      const x = col * bw + offset;
      const y = row * bh;
      const shade = 0.85 + Math.sin(row * 3.7 + col * 2.1) * 0.15;
      bricks.push(
        <rect
          key={`b${row}-${col}`}
          x={x + 0.4}
          y={y + 0.3}
          width={bw - 0.8}
          height={bh - 0.6}
          rx={0.3}
          fill={`rgba(${Math.floor(140 * shade)}, ${Math.floor(50 * shade)}, ${Math.floor(35 * shade)}, 0.9)`}
        />
      );
    }
  }
  return (
    <g>
      <rect x={0} y={0} width={100} height={75} fill="#2a1008" />
      {bricks}
      {/* Mortar lines */}
      <rect x={0} y={0} width={100} height={75} fill="none" stroke="rgba(20,10,5,0.3)" strokeWidth={0.15} />
    </g>
  );
}

// ── Paint Splatter ───────────────────────────────────────────────────────────

function PaintSplat({ splat }: { splat: Splatter }) {
  return (
    <g>
      <circle cx={splat.x} cy={splat.y} r={splat.r} fill={splat.color} opacity={0.7} />
      {splat.offsets.map((o, i) => (
        <circle
          key={i}
          cx={splat.x + o.dx}
          cy={splat.y + o.dy}
          r={o.r}
          fill={splat.color}
          opacity={0.5 + Math.random() * 0.2}
        />
      ))}
    </g>
  );
}

// ── Backboard & Hoop ─────────────────────────────────────────────────────────

function Backboard() {
  return (
    <g>
      {/* Backboard shadow */}
      <rect x={37} y={9} width={26} height={16} rx={1} fill="rgba(0,0,0,0.3)" />
      {/* Backboard */}
      <rect x={36} y={8} width={28} height={16} rx={1.2}
        fill="#d4a050" stroke="#8b6030" strokeWidth={0.6} />
      {/* Backboard grain */}
      <line x1={38} y1={10} x2={38} y2={22} stroke="rgba(139,96,48,0.2)" strokeWidth={0.3} />
      <line x1={43} y1={9} x2={43} y2={23} stroke="rgba(139,96,48,0.15)" strokeWidth={0.3} />
      <line x1={48} y1={8.5} x2={48} y2={23.5} stroke="rgba(139,96,48,0.2}" strokeWidth={0.3} />
      <line x1={53} y1={9} x2={53} y2={23} stroke="rgba(139,96,48,0.15}" strokeWidth={0.3} />
      <line x1={58} y1={10} x2={58} y2={22} stroke="rgba(139,96,48,0.2}" strokeWidth={0.3} />
      {/* Target square */}
      <rect x={44} y={12} width={12} height={8} rx={0.5}
        fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={0.6} />
      {/* Support pole */}
      <rect x={49} y={24} width={2} height={4} fill="#666" />
      <rect x={47} y={27} width={6} height={1.2} rx={0.3} fill="#555" />
    </g>
  );
}

function HoopRing() {
  return (
    <g>
      {/* Hoop ring shadow */}
      <ellipse cx={HOOP_CX + 0.3} cy={HOOP_CY + 0.3} rx={HOOP_R} ry={1.8}
        fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
      {/* Hoop ring */}
      <ellipse cx={HOOP_CX} cy={HOOP_CY} rx={HOOP_R} ry={1.8}
        fill="none" stroke="#ff4400" strokeWidth={1} />
      {/* Hoop ring highlight */}
      <ellipse cx={HOOP_CX} cy={HOOP_CY} rx={HOOP_R - 0.4} ry={1.4}
        fill="none" stroke="rgba(255,150,100,0.4)" strokeWidth={0.3} />
    </g>
  );
}

function ChainNet() {
  const chains: JSX.Element[] = [];
  const numChains = 8;
  for (let i = 0; i < numChains; i++) {
    const angle = (i / numChains) * Math.PI;
    const topX = HOOP_CX + Math.cos(angle) * (HOOP_R - 0.5) - (HOOP_R - 0.5);
    const topXr = HOOP_CX - Math.cos(angle) * (HOOP_R - 0.5) + (HOOP_R - 0.5);
    const startX = HOOP_CX - HOOP_R + 1 + i * (HOOP_R * 2 - 2) / (numChains - 1);
    const baseX = HOOP_CX + (startX - HOOP_CX) * 0.5;
    // Chain links
    for (let j = 0; j < 5; j++) {
      const t = j / 5;
      const cx = startX + (baseX - startX) * t;
      const cy = HOOP_CY + 2 + j * 2.2;
      chains.push(
        <ellipse
          key={`ch${i}-${j}`}
          cx={cx}
          cy={cy}
          rx={0.6}
          ry={0.9}
          fill="none"
          stroke="#aaa"
          strokeWidth={0.3}
          opacity={0.6 - j * 0.08}
        />
      );
    }
  }
  return <g>{chains}</g>;
}

// ── Basketball SVG ───────────────────────────────────────────────────────────

function Basketball({ x, y, s, rotation }: BallState) {
  const r = 3.5 * s;
  return (
    <g transform={`translate(${x}, ${y}) rotate(${rotation})`}>
      {/* Ball shadow */}
      <ellipse cx={1} cy={r + 1} rx={r * 0.8} ry={r * 0.3}
        fill="rgba(0,0,0,0.2)" />
      {/* Main ball */}
      <circle cx={0} cy={0} r={r} fill="#e87830" />
      {/* Darker gradient overlay */}
      <circle cx={0} cy={0} r={r}
        fill="url(#ballGrad)" />
      {/* Lines on ball */}
      <line x1={-r} y1={0} x2={r} y2={0}
        stroke="#333" strokeWidth={0.3 * s} opacity={0.4} />
      <line x1={0} y1={-r} x2={0} y2={r}
        stroke="#333" strokeWidth={0.3 * s} opacity={0.4} />
      {/* Curved seams */}
      <path d={`M ${-r * 0.7} ${-r * 0.7} Q 0 ${-r * 0.3}, ${r * 0.7} ${-r * 0.7}`}
        fill="none" stroke="#333" strokeWidth={0.25 * s} opacity={0.35} />
      <path d={`M ${-r * 0.7} ${r * 0.7} Q 0 ${r * 0.3}, ${r * 0.7} ${r * 0.7}`}
        fill="none" stroke="#333" strokeWidth={0.25 * s} opacity={0.35} />
      {/* Highlight */}
      <circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.35}
        fill="rgba(255,220,180,0.25)" />
    </g>
  );
}

// ── Ground ───────────────────────────────────────────────────────────────────

function Ground() {
  return (
    <g>
      {/* Concrete ground */}
      <rect x={0} y={75} width={100} height={25} fill="#3a3530" />
      {/* Ground texture lines */}
      <line x1={0} y1={76} x2={100} y2={76} stroke="rgba(80,70,60,0.4)" strokeWidth={0.3} />
      <line x1={0} y1={82} x2={100} y2={82} stroke="rgba(60,50,40,0.2)" strokeWidth={0.2} />
      <line x1={0} y1={90} x2={100} y2={90} stroke="rgba(60,50,40,0.15)" strokeWidth={0.2} />
      {/* Crack */}
      <path d="M 15 76 L 18 82 L 16 88 L 20 95"
        fill="none" stroke="rgba(30,25,20,0.3)" strokeWidth={0.3} />
      <path d="M 70 76 L 72 80 L 68 86 L 72 92"
        fill="none" stroke="rgba(30,25,20,0.2)" strokeWidth={0.25} />
      {/* Wall/ground junction shadow */}
      <rect x={0} y={74} width={100} height={2.5}
        fill="url(#groundShadow)" />
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════

export default function EmmaGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: any) {
  const [timer, setTimer] = useState(TURN_DURATION);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(1);
  const [opScore, setOpScore] = useState(0);
  const [ball, setBall] = useState<BallState | null>(null);
  const [splatters, setSplatters] = useState<Splatter[]>([]);
  const [throwing, setThrowing] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCur, setDragCur] = useState<{ x: number; y: number } | null>(null);
  const [done, setDone] = useState(false);
  const [opDone, setOpDone] = useState(false);
  const [over, setOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [showFinal, setShowFinal] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [streakMsg, setStreakMsg] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const raf = useRef<number>(0);
  const resultT = useRef<ReturnType<typeof setTimeout>>();
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const reconstructed = useRef(false);
  const splatId = useRef(0);
  const scoreRef = useRef(0);
  const streakRef = useRef(1);
  const doneRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { streakRef.current = streak; }, [streak]);
  useEffect(() => { doneRef.current = done; }, [done]);

  // ── Reconstruct state from move history ──────────────────────────────────

  useEffect(() => {
    if (reconstructed.current || !gameState?.moves) return;
    const moves = gameState.moves as any[];
    if (moves.length === 0) return;

    let myScore = 0;
    let opponentScore = 0;
    let myDone = false;
    let opponentDone = false;

    for (const m of moves) {
      if (m.playerId === playerId) {
        if (m.type === 'throw') {
          myScore = m.total ?? myScore;
        }
        if (m.type === 'done') {
          myDone = true;
          myScore = m.total ?? myScore;
        }
      } else {
        if (m.type === 'throw') {
          opponentScore = m.total ?? opponentScore;
        }
        if (m.type === 'done') {
          opponentDone = true;
          opponentScore = m.total ?? opponentScore;
        }
      }
    }

    setScore(myScore);
    scoreRef.current = myScore;
    setOpScore(opponentScore);
    setDone(myDone);
    doneRef.current = myDone;
    setOpDone(opponentDone);

    if (myDone && opponentDone) {
      setOver(true);
      if (myScore > opponentScore) setWinner(playerId);
      else if (opponentScore > myScore) setWinner(opponentId);
      else setWinner(null); // tie
      setShowFinal(true);
    }

    reconstructed.current = true;
  }, [gameState, playerId, opponentId]);

  // ── Sync opponent moves ─────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId) return;

    if (m.type === 'throw') {
      setOpScore(m.total ?? 0);
    }
    if (m.type === 'done') {
      setOpDone(true);
      setOpScore(m.total ?? 0);
      // Check if both done
      if (doneRef.current) {
        const myFinal = scoreRef.current;
        const opFinal = m.total ?? 0;
        setOver(true);
        if (myFinal > opFinal) {
          setWinner(playerId);
          onGameOver({ winner_id: playerId });
        } else if (opFinal > myFinal) {
          setWinner(opponentId);
          onGameOver({ winner_id: opponentId });
        } else {
          setWinner(null);
          onGameOver({ winner_id: null });
        }
        setShowFinal(true);
      }
    }
  }, [gameState?.lastMove]);

  // ── Timer ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (isPlayerTurn && !done && !over && !timerStarted) {
      setTimerStarted(true);
      setTimer(TURN_DURATION);
    }
  }, [isPlayerTurn, done, over, timerStarted]);

  useEffect(() => {
    if (!timerStarted || done || over) return;

    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Timer expired
          clearInterval(timerRef.current);
          const finalScore = scoreRef.current;
          setDone(true);
          doneRef.current = true;
          onMove({ type: 'done', total: finalScore, _keepTurn: false });

          // Check if opponent already done
          setOpDone(prevOpDone => {
            if (prevOpDone) {
              setOpScore(prevOpScore => {
                setOver(true);
                if (finalScore > prevOpScore) {
                  setWinner(playerId);
                  onGameOver({ winner_id: playerId });
                } else if (prevOpScore > finalScore) {
                  setWinner(opponentId);
                  onGameOver({ winner_id: opponentId });
                } else {
                  setWinner(null);
                  onGameOver({ winner_id: null });
                }
                setShowFinal(true);
                return prevOpScore;
              });
            }
            return prevOpDone;
          });

          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerStarted, done, over, playerId, opponentId, onMove, onGameOver]);

  // ── Cleanup ─────────────────────────────────────────────────────────────

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    if (resultT.current) clearTimeout(resultT.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ── Create splatter ─────────────────────────────────────────────────────

  const makeSplatter = useCallback((x: number, y: number): Splatter => {
    const color = SPLASH_COLORS[Math.floor(Math.random() * SPLASH_COLORS.length)];
    const r = 1.5 + Math.random() * 2.5;
    const offsets: { dx: number; dy: number; r: number }[] = [];
    const numBlobs = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numBlobs; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = r * 0.5 + Math.random() * r * 1.5;
      offsets.push({
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
        r: 0.4 + Math.random() * 1.2,
      });
    }
    return { x, y, color, r, id: splatId.current++, offsets };
  }, []);

  // ── Throw ───────────────────────────────────────────────────────────────

  const doThrow = useCallback((dx: number, dy: number) => {
    if (throwing || !isPlayerTurn || done || over) return;
    setThrowing(true);

    const power = Math.min(1.2, Math.sqrt(dx * dx + dy * dy) * 2.5);

    // Calculate target position based on power & aim
    const aimX = HOOP_CX + dx * 60;

    // Sweet spot: power between 0.4 and 0.8
    const powerError = Math.abs(power - 0.6) * 12;
    const noise = powerError + (1 - Math.min(power, 1)) * 5;

    const finalX = aimX + (Math.random() - 0.5) * noise;
    const finalY = HOOP_CY + (power < 0.3 ? 15 : power > 1.0 ? -8 : 0) + (Math.random() - 0.5) * noise * 0.6;

    const sx = 50;
    const sy = 85;
    const start = performance.now();
    const dur = 550;

    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = sx + (finalX - sx) * ease;
      const y = sy + (finalY - sy) * ease - Math.sin(t * Math.PI) * 30;
      const s = 1 - t * 0.5;
      const rotation = t * 360 * (dx > 0 ? 1 : -1);
      setBall({ x, y, s, rotation });

      if (t < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        // Check if basket
        const dist = Math.sqrt((finalX - HOOP_CX) ** 2 + (finalY - HOOP_CY) ** 2);
        const isBasket = dist < SWEET_SPOT;

        if (isBasket) {
          const currentStreak = streakRef.current;
          const pts = Math.min(currentStreak, 5);
          const newScore = scoreRef.current + pts;
          const newStreak = Math.min(currentStreak + 1, 6);

          setScore(newScore);
          scoreRef.current = newScore;
          setStreak(newStreak);
          streakRef.current = newStreak;

          // Add splatter
          setSplatters(prev => [
            ...prev,
            makeSplatter(
              HOOP_CX + (Math.random() - 0.5) * 20,
              HOOP_CY + (Math.random() - 0.5) * 12
            ),
          ]);

          // Show result
          const msgIdx = Math.min(currentStreak, STREAK_MESSAGES.length - 1);
          setLastResult(`+${pts}`);
          if (currentStreak >= 2) {
            setStreakMsg(STREAK_MESSAGES[msgIdx]);
            setTimeout(() => setStreakMsg(null), 1200);
          }

          onMove({ type: 'throw', score: pts, total: newScore, _keepTurn: true });

          // Swoosh animation — ball drops through
          setTimeout(() => {
            setBall(prev => prev ? { ...prev, y: prev.y + 8, s: prev.s * 0.5 } : null);
          }, 100);
        } else {
          setStreak(1);
          streakRef.current = 1;
          setLastResult('MISS');
          setStreakMsg(null);

          // Bounce off animation
          const bounceDir = finalX > HOOP_CX ? 1 : -1;
          setTimeout(() => {
            setBall(prev => prev ? {
              ...prev,
              x: prev.x + bounceDir * 6,
              y: prev.y + 5,
              s: prev.s * 0.7,
              rotation: prev.rotation + bounceDir * 90,
            } : null);
          }, 50);
        }

        if (resultT.current) clearTimeout(resultT.current);
        resultT.current = setTimeout(() => setLastResult(null), 1200);

        setTimeout(() => {
          setBall(null);
          setThrowing(false);
        }, 450);
      }
    };

    raf.current = requestAnimationFrame(animate);
  }, [throwing, isPlayerTurn, done, over, onMove, makeSplatter]);

  // ── Touch/Mouse Input ───────────────────────────────────────────────────

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) / rect.width * 100, y: (cy - rect.top) / rect.height * 100 };
  };

  const getEndPos = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const cx = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const cy = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY;
    return { x: (cx - rect.left) / rect.width * 100, y: (cy - rect.top) / rect.height * 100 };
  };

  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlayerTurn || throwing || done || over) return;
    const p = getPos(e);
    if (p.y < 65) return; // Must start in bottom third
    setDragStart(p);
    setDragCur(p);
  };

  const onDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStart) return;
    e.preventDefault();
    const p = 'touches' in e ? getPos(e) : getPos(e);
    setDragCur(p);
  };

  const onEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStart || !dragCur) {
      setDragStart(null);
      setDragCur(null);
      return;
    }
    const endP = getEndPos(e);
    const dx = (endP.x - dragStart.x) / 100;
    const dy = (dragStart.y - endP.y) / 100;
    setDragStart(null);
    setDragCur(null);
    if (dy < 0.03) return; // Need upward swipe
    doThrow(dx * 1.5, dy * 1.5);
  };

  // ── Derived ─────────────────────────────────────────────────────────────

  const canPlay = isPlayerTurn && !done && !over && timerStarted;
  const dragActive = dragStart && dragCur;
  const dragDy = dragActive ? dragStart.y - dragCur.y : 0;
  const dragPower = Math.min(1, Math.max(0, dragDy / 30));

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      background: 'linear-gradient(180deg, #1a1210 0%, #201510 30%, #151010 70%, #0a0808 100%)',
      overflow: 'hidden',
      touchAction: 'none',
      fontFamily: "Impact, 'Arial Black', sans-serif",
      position: 'relative',
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 20%, rgba(255,107,53,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(255,0,110,0.03) 0%, transparent 40%)',
      }} />

      {/* ── HUD ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 0 4px', textAlign: 'center', width: '100%', zIndex: 2 }}>
        {/* Title */}
        <h1 style={{
          fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: 3,
          color: '#ff6b35',
          textShadow: '0 0 20px rgba(255,107,53,0.5), 0 0 40px rgba(255,107,53,0.2), 2px 2px 0 #000',
          textTransform: 'uppercase',
        }}>
          {'\u{1F3C0}'} EMMA BALLS
        </h1>
        <div style={{
          fontSize: 9, color: 'rgba(255,107,53,0.4)', letterSpacing: 4, marginTop: 1,
          textTransform: 'uppercase',
        }}>
          Basketball Street Art
        </div>

        {/* Score & Timer Row */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 10, marginTop: 8, alignItems: 'center',
        }}>
          {/* My Score */}
          <div style={{
            padding: '4px 14px', borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(255,107,53,0.05))',
            border: '1px solid rgba(255,107,53,0.3)',
            boxShadow: '0 2px 8px rgba(255,107,53,0.1)',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(255,200,150,0.7)', fontWeight: 700 }}>
              TOI:{' '}
              <strong style={{ color: '#ff6b35', fontSize: 20 }}>{score}</strong>
            </span>
          </div>

          {/* Timer */}
          <motion.div
            animate={timer <= 5 && canPlay ? {
              scale: [1, 1.1, 1],
              boxShadow: [
                '0 0 10px rgba(255,0,0,0.3)',
                '0 0 25px rgba(255,0,0,0.6)',
                '0 0 10px rgba(255,0,0,0.3)',
              ],
            } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{
              padding: '4px 16px', borderRadius: 10,
              background: timer <= 5 && canPlay
                ? 'linear-gradient(135deg, rgba(255,0,0,0.25), rgba(255,0,0,0.1))'
                : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03))',
              border: `1px solid ${timer <= 5 && canPlay ? 'rgba(255,0,0,0.5)' : 'rgba(255,255,255,0.15)'}`,
            }}>
            <span style={{
              fontSize: 24, fontWeight: 900,
              color: timer <= 5 && canPlay ? '#ff2222' : '#fff',
              textShadow: timer <= 5 && canPlay
                ? '0 0 15px rgba(255,0,0,0.8)'
                : '0 0 10px rgba(255,255,255,0.3)',
            }}>
              {timer}
            </span>
          </motion.div>

          {/* Opponent Score */}
          <div style={{
            padding: '4px 14px', borderRadius: 8,
            background: 'linear-gradient(135deg, rgba(131,56,236,0.12), rgba(131,56,236,0.04))',
            border: '1px solid rgba(131,56,236,0.25)',
          }}>
            <span style={{ fontSize: 11, color: 'rgba(200,170,255,0.7)', fontWeight: 700 }}>
              ADV:{' '}
              <strong style={{ color: '#8338ec', fontSize: 20 }}>{opScore}</strong>
            </span>
          </div>
        </div>

        {/* Streak */}
        {streak > 1 && canPlay && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ marginTop: 4, fontSize: 16 }}
          >
            {Array.from({ length: Math.min(streak - 1, 5) }, (_, i) => (
              <span key={i}>{'\u{1F525}'}</span>
            ))}
            <span style={{
              color: '#fee440', fontSize: 12, marginLeft: 4,
              textShadow: '0 0 8px rgba(254,228,64,0.5)',
            }}>
              x{Math.min(streak, 5)}
            </span>
          </motion.div>
        )}

        {/* Status messages */}
        {!canPlay && !over && !done && (
          <div style={{
            marginTop: 8, fontSize: 14, color: 'rgba(255,200,150,0.6)',
            fontStyle: 'italic',
          }}>
            {isPlayerTurn ? 'Swipe vers le haut pour lancer !' : "Tour de l'adversaire..."}
          </div>
        )}
        {done && !over && (
          <div style={{
            marginTop: 8, fontSize: 14, color: 'rgba(255,200,150,0.6)',
          }}>
            Ton score : {score} pts — En attente de l&apos;adversaire...
          </div>
        )}
      </div>

      {/* ── SVG Scene ────────────────────────────────────────────────────── */}
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        style={{
          width: '100%', maxWidth: 500, flexGrow: 1,
          cursor: canPlay ? 'grab' : 'default',
        }}
        onMouseDown={onStart}
        onMouseMove={onDrag}
        onMouseUp={onEnd}
        onMouseLeave={() => { setDragStart(null); setDragCur(null); }}
        onTouchStart={onStart}
        onTouchMove={onDrag}
        onTouchEnd={onEnd}
      >
        <defs>
          {/* Ball gradient */}
          <radialGradient id="ballGrad" cx="35%" cy="35%">
            <stop offset="0%" stopColor="rgba(255,200,120,0.3)" />
            <stop offset="70%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
          </radialGradient>
          {/* Ground shadow gradient */}
          <linearGradient id="groundShadow" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0.5)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Brick wall background */}
        <BrickWall />

        {/* Ground */}
        <Ground />

        {/* Paint splatters (behind hoop) */}
        {splatters.map(s => (
          <PaintSplat key={s.id} splat={s} />
        ))}

        {/* Backboard */}
        <Backboard />

        {/* Chain net */}
        <ChainNet />

        {/* Hoop ring */}
        <HoopRing />

        {/* Drag indicator */}
        {dragActive && canPlay && (
          <g>
            {/* Power bar */}
            <rect x={5} y={70} width={3} height={-20 * dragPower}
              fill={dragPower > 0.8 ? '#ff2222' : dragPower > 0.5 ? '#fee440' : '#00f5d4'}
              rx={1}
              opacity={0.7}
            />
            <rect x={5} y={50} width={3} height={20}
              fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={0.3} rx={1}
            />
            {/* Aim arrow */}
            <line
              x1={dragStart.x} y1={dragStart.y}
              x2={dragCur.x} y2={dragCur.y}
              stroke="rgba(255,255,255,0.3)" strokeWidth={0.5}
              strokeDasharray="1.5 1"
            />
          </g>
        )}

        {/* Ball at rest position (when not throwing) */}
        {!ball && canPlay && !throwing && (
          <Basketball x={50} y={85} s={1} rotation={0} />
        )}

        {/* Ball in flight */}
        {ball && (
          <Basketball {...ball} />
        )}

        {/* Hit/Miss popup */}
        <AnimatePresence>
          {lastResult && (
            <motion.g
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <text
                x={HOOP_CX}
                y={HOOP_CY - 10}
                textAnchor="middle"
                fontSize={lastResult === 'MISS' ? 5 : 7}
                fontFamily="Impact, 'Arial Black', sans-serif"
                fontWeight={900}
                fill={lastResult === 'MISS' ? '#888' : '#fee440'}
                stroke={lastResult === 'MISS' ? 'none' : '#000'}
                strokeWidth={0.3}
                filter="url(#glow)"
              >
                {lastResult}
              </text>
            </motion.g>
          )}
        </AnimatePresence>

        {/* Streak message */}
        <AnimatePresence>
          {streakMsg && (
            <motion.g
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              transition={{ duration: 0.4, ease: 'backOut' }}
            >
              <text
                x={HOOP_CX}
                y={45}
                textAnchor="middle"
                fontSize={8}
                fontFamily="Impact, 'Arial Black', sans-serif"
                fontWeight={900}
                fill={SPLASH_COLORS[Math.min(streak - 1, SPLASH_COLORS.length - 1)]}
                stroke="#000"
                strokeWidth={0.4}
                filter="url(#glow)"
                style={{ textTransform: 'uppercase' } as any}
              >
                {streakMsg}
              </text>
            </motion.g>
          )}
        </AnimatePresence>

        {/* Graffiti-style instruction */}
        {canPlay && !throwing && !ball && (
          <text
            x={50} y={78}
            textAnchor="middle"
            fontSize={3.5}
            fontFamily="Impact, 'Arial Black', sans-serif"
            fill="rgba(255,255,255,0.3)"
            style={{ textTransform: 'uppercase' } as any}
          >
            {'\u2191'} SWIPE UP TO SHOOT {'\u2191'}
          </text>
        )}

        {/* Waiting overlay */}
        {!isPlayerTurn && !done && !over && (
          <g>
            <rect x={0} y={0} width={100} height={100} fill="rgba(0,0,0,0.5)" />
            <text x={50} y={45} textAnchor="middle" fontSize={5}
              fontFamily="Impact, 'Arial Black', sans-serif"
              fill="#ff6b35" filter="url(#glow)">
              TOUR ADVERSE
            </text>
            <text x={50} y={55} textAnchor="middle" fontSize={3}
              fontFamily="Impact, 'Arial Black', sans-serif"
              fill="rgba(255,200,150,0.5)">
              En attente...
            </text>
          </g>
        )}
      </svg>

      {/* ── Final Score Overlay ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showFinal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(10,8,8,0.92)',
              zIndex: 100,
              fontFamily: "Impact, 'Arial Black', sans-serif",
            }}
          >
            <motion.div
              initial={{ scale: 0.5, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 12 }}
              style={{ textAlign: 'center' }}
            >
              {/* Result */}
              <div style={{
                fontSize: 48, fontWeight: 900,
                color: winner === playerId ? '#fee440' : winner === opponentId ? '#ff006e' : '#aaa',
                textShadow: winner === playerId
                  ? '0 0 30px rgba(254,228,64,0.6), 0 0 60px rgba(254,228,64,0.3)'
                  : '0 0 20px rgba(255,0,110,0.4)',
                letterSpacing: 4,
                textTransform: 'uppercase',
              }}>
                {winner === playerId ? 'VICTOIRE !' : winner === opponentId ? 'DEFAITE...' : 'EGALITE !'}
              </div>

              {/* Scores */}
              <div style={{
                display: 'flex', gap: 30, marginTop: 20, justifyContent: 'center',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: 'rgba(255,200,150,0.5)', letterSpacing: 2 }}>TOI</div>
                  <div style={{
                    fontSize: 56, fontWeight: 900, color: '#ff6b35',
                    textShadow: '0 0 20px rgba(255,107,53,0.5)',
                  }}>{score}</div>
                </div>
                <div style={{
                  fontSize: 36, color: 'rgba(255,255,255,0.2)',
                  alignSelf: 'center', marginTop: 10,
                }}>VS</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: 'rgba(200,170,255,0.5)', letterSpacing: 2 }}>ADV</div>
                  <div style={{
                    fontSize: 56, fontWeight: 900, color: '#8338ec',
                    textShadow: '0 0 20px rgba(131,56,236,0.5)',
                  }}>{opScore}</div>
                </div>
              </div>

              {/* Paint splatter decoration */}
              <svg viewBox="0 0 200 40" style={{ width: 250, marginTop: 10, opacity: 0.6 }}>
                {SPLASH_COLORS.map((c, i) => (
                  <circle
                    key={i}
                    cx={20 + i * 40}
                    cy={20}
                    r={8 + Math.random() * 6}
                    fill={c}
                    opacity={0.5}
                  />
                ))}
              </svg>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
