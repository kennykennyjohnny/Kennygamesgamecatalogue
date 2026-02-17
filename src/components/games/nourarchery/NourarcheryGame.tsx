import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════
// NOUR ARCHERY — Tir à l'arc  ×  MATRIX / NÉO
//
// Le monde digital de Nour : pluie de code vert animée,
// cible holographique flottante, arc cybernétique,
// flèches = projectiles de données
// ═══════════════════════════════════════════════════════════════════════════

const ROUNDS = 5;
const ARROWS_PER_ROUND = 3;
const CHARS = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789';

const P = {
  bg: '#050505',
  matrix: '#00ff41',
  matrixMid: 'rgba(0,255,65,0.4)',
  matrixDim: 'rgba(0,255,65,0.12)',
  matrixDark: 'rgba(0,255,65,0.04)',
  cyan: '#00e5ff',
  cyanDim: 'rgba(0,229,255,0.2)',
  red: '#ff0044',
  redGlow: 'rgba(255,0,68,0.15)',
  text: '#c0ffc0',
  dim: 'rgba(0,255,65,0.25)',
};

// ── Animated Matrix Rain (canvas-based for performance) ──────────────────

function useMatrixRain(canvasRef: React.RefObject<HTMLCanvasElement | null>, w: number, h: number) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = w;
    canvas.height = h;

    const fontSize = 11;
    const cols = Math.floor(w / fontSize);
    const drops: number[] = Array(cols).fill(0).map(() => Math.random() * -50);

    let animId = 0;
    const draw = () => {
      ctx.fillStyle = 'rgba(5,5,5,0.08)';
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < cols; i++) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        const y = drops[i] * fontSize;

        // Lead character is bright white-green
        if (y > 0 && y < h) {
          ctx.fillStyle = drops[i] % 3 === 0 ? '#ffffff' : P.matrix;
          ctx.font = `${fontSize}px monospace`;
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          ctx.fillText(ch, i * fontSize, y);
          ctx.globalAlpha = 1;
        }

        drops[i] += 0.4 + Math.random() * 0.3;
        if (drops[i] * fontSize > h && Math.random() > 0.98) {
          drops[i] = Math.random() * -20;
        }
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [canvasRef, w, h]);
}

// ── Holographic Target ───────────────────────────────────────────────────────

function HoloTarget({ cx, cy, size, wind, pulse }: {
  cx: number; cy: number; size: number; wind: number; pulse: boolean;
}) {
  const rings = [
    { r: size, fill: P.matrixDark, stroke: P.matrixDim, pts: 1 },
    { r: size * 0.78, fill: 'rgba(0,255,65,0.05)', stroke: P.matrixMid, pts: 3 },
    { r: size * 0.56, fill: 'rgba(0,229,255,0.03)', stroke: P.cyanDim, pts: 5 },
    { r: size * 0.36, fill: 'rgba(0,229,255,0.06)', stroke: 'rgba(0,229,255,0.35)', pts: 7 },
    { r: size * 0.18, fill: P.redGlow, stroke: P.red, pts: 10 },
  ];

  return (
    <g>
      {/* Outer scan frame */}
      <rect x={cx - size - 5} y={cy - size - 5} width={(size + 5) * 2} height={(size + 5) * 2}
        fill="none" stroke={P.matrixDim} strokeWidth={0.2} rx={1} strokeDasharray="3,3" />

      {/* Scan lines */}
      {[-1, -0.5, 0, 0.5, 1].map((off, i) => (
        <line key={i} x1={cx - size - 4} y1={cy + off * size * 0.5}
          x2={cx + size + 4} y2={cy + off * size * 0.5}
          stroke={P.matrixDark} strokeWidth={0.15} />
      ))}

      {/* Rings */}
      {rings.map(({ r, fill, stroke, pts }, i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={0.4}
            strokeDasharray={i < 2 ? '1.5,1.5' : 'none'} />
          {/* Score labels on right side */}
          <text x={cx + r + 2} y={cy + 1.5}
            fill={stroke} fontSize={3} fontFamily="monospace" opacity={0.5}>{pts}</text>
        </g>
      ))}

      {/* Crosshairs */}
      <line x1={cx - size - 3} y1={cy} x2={cx + size + 3} y2={cy} stroke={P.matrixDim} strokeWidth={0.2} />
      <line x1={cx} y1={cy - size - 3} x2={cx} y2={cy + size + 3} stroke={P.matrixDim} strokeWidth={0.2} />

      {/* Bullseye */}
      <circle cx={cx} cy={cy} r={size * 0.05} fill={P.red} opacity={0.9}>
        <animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite" />
      </circle>
      {pulse && (
        <circle cx={cx} cy={cy} r={size * 0.12} fill="none" stroke={P.red} strokeWidth={0.3} opacity={0.4}>
          <animate attributeName="r" values={`${size * 0.08};${size * 0.2};${size * 0.08}`} dur="1.5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Corner brackets */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([dx, dy], i) => {
        const bx = cx + dx * (size + 4);
        const by = cy + dy * (size + 4);
        const bLen = 3;
        return (
          <g key={i}>
            <line x1={bx} y1={by} x2={bx} y2={by - dy * bLen} stroke={P.matrix} strokeWidth={0.6} />
            <line x1={bx} y1={by} x2={bx - dx * bLen} y2={by} stroke={P.matrix} strokeWidth={0.6} />
          </g>
        );
      })}

      {/* Wind HUD */}
      <g transform={`translate(${cx}, ${cy + size + 10})`}>
        <rect x={-18} y={-4} width={36} height={8} rx={1}
          fill="rgba(0,255,65,0.03)" stroke={P.matrixDim} strokeWidth={0.2} />
        <text x={0} y={1.5} textAnchor="middle" fill={P.matrixMid} fontSize={4} fontFamily="monospace" fontWeight={700}>
          WIND {wind > 0 ? '→' : wind < 0 ? '←' : '○'} {Math.abs(wind).toFixed(1)}
        </text>
      </g>
    </g>
  );
}

