import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════
// SANDY PONG — Beer Pong thème Rosé & Plage
// Verres de rosé au lieu de solo cups, esthétique plage chic
// POV première personne — on lance la balle vers les verres adverses
// ═══════════════════════════════════════════════════════════════════════════

interface Cup { id: number; x: number; y: number; alive: boolean }

const P = {
  bg: 'linear-gradient(170deg, #1a0f14 0%, #271520 30%, #1e1018 60%, #120b10 100%)',
  table: 'linear-gradient(180deg, #2a1520 0%, #1a0d14 80%)',
  rosé: '#e8879f',
  roséLight: '#f4b0c3',
  roséGlass: 'rgba(232,135,159,0.25)',
  gold: '#d4a053',
  text: '#f4d0db',
  dim: 'rgba(244,176,195,0.4)',
  accent: '#e8527a',
};

// Triangle of 10 cups (beer pong formation)
function makeCups(): Cup[] {
  const cups: Cup[] = [];
  const rows = [1, 2, 3, 4];
  let id = 0;
  for (const rowSize of rows) {
    const rowIdx = rows.indexOf(rowSize);
    for (let i = 0; i < rowSize; i++) {
      cups.push({
        id: id++,
        x: 50 + (i - (rowSize - 1) / 2) * 14,
        y: 18 + rowIdx * 13,
        alive: true,
      });
    }
  }
  return cups;
}

// ── Rosé Glass SVG ───────────────────────────────────────────────────────────

