import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════
// NOUR ARCHERY — Tir à l'arc thème MATRIX / NÉO
// Code vert qui tombe, style digital hacker, flèches = projectiles de données
// POV avec arc cybernétique, cible holographique
// ═══════════════════════════════════════════════════════════════════════════

const ROUNDS = 5;
const ARROWS_PER_ROUND = 3;

const P = {
  bg: '#0a0a0a',
  matrix: '#00ff41',
  matrixDim: 'rgba(0,255,65,0.15)',
  matrixDark: 'rgba(0,255,65,0.06)',
  cyan: '#00e5ff',
  text: '#c0ffc0',
  dim: 'rgba(0,255,65,0.35)',
  accent: '#00ff41',
  red: '#ff2244',
};

// Matrix rain characters
const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF';

function MatrixRain({ width, height }: { width: number; height: number }) {
  const cols = Math.floor(width / 14);
  return (
    <g opacity={0.3}>
      {Array.from({ length: cols }, (_, i) => {
        const x = i * 14 + 7;
        const len = 4 + Math.floor(Math.random() * 8);
        const startY = Math.random() * height;
        const speed = 2 + Math.random() * 4;
        return (
          <g key={i}>
            {Array.from({ length: len }, (_, j) => (
              <text key={j} x={x} y={(startY + j * 14) % height}
                fill={j === 0 ? '#ffffff' : P.matrix}
                fontSize={10} fontFamily="monospace"
                opacity={1 - j / len}>
                {CHARS[Math.floor(Math.random() * CHARS.length)]}
              </text>
            ))}
          </g>
        );
      })}
    </g>
  );
}

// ── Holographic Target ───────────────────────────────────────────────────────

function HoloTarget({ cx, cy, size, wind }: { cx: number; cy: number; size: number; wind: number }) {
  const rings = [
    { r: size, color: 'rgba(0,255,65,0.05)', stroke: 'rgba(0,255,65,0.2)', label: '1' },
    { r: size * 0.78, color: 'rgba(0,255,65,0.08)', stroke: 'rgba(0,255,65,0.3)', label: '3' },
    { r: size * 0.56, color: 'rgba(0,229,255,0.06)', stroke: 'rgba(0,229,255,0.3)', label: '5' },
    { r: size * 0.36, color: 'rgba(0,229,255,0.1)', stroke: 'rgba(0,229,255,0.4)', label: '7' },
    { r: size * 0.18, color: 'rgba(255,0,100,0.08)', stroke: '#ff0064', label: '10' },
  ];

  return (
    <g>
      {/* Scan lines */}
      {Array.from({ length: 5 }, (_, i) => (
        <line key={i} x1={cx - size - 5} y1={cy - size + i * size * 0.5}
          x2={cx + size + 5} y2={cy - size + i * size * 0.5}
          stroke={P.matrixDark} strokeWidth={0.3} />
      ))}

      {/* Target rings */}
      {rings.map(({ r, color, stroke }, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill={color} stroke={stroke} strokeWidth={0.5}
            strokeDasharray={i < 2 ? '2,2' : 'none'} />
        </g>
      ))}

      {/* Cross hairs */}
      <line x1={cx - size - 3} y1={cy} x2={cx + size + 3} y2={cy} stroke={P.matrixDim} strokeWidth={0.3} />
      <line x1={cx} y1={cy - size - 3} x2={cx} y2={cy + size + 3} stroke={P.matrixDim} strokeWidth={0.3} />

      {/* Center bullseye glow */}
      <circle cx={cx} cy={cy} r={size * 0.06} fill={P.red} opacity={0.8}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite" />
      </circle>

      {/* Wind indicator */}
      <g transform={`translate(${cx}, ${cy + size + 12})`}>
        <text x={0} y={0} textAnchor="middle" fill={P.dim} fontSize={6} fontFamily="monospace">
          WIND {wind > 0 ? '→' : '←'} {Math.abs(wind).toFixed(1)}
        </text>
      </g>

      {/* Digital frame */}
      <rect x={cx - size - 3} y={cy - size - 3} width={(size + 3) * 2} height={(size + 3) * 2}
        fill="none" stroke={P.matrixDim} strokeWidth={0.3} rx={2} />

      {/* Corner brackets */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], i) => (
        <g key={i}>
          <line x1={cx + dx * (size + 3)} y1={cy + dy * (size + 3)}
            x2={cx + dx * (size + 3)} y2={cy + dy * (size - 2)}
            stroke={P.matrix} strokeWidth={0.5} />
          <line x1={cx + dx * (size + 3)} y1={cy + dy * (size + 3)}
            x2={cx + dx * (size - 2)} y2={cy + dy * (size + 3)}
            stroke={P.matrix} strokeWidth={0.5} />
        </g>
      ))}
    </g>
  );
}