// ── Cyber Bow ────────────────────────────────────────────────────────────────

function CyberBow({ drawPct, aimX }: { drawPct: number; aimX: number }) {
  const bowX = 50 + aimX * 3;
  const bowY = 82;
  const bowH = 50;
  const curve = 7 + drawPct * 5;
  const stringPull = drawPct * 10;
  const topY = bowY - bowH / 2;
  const botY = bowY + bowH / 2;

  return (
    <g>
      {/* Bow shadow / glow */}
      {drawPct > 0 && (
        <circle cx={bowX} cy={bowY} r={20} fill="none"
          stroke={P.matrixDim} strokeWidth={0.2} opacity={drawPct * 0.3}>
          <animate attributeName="r" values="18;22;18" dur="1s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Bow limbs */}
      <path d={`M ${bowX} ${topY} Q ${bowX + curve} ${bowY} ${bowX} ${botY}`}
        fill="none" stroke={P.matrix} strokeWidth={1.5} opacity={0.8} />
      {/* Inner glow */}
      <path d={`M ${bowX} ${topY} Q ${bowX + curve + 0.8} ${bowY} ${bowX} ${botY}`}
        fill="none" stroke={P.cyan} strokeWidth={0.4} opacity={0.3} />

      {/* Limb tips — glowing nodes */}
      <circle cx={bowX} cy={topY} r={1.8} fill={P.matrix} opacity={0.9} />
      <circle cx={bowX} cy={topY} r={3} fill="none" stroke={P.matrix} strokeWidth={0.2} opacity={0.3} />
      <circle cx={bowX} cy={botY} r={1.8} fill={P.matrix} opacity={0.9} />
      <circle cx={bowX} cy={botY} r={3} fill="none" stroke={P.matrix} strokeWidth={0.2} opacity={0.3} />

      {/* String */}
      <line x1={bowX} y1={topY} x2={bowX - stringPull} y2={bowY}
        stroke={P.cyan} strokeWidth={0.5} opacity={0.7} />
      <line x1={bowX - stringPull} y1={bowY} x2={bowX} y2={botY}
        stroke={P.cyan} strokeWidth={0.5} opacity={0.7} />

      {/* Nock point */}
      {drawPct > 0 && (
        <g>
          <circle cx={bowX - stringPull} cy={bowY} r={1.2} fill={P.cyan}>
            <animate attributeName="opacity" values="0.6;1;0.6" dur="0.4s" repeatCount="indefinite" />
          </circle>

          {/* Arrow on string */}
          <line x1={bowX - stringPull} y1={bowY} x2={bowX - stringPull - 12} y2={bowY}
            stroke={P.cyan} strokeWidth={0.7} />
          {/* Arrowhead */}
          <polygon points={`
            ${bowX - stringPull - 12},${bowY - 2}
            ${bowX - stringPull - 16},${bowY}
            ${bowX - stringPull - 12},${bowY + 2}
          `} fill={P.cyan} />
          {/* Data trail on arrow */}
          <text x={bowX - stringPull - 5} y={bowY - 2}
            fill={P.matrixDim} fontSize={2.5} fontFamily="monospace">
            {'>'}{'>'}{'>'}
          </text>
        </g>
      )}

      {/* Power HUD */}
      {drawPct > 0 && (
        <g>
          <rect x={bowX + 6} y={bowY - 8} width={2} height={16} rx={1}
            fill="rgba(0,0,0,0.5)" stroke={P.matrixDim} strokeWidth={0.2} />
          <rect x={bowX + 6} y={bowY + 8 - drawPct * 16} width={2} height={drawPct * 16} rx={1}
            fill={drawPct > 0.7 ? P.red : P.matrix} />
          <text x={bowX + 12} y={bowY + 1}
            fill={P.matrixMid} fontSize={3} fontFamily="monospace" fontWeight={700}>
            {Math.round(drawPct * 100)}%
          </text>
        </g>
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
  const [arrowFly, setArrowFly] = useState<{t: number; sx: number; sy: number; ex: number; ey: number} | null>(null);
  const [hitPos, setHitPos] = useState<{x: number; y: number; score: number} | null>(null);
  const [arrows, setArrows] = useState<{x: number; y: number; score: number}[]>([]);
  const [wind, setWind] = useState(0);
  const [over, setOver] = useState(false);
  const [win, setWin] = useState<string | null>(null);
  const [opInfo, setOpInfo] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawTimer = useRef<ReturnType<typeof setInterval>>();
  const raf = useRef<number>(0);
  const infoT = useRef<ReturnType<typeof setTimeout>>();

  // Matrix rain animation
  useMatrixRain(canvasRef, 400, 600);

  // Deterministic wind
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

      if (m.round === ROUNDS && m.arrow === ARROWS_PER_ROUND) {
        setTimeout(() => {
          const finalOp = opScore + m.score;
          if (myScore > finalOp) {
            setOver(true); setWin(playerId); onGameOver({ winner_id: playerId });
          } else if (finalOp > myScore) {
            setOver(true); setWin(opponentId);
          } else {
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
  const targetCY = 30;
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
    if (p.y < 50) return;
    setDrawing(true);
    setDrawPct(0);
    drawTimer.current = setInterval(() => {
      setDrawPct(prev => Math.min(prev + 0.02, 1));
    }, 25);
  };

  const moveAim = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    e.preventDefault();
    const p = getPos(e);
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
    const hitX = targetCX + aimAngle.x * targetR * 0.5 + wind * (1 - power) * 3
      + (Math.random() - 0.5) * (1 - power) * targetR * 0.7;
    const hitY = targetCY + aimAngle.y * targetR * 0.25
      + (Math.random() - 0.5) * (1 - power) * targetR * 0.5;

    const dist = Math.sqrt((hitX - targetCX) ** 2 + (hitY - targetCY) ** 2);
    let score = 0;
    if (dist < targetR * 0.18) score = 10;
    else if (dist < targetR * 0.36) score = 7;
    else if (dist < targetR * 0.56) score = 5;
    else if (dist < targetR * 0.78) score = 3;
    else if (dist < targetR) score = 1;

    const sx = 40, sy = 82;
    setArrowFly({ t: 0, sx, sy, ex: hitX, ey: hitY });
    const start = performance.now();
    const dur = 350 + (1 - power) * 150;

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
          type: 'shoot', round, arrow, score, hitX, hitY,
          _keepTurn: arrow < ARROWS_PER_ROUND,
        });

        setTimeout(() => {
          setHitPos(null); setFiring(false);
          setDrawPct(0); setAimAngle({ x: 0, y: 0 });
          if (arrow < ARROWS_PER_ROUND) {
            setArrow(a => a + 1);
          } else if (round < ROUNDS) {
            setRound(r => r + 1); setArrow(1); setArrows([]);
          }
        }, 600);
      }
    };

    raf.current = requestAnimationFrame(animate);
  }, [firing, drawPct, aimAngle, wind, round, arrow, onMove]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: P.bg, overflow: 'hidden', touchAction: 'none',
      fontFamily: "'Courier New', 'Fira Code', monospace", position: 'relative',
    }}>

      {/* Matrix rain canvas — behind everything */}
      <canvas ref={canvasRef} style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 500, height: '100%', opacity: 0.45, pointerEvents: 'none',
      }} />

      {/* HUD Header */}
      <div style={{ padding: '6px 12px 2px', width: '100%', maxWidth: 500, zIndex: 2,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 900, color: P.matrix, margin: 0, letterSpacing: 3,
            textShadow: `0 0 15px ${P.matrix}, 0 0 30px rgba(0,255,65,0.2)` }}>
            {'>'} NOUR.ARCHERY
          </h1>
          <div style={{ fontSize: 8, color: P.dim, letterSpacing: 2 }}>MATRIX PROTOCOL v3.0</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, color: P.matrix, letterSpacing: 1 }}>
            R{round}/{ROUNDS} • A{arrow}/{ARROWS_PER_ROUND}
          </div>
          <div style={{ fontSize: 9, color: P.dim }}>
            WIND: {wind > 0 ? '→' : wind < 0 ? '←' : '○'} {Math.abs(wind).toFixed(1)}
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, padding: '0 0 4px', width: '100%', zIndex: 2 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: P.dim, letterSpacing: 3 }}>NEO</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: P.matrix,
            textShadow: `0 0 12px ${P.matrix}` }}>{myScore}</div>
        </div>
        <div style={{ fontSize: 11, color: P.dim, alignSelf: 'center' }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: P.dim, letterSpacing: 3 }}>AGENT</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: P.red,
            textShadow: `0 0 12px ${P.red}` }}>{opScore}</div>
        </div>
      </div>

      {/* Status */}
      <motion.div key={over ? 'o' : isPlayerTurn ? 't' : 'w'} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        style={{ padding: '2px 10px', borderRadius: 2, fontSize: 9, fontWeight: 700, marginBottom: 2, zIndex: 2,
          background: 'rgba(0,255,65,0.03)', border: `1px solid ${P.matrixDim}`,
          color: over ? (win === playerId ? P.matrix : P.red) : isPlayerTurn ? P.cyan : '#333',
          letterSpacing: 1,
        }}>
        {over ? (win === playerId ? '> ACCESS_GRANTED // VICTORY' : '> CONNECTION_LOST // DEFEAT')
          : isPlayerTurn ? '> READY_TO_FIRE' : '> AWAITING_OPPONENT...'}
      </motion.div>

      {/* Opponent info */}
      <AnimatePresence>
        {opInfo && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ padding: '1px 8px', borderRadius: 2, fontSize: 9, color: P.red, zIndex: 2,
              background: 'rgba(255,0,0,0.03)', border: '1px solid rgba(255,0,0,0.1)',
              letterSpacing: 1 }}>
            {opInfo}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game area */}
      <div style={{ flex: 1, width: '100%', maxWidth: 500, position: 'relative', zIndex: 1 }}>
        <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%' }}
          onMouseDown={startDraw} onMouseMove={moveAim} onMouseUp={release}
          onTouchStart={startDraw} onTouchMove={moveAim} onTouchEnd={release}>

          {/* Transparent bg (canvas shows through) */}
          <rect width="100" height="100" fill="transparent" />

          {/* Subtle grid overlay */}
          {Array.from({ length: 11 }, (_, i) => (
            <g key={i}>
              <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke={P.matrixDark} strokeWidth={0.15} />
              <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke={P.matrixDark} strokeWidth={0.15} />
            </g>
          ))}

          {/* Perspective floor lines */}
          {[55, 62, 70, 80, 92].map((y, i) => (
            <line key={i} x1={50 - (100 - y) * 0.8} y1={y} x2={50 + (100 - y) * 0.8} y2={y}
              stroke={P.matrixDark} strokeWidth={0.15} />
          ))}

          {/* Target */}
          <HoloTarget cx={targetCX} cy={targetCY} size={targetR} wind={wind} pulse={isPlayerTurn && !firing} />

          {/* Stuck arrows */}
          {arrows.map((a, i) => (
            <g key={i}>
              {/* Arrow embedded */}
              <line x1={a.x + 2} y1={a.y + 2} x2={a.x - 1} y2={a.y - 1}
                stroke={P.cyan} strokeWidth={0.5} opacity={0.5} />
              <circle cx={a.x} cy={a.y} r={0.7} fill={a.score >= 7 ? P.red : P.cyan} opacity={0.8} />
              <text x={a.x + 2} y={a.y - 1.5} fill={a.score >= 7 ? P.red : P.matrix}
                fontSize={2.5} fontFamily="monospace" fontWeight={700} opacity={0.6}>
                {a.score}
              </text>
            </g>
          ))}

          {/* Arrow in flight */}
          {arrowFly && (() => {
            const t = arrowFly.t;
            const x = arrowFly.sx + (arrowFly.ex - arrowFly.sx) * t;
            const y = arrowFly.sy + (arrowFly.ey - arrowFly.sy) * t - Math.sin(t * Math.PI) * 12;
            return (
              <g>
                {/* Data trail */}
                {Array.from({ length: 6 }, (_, i) => {
                  const tt = Math.max(0, t - i * 0.04);
                  const tx = arrowFly.sx + (arrowFly.ex - arrowFly.sx) * tt;
                  const ty = arrowFly.sy + (arrowFly.ey - arrowFly.sy) * tt - Math.sin(tt * Math.PI) * 12;
                  return <circle key={i} cx={tx} cy={ty} r={0.3} fill={P.cyan} opacity={0.5 - i * 0.08} />;
                })}
                {/* Arrow head */}
                <circle cx={x} cy={y} r={1.2} fill={P.cyan} />
                <circle cx={x} cy={y} r={2.5} fill="none" stroke={P.cyan} strokeWidth={0.2} opacity={0.3}>
                  <animate attributeName="r" from="2" to="5" dur="0.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.3" to="0" dur="0.2s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          })()}

          {/* Hit impact */}
          <AnimatePresence>
            {hitPos && (
              <g>
                <motion.circle initial={{ r: 1, opacity: 0.8 }} animate={{ r: 8, opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  cx={hitPos.x} cy={hitPos.y} fill="none"
                  stroke={hitPos.score >= 7 ? P.red : P.matrix} strokeWidth={0.4} />
                {/* Digital glitch effect */}
                {Array.from({ length: 4 }, (_, i) => (
                  <motion.rect key={i}
                    initial={{ opacity: 0.6, x: hitPos.x - 3, width: 6, height: 0.5 }}
                    animate={{ opacity: 0, x: hitPos.x - 5 + Math.random() * 10, width: Math.random() * 8 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    y={hitPos.y - 2 + i * 1.5}
                    fill={hitPos.score >= 7 ? P.red : P.matrix} />
                ))}
                <motion.text initial={{ opacity: 0, y: hitPos.y }} animate={{ opacity: 1, y: hitPos.y - 5 }}
                  transition={{ duration: 0.3 }}
                  x={hitPos.x} textAnchor="middle" fill={hitPos.score >= 7 ? P.red : P.matrix}
                  fontSize={hitPos.score === 10 ? 7 : 5} fontFamily="monospace" fontWeight={900}>
                  +{hitPos.score}
                </motion.text>
              </g>
            )}
          </AnimatePresence>

          {/* Cyber Bow */}
          <CyberBow drawPct={drawPct} aimX={aimAngle.x} />

          {/* Instruction */}
          {isPlayerTurn && !drawing && !firing && !over && (
            <motion.text animate={{ opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 2.5, repeat: Infinity }}
              x="50" y="97" textAnchor="middle" fill={P.dim} fontSize="2.5" fontFamily="monospace" letterSpacing="1">
              {'>'} HOLD + AIM + RELEASE
            </motion.text>
          )}
        </svg>
      </div>
    </div>
  );
}