function RoséGlass({ x, y, scale, alive, hit }: {
  x: number; y: number; scale: number; alive: boolean; hit: boolean;
}) {
  if (!alive && !hit) return null;

  const w = 14 * scale;
  const h = 22 * scale;

  return (
    <g transform={`translate(${x - w / 2}, ${y - h / 2})`} opacity={hit ? 0.4 : 1}>
      {/* Glass shadow */}
      <ellipse cx={w / 2} cy={h - 1} rx={w * 0.35} ry={2 * scale} fill="rgba(0,0,0,0.3)" />

      {/* Stem */}
      <rect x={w / 2 - 0.8 * scale} y={h * 0.55} width={1.6 * scale} height={h * 0.32}
        fill="rgba(255,255,255,0.25)" rx={0.5 * scale} />

      {/* Base */}
      <ellipse cx={w / 2} cy={h * 0.88} rx={w * 0.28} ry={1.5 * scale}
        fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.15)" strokeWidth={0.4 * scale} />

      {/* Bowl */}
      <path d={`
        M ${w * 0.2} ${h * 0.08}
        Q ${w * 0.12} ${h * 0.4}, ${w * 0.38} ${h * 0.56}
        L ${w * 0.62} ${h * 0.56}
        Q ${w * 0.88} ${h * 0.4}, ${w * 0.8} ${h * 0.08}
        Z
      `}
        fill={hit ? 'rgba(100,50,60,0.3)' : 'rgba(232,135,159,0.18)'}
        stroke="rgba(255,255,255,0.2)" strokeWidth={0.5 * scale} />

      {/* Rosé wine */}
      {!hit && (
        <path d={`
          M ${w * 0.23} ${h * 0.18}
          Q ${w * 0.16} ${h * 0.38}, ${w * 0.38} ${h * 0.52}
          L ${w * 0.62} ${h * 0.52}
          Q ${w * 0.84} ${h * 0.38}, ${w * 0.77} ${h * 0.18}
          Z
        `}
          fill="rgba(232,135,159,0.45)" />
      )}

      {/* Glass shine */}
      {!hit && (
        <path d={`
          M ${w * 0.28} ${h * 0.12}
          Q ${w * 0.22} ${h * 0.28}, ${w * 0.32} ${h * 0.35}
          L ${w * 0.36} ${h * 0.14}
          Z
        `}
          fill="rgba(255,255,255,0.3)" />
      )}

      {/* Rim highlight */}
      <ellipse cx={w / 2} cy={h * 0.08} rx={w * 0.3} ry={1.2 * scale}
        fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={0.4 * scale} />
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════

export default function SandyGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: any) {
  const [myCups, setMyCups] = useState(makeCups);
  const [opCups, setOpCups] = useState(makeCups);
  const [throwing, setThrowing] = useState(false);
  const [ballPos, setBallPos] = useState<{ x: number; y: number } | null>(null);
  const [ballAnim, setBallAnim] = useState<{ sx: number; sy: number; ex: number; ey: number; t: number } | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [win, setWin] = useState<string | null>(null);
  const [splash, setSplash] = useState<{ x: number; y: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCur, setDragCur] = useState<{ x: number; y: number } | null>(null);

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
        if (remaining.length === 0) {
          setOver(true);
          setWin(opponentId);
        }
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

  // ── Throw logic ────────────────────────────────────────────────────────────

  const doThrow = useCallback((dx: number, dy: number) => {
    if (throwing || !isPlayerTurn || over) return;
    setThrowing(true);

    // Aim: dx maps to x position, dy maps to accuracy
    const aimX = 50 + dx * 40;
    const aimY = 30 + Math.abs(dy) * 15;

    // Add randomness based on throw power
    const power = Math.sqrt(dx * dx + dy * dy);
    const noise = Math.max(0, 0.8 - power) * 8;
    const finalX = aimX + (Math.random() - 0.5) * noise;
    const finalY = aimY + (Math.random() - 0.5) * noise;

    // Animate ball
    const sx = 50;
    const sy = 88;
    setBallAnim({ sx, sy, ex: finalX, ey: finalY, t: 0 });

    const start = performance.now();
    const dur = 600;

    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      // Arc trajectory
      const x = sx + (finalX - sx) * t;
      const y = sy + (finalY - sy) * t - Math.sin(t * Math.PI) * 25;
      const scale = 1 - t * 0.5; // ball gets smaller as it flies away
      setBallPos({ x, y });

      if (t < 1) {
        raf.current = requestAnimationFrame(animate);
      } else {
        // Check hit
        const alive = opCups.filter(c => c.alive);
        let hitCup: Cup | null = null;
        let bestDist = 999;
        for (const cup of alive) {
          const d = Math.sqrt((cup.x - finalX) ** 2 + (cup.y - finalY) ** 2);
          if (d < 7 && d < bestDist) { hitCup = cup; bestDist = d; }
        }

        if (hitCup) {
          setOpCups(prev => prev.map(c => c.id === hitCup!.id ? { ...c, alive: false } : c));
          setSplash({ x: hitCup.x, y: hitCup.y });
          setTimeout(() => setSplash(null), 800);
          setLastResult('🍷 Touché !');
          const remaining = opCups.filter(c => c.alive && c.id !== hitCup!.id);
          if (remaining.length === 0) {
            setOver(true); setWin(playerId);
            onGameOver({ winner_id: playerId });
          }
        } else {
          setLastResult('💨 Raté...');
        }

        onMove({ type: 'throw', hitId: hitCup?.id ?? null, _keepTurn: false });

        if (resultT.current) clearTimeout(resultT.current);
        resultT.current = setTimeout(() => setLastResult(null), 1800);

        setTimeout(() => {
          setBallPos(null);
          setBallAnim(null);
          setThrowing(false);
        }, 500);
      }
    };

    raf.current = requestAnimationFrame(animate);
  }, [throwing, isPlayerTurn, over, opCups, onMove, onGameOver, playerId]);

  // ── Touch/mouse drag ──────────────────────────────────────────────────────

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
    if (p.y < 60) return; // only start from bottom half
    setDragStart(p);
    setDragCur(p);
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
    if (Math.abs(dy) < 0.03) { setDragStart(null); setDragCur(null); return; }
    setDragStart(null);
    setDragCur(null);
    doThrow(dx * 2, dy * 2);
  };

  const myAlive = myCups.filter(c => c.alive).length;
  const opAlive = opCups.filter(c => c.alive).length;
  const font = "'Didot', 'Georgia', serif";

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: P.bg, fontFamily: font, overflow: 'hidden', touchAction: 'none' }}>

      {/* Header */}
      <div style={{ padding: '10px 0 4px', textAlign: 'center', width: '100%' }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, fontStyle: 'italic', margin: 0,
          background: 'linear-gradient(135deg, #e8879f, #f4b0c3, #d4a053)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>🥂 Sandy Pong</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4 }}>
          <span style={{ fontSize: 11, color: P.dim }}>Toi: {opAlive}/10 restants</span>
          <span style={{ fontSize: 11, color: P.dim }}>Eux: {myAlive}/10 restants</span>
        </div>
      </div>

      {/* Status */}
      <AnimatePresence mode="wait">
        <motion.div key={over ? 'over' : isPlayerTurn ? 'turn' : 'wait'} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }} style={{ padding: '3px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
            fontStyle: 'italic', marginBottom: 4,
            background: over ? 'rgba(52,199,89,0.1)' : isPlayerTurn ? 'rgba(232,135,159,0.1)' : 'rgba(80,80,80,0.06)',
            color: over ? '#34C759' : isPlayerTurn ? P.rosé : '#6b6b6b',
            border: `1px solid ${over ? 'rgba(52,199,89,0.2)' : isPlayerTurn ? 'rgba(232,135,159,0.15)' : 'rgba(80,80,80,0.08)'}`,
          }}>
          {over ? (win === playerId ? '🏆 Victoire !' : '💔 Défaite...') : isPlayerTurn ? '🎯 Glisse pour lancer !' : '⏳ Tour adverse...'}
        </motion.div>
      </AnimatePresence>

      {/* Result popup */}
      <AnimatePresence>
        {lastResult && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
              padding: '8px 20px', borderRadius: 16, fontSize: 18, fontWeight: 900, fontStyle: 'italic',
              background: lastResult.includes('Touché') ? 'rgba(232,82,122,0.2)' : 'rgba(80,80,80,0.1)',
              color: lastResult.includes('Touché') ? P.accent : '#888',
              border: `1px solid ${lastResult.includes('Touché') ? 'rgba(232,82,122,0.3)' : 'rgba(80,80,80,0.15)'}`,
              zIndex: 20, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
            }}>
            {lastResult}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game table — POV perspective */}
      <div style={{ flex: 1, width: '100%', maxWidth: 500, position: 'relative' }}>
        <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: '100%', cursor: isPlayerTurn && !over ? 'pointer' : 'default' }}
          onMouseDown={onStart} onMouseMove={onDrag} onMouseUp={onEnd}
          onTouchStart={onStart} onTouchMove={onDrag} onTouchEnd={onEnd}>

          {/* Table surface (POV perspective) */}
          <defs>
            <linearGradient id="tableGrad" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#1a0d14" />
              <stop offset="60%" stopColor="#2a1520" />
              <stop offset="100%" stopColor="#1a0f14" />
            </linearGradient>
            <radialGradient id="spotGrad" cx="50%" cy="30%" r="50%">
              <stop offset="0%" stopColor="rgba(232,135,159,0.06)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Table */}
          <polygon points="20,8 80,8 95,100 5,100" fill="url(#tableGrad)"
            stroke="rgba(232,135,159,0.08)" strokeWidth="0.3" />
          <polygon points="20,8 80,8 95,100 5,100" fill="url(#spotGrad)" />

          {/* Center line */}
          <line x1="38" y1="52" x2="62" y2="52" stroke="rgba(232,135,159,0.06)" strokeWidth="0.3" />

          {/* Opponent cups (far end — smaller) */}
          {opCups.map(cup => (
            <RoséGlass key={cup.id} x={cup.x} y={cup.y} scale={0.7}
              alive={cup.alive} hit={!cup.alive} />
          ))}

          {/* Splash effect */}
          {splash && (
            <g>
              {[...Array(8)].map((_, i) => {
                const a = (i / 8) * Math.PI * 2;
                const r = 3 + Math.random() * 4;
                return (
                  <motion.circle key={i}
                    initial={{ cx: splash.x, cy: splash.y, r: 0.5, opacity: 0.8 }}
                    animate={{ cx: splash.x + Math.cos(a) * r, cy: splash.y + Math.sin(a) * r, r: 0, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    fill={P.rosé} />
                );
              })}
              <motion.circle initial={{ r: 1, opacity: 0.6 }} animate={{ r: 8, opacity: 0 }}
                transition={{ duration: 0.8 }}
                cx={splash.x} cy={splash.y} fill="none" stroke={P.rosé} strokeWidth={0.3} />
            </g>
          )}

          {/* Ball */}
          {ballPos && (
            <g>
              <circle cx={ballPos.x} cy={ballPos.y} r={2}
                fill="white" stroke="rgba(200,200,200,0.5)" strokeWidth={0.3} />
              <circle cx={ballPos.x - 0.5} cy={ballPos.y - 0.5} r={0.7}
                fill="rgba(255,255,255,0.6)" />
            </g>
          )}

          {/* My cups (near — larger, bottom) */}
          {myCups.map(cup => {
            const ny = 62 + (cup.y - 18) * 0.7;
            const nx = 50 + (cup.x - 50) * 1.2;
            return (
              <RoséGlass key={`m${cup.id}`} x={nx} y={ny} scale={1.0}
                alive={cup.alive} hit={!cup.alive} />
            );
          })}

          {/* Drag indicator */}
          {dragStart && dragCur && (
            <g>
              <line x1={dragStart.x} y1={dragStart.y} x2={dragCur.x} y2={dragCur.y}
                stroke={P.rosé} strokeWidth={0.5} strokeDasharray="1,1" opacity={0.4} />
              <circle cx={dragStart.x} cy={dragStart.y} r={1.5} fill={P.rosé} opacity={0.3} />
            </g>
          )}

          {/* Throw instruction */}
          {isPlayerTurn && !throwing && !over && !dragStart && (
            <g>
              <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                <text x="50" y="78" textAnchor="middle" fill={P.dim} fontSize="3"
                  fontFamily={font} fontWeight="700" fontStyle="italic">↑ Glisse vers le haut</text>
              </motion.g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
}
