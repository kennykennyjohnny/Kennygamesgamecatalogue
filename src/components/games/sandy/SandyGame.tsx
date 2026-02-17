import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════
// SANDY PONG — Beer Pong  ×  Rosé  ×  Plage Chic
//
// POV depuis le bout de table — ciel sunset, table bois chaud,
// verres de rosé cristal au lieu de solo cups
// Swipe/drag vers le haut pour lancer
// ═══════════════════════════════════════════════════════════════════════════

interface Cup { id: number; x: number; y: number; alive: boolean }

// Triangle 10 cups — positioned in percentage of SVG viewBox
function makeCups(): Cup[] {
  const cups: Cup[] = [];
  const rows = [1, 2, 3, 4];
  let id = 0;
  for (const rowSize of rows) {
    const rowIdx = rows.indexOf(rowSize);
    for (let i = 0; i < rowSize; i++) {
      cups.push({
        id: id++,
        x: 50 + (i - (rowSize - 1) / 2) * 11,
        y: 15 + rowIdx * 10,
        alive: true,
      });
    }
  }
  return cups;
}

// ── Rosé Wine Glass SVG ──────────────────────────────────────────────────────

function RoséGlass({ x, y, scale, alive, hit, glow }: {
  x: number; y: number; scale: number; alive: boolean; hit: boolean; glow?: boolean;
}) {
  if (!alive && !hit) return null;
  const s = scale;

  return (
    <g transform={`translate(${x}, ${y})`} opacity={hit ? 0.2 : 1}>
      {/* Shadow on table */}
      <ellipse cx={0} cy={10 * s} rx={5 * s} ry={1.5 * s} fill="rgba(0,0,0,0.15)" />

      {/* Base */}
      <ellipse cx={0} cy={9 * s} rx={4 * s} ry={1.2 * s}
        fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.15)" strokeWidth={0.3} />

      {/* Stem */}
      <rect x={-0.6 * s} y={2 * s} width={1.2 * s} height={7 * s}
        fill="rgba(255,255,255,0.15)" rx={0.4 * s} />

      {/* Bowl — elegant wine glass shape */}
      <path d={`
        M ${-5 * s} ${-7 * s}
        Q ${-6 * s} ${-1 * s}, ${-1.5 * s} ${2.5 * s}
        L ${1.5 * s} ${2.5 * s}
        Q ${6 * s} ${-1 * s}, ${5 * s} ${-7 * s}
        Z
      `}
        fill={hit ? 'rgba(60,30,40,0.2)' : 'rgba(255,255,255,0.06)'}
        stroke="rgba(255,255,255,0.2)" strokeWidth={0.3} />

      {/* Rosé wine inside */}
      {!hit && (
        <path d={`
          M ${-4.5 * s} ${-5.5 * s}
          Q ${-5.5 * s} ${-1 * s}, ${-1.5 * s} ${2 * s}
          L ${1.5 * s} ${2 * s}
          Q ${5.5 * s} ${-1 * s}, ${4.5 * s} ${-5.5 * s}
          Z
        `}
          fill="rgba(232,135,159,0.35)" />
      )}

      {/* Wine surface shimmer */}
      {!hit && (
        <ellipse cx={0} cy={-5.5 * s} rx={4 * s} ry={0.8 * s}
          fill="rgba(244,176,195,0.15)" />
      )}

      {/* Glass highlight — left side shine */}
      {!hit && (
        <path d={`
          M ${-4 * s} ${-6 * s}
          Q ${-5 * s} ${-2 * s}, ${-2 * s} ${1 * s}
          L ${-1.5 * s} ${0}
          Q ${-4 * s} ${-3 * s}, ${-3.2 * s} ${-6 * s}
          Z
        `}
          fill="rgba(255,255,255,0.18)" />
      )}

      {/* Rim */}
      <ellipse cx={0} cy={-7 * s} rx={5 * s} ry={1 * s}
        fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={0.3} />

      {/* Ambient glow when it's your turn */}
      {glow && !hit && (
        <circle cx={0} cy={-2 * s} r={6 * s} fill="none"
          stroke="rgba(232,135,159,0.08)" strokeWidth={0.3}>
          <animate attributeName="r" values={`${5 * s};${7 * s};${5 * s}`} dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════

export default function SandyGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: any) {
  const [myCups, setMyCups] = useState(makeCups);
  const [opCups, setOpCups] = useState(makeCups);
  const [throwing, setThrowing] = useState(false);
  const [ballPos, setBallPos] = useState<{x: number; y: number; s: number} | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [win, setWin] = useState<string | null>(null);
  const [splash, setSplash] = useState<{x: number; y: number} | null>(null);
  const [dragStart, setDragStart] = useState<{x: number; y: number} | null>(null);
  const [dragCur, setDragCur] = useState<{x: number; y: number} | null>(null);
  const [ballTrail, setBallTrail] = useState<{x: number; y: number}[]>([]);

  const svgRef = useRef<SVGSVGElement>(null);
  const raf = useRef<number>(0);
  const resultT = useRef<ReturnType<typeof setTimeout>>();

  // ── Sync ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId) return;

    if (m.type === 'throw') {
      const { hitId } = m;
      if (hitId !== null && hitId !== undefined) {
        setMyCups(prev => prev.map(c => c.id === hitId ? { ...c, alive: false } : c));
        const remaining = myCups.filter(c => c.alive && c.id !== hitId);
        if (remaining.length === 0) { setOver(true); setWin(opponentId); }
        setLastResult('💔 Touché !');
      } else {
        setLastResult('✨ Raté !');
      }
      if (resultT.current) clearTimeout(resultT.current);
      resultT.current = setTimeout(() => setLastResult(null), 1800);
    }
  }, [gameState?.lastMove]);

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    if (resultT.current) clearTimeout(resultT.current);
  }, []);

  // ── Throw ──────────────────────────────────────────────────────────────────

  const doThrow = useCallback((dx: number, dy: number) => {
    if (throwing || !isPlayerTurn || over) return;
    setThrowing(true);

    // Better aiming: dx controls left/right, dy controls depth
    const aimX = 50 + dx * 50;
    const power = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
    const noise = Math.max(0, 0.5 - power * 0.6) * 8;
    const finalX = Math.max(25, Math.min(75, aimX + (Math.random() - 0.5) * noise));
    const finalY = 18 + Math.abs(dy) * 15 + (Math.random() - 0.5) * noise * 0.5;

    const sx = 50, sy = 85;
    const start = performance.now();
    const dur = 500;

    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const x = sx + (finalX - sx) * ease;
      const y = sy + (finalY - sy) * ease - Math.sin(t * Math.PI) * 25;
      const s = 1 - t * 0.55;
      setBallPos({ x, y, s });
      setBallTrail(prev => [...prev.slice(-8), { x, y }]);

      if (t < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        const alive = opCups.filter(c => c.alive);
        let hitCup: Cup | null = null;
        let bestDist = 999;
        for (const cup of alive) {
          const d = Math.sqrt((cup.x - finalX) ** 2 + (cup.y - finalY) ** 2);
          if (d < 8 && d < bestDist) { hitCup = cup; bestDist = d; }
        }

        if (hitCup) {
          setOpCups(prev => prev.map(c => c.id === hitCup!.id ? { ...c, alive: false } : c));
          setSplash({ x: hitCup.x, y: hitCup.y });
          setTimeout(() => setSplash(null), 900);
          setLastResult('🥂 Touché !');
          const remaining = opCups.filter(c => c.alive && c.id !== hitCup!.id);
          if (remaining.length === 0) {
            setOver(true); setWin(playerId);
            onGameOver({ winner_id: playerId });
          }
        } else {
          setLastResult('💨 Raté…');
        }

        onMove({ type: 'throw', hitId: hitCup?.id ?? null, _keepTurn: false });
        if (resultT.current) clearTimeout(resultT.current);
        resultT.current = setTimeout(() => setLastResult(null), 1800);

        setTimeout(() => { setBallPos(null); setThrowing(false); setBallTrail([]); }, 400);
      }
    };

    raf.current = requestAnimationFrame(animate);
  }, [throwing, isPlayerTurn, over, opCups, onMove, onGameOver, playerId]);

  // ── Touch/Mouse ────────────────────────────────────────────────────────────

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const cy = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) / rect.width * 100, y: (cy - rect.top) / rect.height * 100 };
  };

  const onStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlayerTurn || throwing || over) return;
    const p = getPos(e);
    if (p.y < 50) return;
    setDragStart(p); setDragCur(p);
  };
  const onDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragStart) return;
    e.preventDefault();
    setDragCur(getPos(e));
  };
  const onEnd = () => {
    if (!dragStart || !dragCur) { setDragStart(null); setDragCur(null); return; }
    const dx = (dragCur.x - dragStart.x) / 100;
    const dy = (dragStart.y - dragCur.y) / 100;
    if (Math.abs(dy) < 0.02) { setDragStart(null); setDragCur(null); return; }
    setDragStart(null); setDragCur(null);
    doThrow(dx * 1.5, dy * 1.5);
  };

  const myAlive = myCups.filter(c => c.alive).length;
  const opAlive = opCups.filter(c => c.alive).length;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: '#0e0808', overflow: 'hidden', touchAction: 'none',
      fontFamily: "'Didot', 'Bodoni MT', Georgia, serif",
    }}>

      {/* Header */}
      <div style={{ padding: '8px 0 2px', textAlign: 'center', width: '100%', zIndex: 2 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, fontStyle: 'italic', margin: 0,
          background: 'linear-gradient(135deg, #f4b0c3, #e8879f, #d4a053)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>🥂 Sandy Pong</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 2 }}>
          <span style={{ fontSize: 10, color: 'rgba(244,176,195,0.35)' }}>Adversaire: {opAlive}/10</span>
          <span style={{ fontSize: 10, color: 'rgba(244,176,195,0.35)' }}>Toi: {myAlive}/10</span>
        </div>
      </div>

      {/* Status */}
      <motion.div key={over ? 'o' : isPlayerTurn ? 't' : 'w'} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '2px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, fontStyle: 'italic', marginBottom: 4, zIndex: 2,
          background: over ? 'rgba(52,199,89,0.06)' : isPlayerTurn ? 'rgba(232,135,159,0.06)' : 'rgba(80,80,80,0.04)',
          color: over ? '#4ade80' : isPlayerTurn ? '#f4b0c3' : '#555',
          border: `1px solid ${over ? 'rgba(52,199,89,0.1)' : isPlayerTurn ? 'rgba(232,135,159,0.1)' : 'rgba(50,50,50,0.05)'}`,
        }}>
        {over ? (win === playerId ? '🏆 Victoire !' : '💔 Défaite…') : isPlayerTurn ? '🎯 Glisse pour lancer !' : '⏳ Tour adverse…'}
      </motion.div>

      {/* Result popup */}
      <AnimatePresence>
        {lastResult && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)',
              padding: '8px 22px', borderRadius: 14, fontSize: 18, fontWeight: 900, fontStyle: 'italic',
              background: lastResult.includes('Touché') ? 'rgba(232,82,122,0.15)' : 'rgba(50,40,35,0.15)',
              color: lastResult.includes('Touché') ? '#e8527a' : '#888',
              border: `1px solid ${lastResult.includes('Touché') ? 'rgba(232,82,122,0.2)' : 'rgba(80,80,80,0.1)'}`,
              zIndex: 20, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
            }}>
            {lastResult}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game SVG — full scene */}
      <div style={{ flex: 1, width: '100%', maxWidth: 500, position: 'relative' }}>
        <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', cursor: isPlayerTurn && !over ? 'grab' : 'default' }}
          onMouseDown={onStart} onMouseMove={onDrag} onMouseUp={onEnd}
          onTouchStart={onStart} onTouchMove={onDrag} onTouchEnd={onEnd}>

          <defs>
            {/* Sunset sky */}
            <linearGradient id="sky" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#1a0520" />
              <stop offset="25%" stopColor="#3a0830" />
              <stop offset="45%" stopColor="#8b2050" />
              <stop offset="60%" stopColor="#c45030" />
              <stop offset="75%" stopColor="#d4903a" />
              <stop offset="100%" stopColor="#e8c070" />
            </linearGradient>
            {/* Wood table */}
            <linearGradient id="wood" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#3a2218" />
              <stop offset="30%" stopColor="#4a2c1e" />
              <stop offset="70%" stopColor="#5a3424" />
              <stop offset="100%" stopColor="#6a3c2a" />
            </linearGradient>
            {/* Table glow */}
            <radialGradient id="tableGlow" cx="50%" cy="20%" r="60%">
              <stop offset="0%" stopColor="rgba(232,135,159,0.06)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Sky background */}
          <rect width="100" height="100" fill="url(#sky)" />

          {/* Sun glow */}
          <circle cx="50" cy="8" r="20" fill="rgba(212,144,58,0.15)" />
          <circle cx="50" cy="8" r="8" fill="rgba(232,192,112,0.2)" />
          <circle cx="50" cy="8" r="3" fill="rgba(255,220,160,0.3)" />

          {/* Stars (faint in sunset) */}
          {[12, 28, 72, 85, 40, 65].map((sx, i) => (
            <circle key={i} cx={sx} cy={3 + i * 1.5} r={0.3} fill="white" opacity={0.15 + i * 0.02} />
          ))}

          {/* Horizon line */}
          <line x1="0" y1="55" x2="100" y2="55" stroke="rgba(212,144,58,0.08)" strokeWidth="0.3" />

          {/* Table surface — wood in perspective */}
          <polygon points="15,55 85,55 100,100 0,100" fill="url(#wood)" />
          <polygon points="15,55 85,55 100,100 0,100" fill="url(#tableGlow)" />

          {/* Wood grain lines */}
          {[60, 68, 76, 84, 92].map((yy, i) => {
            const xShrink = (100 - yy) * 0.3;
            return (
              <line key={i} x1={xShrink} y1={yy} x2={100 - xShrink} y2={yy}
                stroke="rgba(100,60,30,0.12)" strokeWidth={0.3} />
            );
          })}

          {/* Table edge highlight */}
          <line x1="15" y1="55" x2="85" y2="55" stroke="rgba(255,200,150,0.08)" strokeWidth="0.5" />

          {/* Center line on table */}
          <line x1="42" y1="55" x2="50" y2="100" stroke="rgba(255,200,150,0.03)" strokeWidth="0.3" />
          <line x1="58" y1="55" x2="50" y2="100" stroke="rgba(255,200,150,0.03)" strokeWidth="0.3" />

          {/* ── Opponent cups (far end, smaller) ── */}
          {opCups.map(cup => (
            <RoséGlass key={cup.id} x={cup.x} y={cup.y} scale={0.55}
              alive={cup.alive} hit={!cup.alive} glow={isPlayerTurn} />
          ))}

          {/* Splash when hit */}
          {splash && (
            <g>
              {[...Array(10)].map((_, i) => {
                const a = (i / 10) * Math.PI * 2;
                const r = 2 + Math.random() * 5;
                return (
                  <motion.circle key={i}
                    initial={{ cx: splash.x, cy: splash.y, r: 0.4, opacity: 0.7 }}
                    animate={{ cx: splash.x + Math.cos(a) * r, cy: splash.y + Math.sin(a) * r, r: 0, opacity: 0 }}
                    transition={{ duration: 0.7 }}
                    fill="rgba(232,135,159,0.6)" />
                );
              })}
              <motion.circle initial={{ r: 0.5, opacity: 0.5 }} animate={{ r: 7, opacity: 0 }}
                transition={{ duration: 0.9 }}
                cx={splash.x} cy={splash.y} fill="none" stroke="rgba(244,176,195,0.3)" strokeWidth={0.2} />
            </g>
          )}

          {/* Ball in flight */}
          {ballPos && (
            <g>
              {/* Ball trail */}
              {ballTrail.length > 1 && (
                <polyline
                  points={ballTrail.map(p => `${p.x},${p.y}`).join(' ')}
                  fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={1.2 * ballPos.s}
                  strokeLinecap="round" />
              )}
              {/* Ball shadow on table */}
              <ellipse cx={ballPos.x} cy={Math.max(ballPos.y + 3, 58)} rx={1.5 * ballPos.s} ry={0.5 * ballPos.s}
                fill="rgba(0,0,0,0.1)" />
              {/* Ball */}
              <circle cx={ballPos.x} cy={ballPos.y} r={1.8 * ballPos.s}
                fill="white" stroke="rgba(220,220,220,0.4)" strokeWidth={0.2} />
              <circle cx={ballPos.x - 0.4 * ballPos.s} cy={ballPos.y - 0.4 * ballPos.s}
                r={0.5 * ballPos.s} fill="rgba(255,255,255,0.7)" />
            </g>
          )}

          {/* ── My cups (near, larger, bottom of table) ── */}
          {myCups.map(cup => {
            const py = 60 + (cup.y - 15) * 0.8;
            const px = 50 + (cup.x - 50) * 1.3;
            return (
              <RoséGlass key={`m${cup.id}`} x={px} y={py} scale={0.85}
                alive={cup.alive} hit={!cup.alive} />
            );
          })}

          {/* Drag aim indicator with trajectory preview */}
          {dragStart && dragCur && (
            <g>
              {/* Trajectory preview arc */}
              {(() => {
                const dx = (dragCur.x - dragStart.x) / 100;
                const dy = (dragStart.y - dragCur.y) / 100;
                const power = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
                const aimX = 50 + dx * 50 * 1.5;
                const targetX = Math.max(25, Math.min(75, aimX));
                const targetY = 18 + Math.abs(dy) * 15 * 1.5;
                const pts: string[] = [];
                for (let t = 0; t <= 1; t += 0.05) {
                  const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                  const px = 50 + (targetX - 50) * ease;
                  const py = 85 + (targetY - 85) * ease - Math.sin(t * Math.PI) * 25;
                  pts.push(`${px},${py}`);
                }
                return (
                  <g>
                    <polyline points={pts.join(' ')}
                      fill="none" stroke="rgba(244,176,195,0.3)" strokeWidth={0.5} strokeDasharray="1.5,1" />
                    <circle cx={targetX} cy={targetY} r={2}
                      fill="none" stroke="rgba(244,176,195,0.3)" strokeWidth={0.3} />
                  </g>
                );
              })()}
              {/* Drag line */}
              <line x1={dragStart.x} y1={dragStart.y} x2={dragCur.x} y2={dragCur.y}
                stroke="rgba(244,176,195,0.25)" strokeWidth={0.4} strokeDasharray="1.5,1" />
              <circle cx={dragStart.x} cy={dragStart.y} r={1.5}
                fill="rgba(244,176,195,0.15)" stroke="rgba(244,176,195,0.2)" strokeWidth={0.2} />
              {/* Power indicator */}
              {(() => {
                const dy = dragStart.y - dragCur.y;
                const dx = dragCur.x - dragStart.x;
                const pwr = Math.min(100, Math.max(0, Math.sqrt(dx * dx + dy * dy) * 2));
                return (
                  <g>
                    <text x={dragStart.x + 4} y={dragStart.y - 2}
                      fill="rgba(244,176,195,0.4)" fontSize="3" fontFamily="Georgia, serif" fontStyle="italic"
                      fontWeight={700}>
                      {Math.round(pwr)}%
                    </text>
                    {/* Power bar */}
                    <rect x={dragStart.x + 4} y={dragStart.y} width={1.5} height={10} rx={0.5}
                      fill="rgba(0,0,0,0.15)" />
                    <rect x={dragStart.x + 4} y={dragStart.y + 10 - pwr / 10} width={1.5} height={pwr / 10} rx={0.5}
                      fill={pwr > 70 ? 'rgba(232,82,122,0.5)' : 'rgba(244,176,195,0.4)'} />
                  </g>
                );
              })()}
            </g>
          )}

          {/* Throw instruction */}
          {isPlayerTurn && !throwing && !over && !dragStart && (
            <motion.g animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2, repeat: Infinity }}>
              <text x="50" y="80" textAnchor="middle" fill="rgba(244,176,195,0.2)" fontSize="2.5"
                fontFamily="Georgia, serif" fontStyle="italic">↑ Glisse vers le haut pour lancer</text>
            </motion.g>
          )}
        </svg>
      </div>
    </div>
  );
}