// ── Cyber Bow ────────────────────────────────────────────────────────────────

function CyberBow({ drawPct }: { drawPct: number }) {
  const bowH = 60;
  const bowX = 50;
  const bowY = 85;
  const curveBack = 8 + drawPct * 4;
  const stringBack = drawPct * 12;

  return (
    <g>
      {/* Bow limbs — neon wireframe */}
      <path d={`M ${bowX} ${bowY - bowH / 2} Q ${bowX + curveBack} ${bowY} ${bowX} ${bowY + bowH / 2}`}
        fill="none" stroke={P.matrix} strokeWidth={1.2} opacity={0.8} />
      <path d={`M ${bowX} ${bowY - bowH / 2} Q ${bowX + curveBack + 1} ${bowY} ${bowX} ${bowY + bowH / 2}`}
        fill="none" stroke={P.cyan} strokeWidth={0.3} opacity={0.4} />

      {/* Bow tips - data nodes */}
      <circle cx={bowX} cy={bowY - bowH / 2} r={1.5} fill={P.matrix} opacity={0.9} />
      <circle cx={bowX} cy={bowY + bowH / 2} r={1.5} fill={P.matrix} opacity={0.9} />

      {/* String */}
      <line x1={bowX} y1={bowY - bowH / 2} x2={bowX - stringBack} y2={bowY}
        stroke={P.cyan} strokeWidth={0.5} opacity={0.7} />
      <line x1={bowX - stringBack} y1={bowY} x2={bowX} y2={bowY + bowH / 2}
        stroke={P.cyan} strokeWidth={0.5} opacity={0.7} />

      {/* Nock point (where arrow meets string) */}
      {drawPct > 0 && (
        <circle cx={bowX - stringBack} cy={bowY} r={1} fill={P.cyan} opacity={0.9}>
          <animate attributeName="opacity" values="0.5;1;0.5" dur="0.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Arrow — data projectile */}
      {drawPct > 0 && (
        <g>
          <line x1={bowX - stringBack} y1={bowY} x2={bowX - stringBack - 15} y2={bowY}
            stroke={P.cyan} strokeWidth={0.6} />
          {/* Arrow head — digital */}
          <polygon points={`${bowX - stringBack - 15},${bowY - 1.5} ${bowX - stringBack - 18},${bowY} ${bowX - stringBack - 15},${bowY + 1.5}`}
            fill={P.cyan} />
        </g>
      )}

      {/* HUD around bow */}
      {drawPct > 0 && (
        <text x={bowX + 8} y={bowY} fill={P.dim} fontSize={4} fontFamily="monospace">
          PWR {Math.round(drawPct * 100)}%
        </text>
      )}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════

export default function NourarcheryGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: any) {
  const [round, setRound] = useState(1);
  const [arrow, setArrow] = useState(1);
  const [myScore, setMyScore] = useState(0);
  const [opScore, setOpScore] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [drawPct, setDrawPct] = useState(0);
  const [aimAngle, setAimAngle] = useState({ x: 0, y: 0 });
  const [firing, setFiring] = useState(false);
  const [arrowFly, setArrowFly] = useState<{ t: number; sx: number; sy: number; ex: number; ey: number } | null>(null);
  const [hitPos, setHitPos] = useState<{ x: number; y: number; score: number } | null>(null);
  const [arrows, setArrows] = useState<{ x: number; y: number; score: number }[]>([]);
  const [wind, setWind] = useState(0);
  const [over, setOver] = useState(false);
  const [win, setWin] = useState<string | null>(null);
  const [opInfo, setOpInfo] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const drawTimer = useRef<ReturnType<typeof setInterval>>();
  const raf = useRef<number>(0);
  const infoT = useRef<ReturnType<typeof setTimeout>>();

  // Deterministic wind from gameId + round
  useEffect(() => {
    let h = 0;
    const seed = `${gameId}-${round}`;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    setWind(((h % 100) / 100) * 6 - 3);
  }, [gameId, round]);

  // ── Sync ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId) return;

    if (m.type === 'shoot') {
      setOpScore(prev => prev + m.score);
      setOpInfo(`⚡ ${m.score} pts`);
      if (infoT.current) clearTimeout(infoT.current);
      infoT.current = setTimeout(() => setOpInfo(null), 1500);

      // Check game end
      if (m.round === ROUNDS && m.arrow === ARROWS_PER_ROUND) {
        setTimeout(() => {
          const finalOp = opScore + m.score;
          if (myScore > finalOp) {
            setOver(true); setWin(playerId);
            onGameOver({ winner_id: playerId });
          } else if (finalOp > myScore) {
            setOver(true); setWin(opponentId);
          } else {
            // Tie — sudden death would go here
            setOver(true); setWin(myScore >= finalOp ? playerId : opponentId);
            if (myScore >= finalOp) onGameOver({ winner_id: playerId });
          }
        }, 1000);
      }
    }
  }, [gameState?.lastMove]);

  useEffect(() => () => {
    if (drawTimer.current) clearInterval(drawTimer.current);
    cancelAnimationFrame(raf.current);
    if (infoT.current) clearTimeout(infoT.current);
  }, []);

  // ── Aim & Shoot ────────────────────────────────────────────────────────────

  const targetCX = 50;
  const targetCY = 32;
  const targetR = 18;

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 50, y: 50 };
    const rect = svg.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) / rect.width * 100, y: (cy - rect.top) / rect.height * 100 };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlayerTurn || firing || over) return;
    const p = getPos(e);
    if (p.y < 55) return; // only from bottom half
    setDrawing(true);
    setDrawPct(0);
    drawTimer.current = setInterval(() => {
      setDrawPct(prev => Math.min(prev + 0.025, 1));
    }, 30);
  };

  const moveAim = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
    // Aim: how much offset from center (subtle aiming)
    setAimAngle({ x: (p.x - 50) / 50, y: (p.y - 50) / 50 });
  };

  const release = () => {
    if (!drawing) return;
    setDrawing(false);
    if (drawTimer.current) clearInterval(drawTimer.current);
    fire();
  };

  const fire = useCallback(() => {
    if (firing) return;
    setFiring(true);

    const power = drawPct;
    const aimX = aimAngle.x;
    const aimY = aimAngle.y;

    // Calculate hit position (arrow aim + wind + power influence)
    const hitX = targetCX + aimX * targetR * 0.6 + wind * (1 - power) * 3 + (Math.random() - 0.5) * (1 - power) * targetR * 0.8;
    const hitY = targetCY + aimY * targetR * 0.3 + (Math.random() - 0.5) * (1 - power) * targetR * 0.6;

    // Score based on distance from center
    const dist = Math.sqrt((hitX - targetCX) ** 2 + (hitY - targetCY) ** 2);
    let score = 0;
    if (dist < targetR * 0.18) score = 10;
    else if (dist < targetR * 0.36) score = 7;
    else if (dist < targetR * 0.56) score = 5;
    else if (dist < targetR * 0.78) score = 3;
    else if (dist < targetR) score = 1;

    // Animate arrow flight
    const sx = 38; // bow position
    const sy = 85;
    setArrowFly({ t: 0, sx, sy, ex: hitX, ey: hitY });

    const start = performance.now();
    const dur = 400 + (1 - power) * 200;

    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      setArrowFly(prev => prev ? { ...prev, t } : null);

      if (t < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        setArrowFly(null);
        setHitPos({ x: hitX, y: hitY, score });
        setArrows(prev => [...prev, { x: hitX, y: hitY, score }]);
        setMyScore(prev => prev + score);

        onMove({
          type: 'shoot',
          round, arrow, score,
          hitX, hitY,
          _keepTurn: arrow < ARROWS_PER_ROUND,
        });

        setTimeout(() => {
          setHitPos(null);
          setFiring(false);
          setDrawPct(0);
          setAimAngle({ x: 0, y: 0 });

          if (arrow < ARROWS_PER_ROUND) {
            setArrow(a => a + 1);
          } else if (round < ROUNDS) {
            setRound(r => r + 1);
            setArrow(1);
            setArrows([]);
          }
          // else: wait for opponent's last arrows, then check end
        }, 600);
      }
    };

    raf.current = requestAnimationFrame(animate);
  }, [firing, drawPct, aimAngle, wind, round, arrow, onMove]);

  const font = "'Courier New', monospace";

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: P.bg, fontFamily: font, overflow: 'hidden', touchAction: 'none' }}>

      {/* HUD Header */}
      <div style={{ padding: '8px 12px 4px', width: '100%', maxWidth: 500,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 900, color: P.matrix, margin: 0, letterSpacing: 2 }}>
            {'>'} NOUR_ARCHERY
          </h1>
          <div style={{ fontSize: 9, color: P.dim, letterSpacing: 1 }}>MATRIX PROTOCOL v2.1</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: P.matrix }}>R{round}/{ROUNDS} • A{arrow}/{ARROWS_PER_ROUND}</div>
          <div style={{ fontSize: 10, color: P.dim }}>WIND: {wind.toFixed(1)}</div>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 20, padding: '2px 0 6px', width: '100%' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: P.dim, letterSpacing: 2 }}>YOU</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: P.matrix }}>{myScore}</div>
        </div>
        <div style={{ fontSize: 12, color: P.dim, alignSelf: 'center' }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: P.dim, letterSpacing: 2 }}>OPP</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: P.red }}>{opScore}</div>
        </div>
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.div key={over ? 'over' : isPlayerTurn ? 't' : 'w'} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          style={{ padding: '2px 12px', borderRadius: 4, fontSize: 10, fontWeight: 700, marginBottom: 2,
            background: 'rgba(0,255,65,0.05)', border: `1px solid ${P.matrixDim}`,
            color: over ? (win === playerId ? P.matrix : P.red) : isPlayerTurn ? P.cyan : '#555',
          }}>
          {over ? (win === playerId ? '> ACCESS GRANTED - VICTORY' : '> CONNECTION LOST - DEFEAT')
            : isPlayerTurn ? '> READY TO FIRE' : '> AWAITING OPPONENT...'}
        </motion.div>
      </AnimatePresence>

      {/* Opponent info */}
      <AnimatePresence>
        {opInfo && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ padding: '2px 10px', borderRadius: 4, fontSize: 10, color: P.red,
              background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.15)' }}>
            {opInfo}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game area */}
      <div style={{ flex: 1, width: '100%', maxWidth: 500, position: 'relative' }}>
        <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%' }}
          onMouseDown={startDraw} onMouseMove={moveAim} onMouseUp={release}
          onTouchStart={startDraw} onTouchMove={moveAim} onTouchEnd={release}>

          {/* Background — matrix code rain */}
          <rect width="100" height="100" fill={P.bg} />
          <MatrixRain width={100} height={100} />

          {/* Grid lines */}
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i}>
              <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke={P.matrixDark} strokeWidth={0.2} />
              <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke={P.matrixDark} strokeWidth={0.2} />
            </g>
          ))}

          {/* Holographic target */}
          <HoloTarget cx={targetCX} cy={targetCY} size={targetR} wind={wind} />

          {/* Stuck arrows */}
          {arrows.map((a, i) => (
            <g key={i}>
              <circle cx={a.x} cy={a.y} r={0.8} fill={P.cyan} opacity={0.7} />
              <text x={a.x + 1.5} y={a.y - 1} fill={P.matrix} fontSize={3} fontFamily="monospace"
                opacity={0.5}>{a.score}</text>
            </g>
          ))}

          {/* Arrow in flight */}
          {arrowFly && (() => {
            const t = arrowFly.t;
            const x = arrowFly.sx + (arrowFly.ex - arrowFly.sx) * t;
            const y = arrowFly.sy + (arrowFly.ey - arrowFly.sy) * t - Math.sin(t * Math.PI) * 15;
            return (
              <g>
                {/* Trail */}
                <line x1={x + 3} y1={y + 2} x2={x + 8} y2={y + 6}
                  stroke={P.cyan} strokeWidth={0.4} opacity={0.3} />
                {/* Arrow */}
                <circle cx={x} cy={y} r={1} fill={P.cyan} />
                <circle cx={x} cy={y} r={2} fill="none" stroke={P.cyan} strokeWidth={0.2} opacity={0.3}>
                  <animate attributeName="r" from="2" to="5" dur="0.3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="0.3s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          })()}

          {/* Hit impact */}
          {hitPos && (
            <g>
              <motion.circle initial={{ r: 1, opacity: 1 }} animate={{ r: 6, opacity: 0 }}
                transition={{ duration: 0.5 }}
                cx={hitPos.x} cy={hitPos.y} fill="none" stroke={hitPos.score >= 7 ? P.red : P.matrix} strokeWidth={0.5} />
              <motion.text initial={{ opacity: 0, y: hitPos.y }} animate={{ opacity: 1, y: hitPos.y - 4 }}
                x={hitPos.x} textAnchor="middle" fill={hitPos.score >= 7 ? P.red : P.matrix}
                fontSize={hitPos.score === 10 ? 6 : 5} fontFamily="monospace" fontWeight={900}>
                +{hitPos.score}
              </motion.text>
            </g>
          )}

          {/* Cyber Bow */}
          <CyberBow drawPct={drawPct} />

          {/* Instruction */}
          {isPlayerTurn && !drawing && !firing && !over && (
            <text x="50" y="96" textAnchor="middle" fill={P.dim} fontSize="3" fontFamily="monospace">
              {'>'} HOLD + AIM + RELEASE
            </text>
          )}
        </svg>
      </div>
    </div>
  );
}
