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

// Re-rack formations (triangle shapes centered at x=50)
function triangleFormation(n: number, startY: number): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  if (n === 10) {
    const rows = [1, 2, 3, 4];
    for (const rowSize of rows) {
      const rowIdx = rows.indexOf(rowSize);
      for (let i = 0; i < rowSize; i++) {
        positions.push({ x: 50 + (i - (rowSize - 1) / 2) * 11, y: startY + rowIdx * 10 });
      }
    }
  } else if (n === 6) {
    const rows = [1, 2, 3];
    for (const rowSize of rows) {
      const rowIdx = rows.indexOf(rowSize);
      for (let i = 0; i < rowSize; i++) {
        positions.push({ x: 50 + (i - (rowSize - 1) / 2) * 11, y: startY + rowIdx * 10 });
      }
    }
  } else if (n === 3) {
    const rows = [1, 2];
    for (const rowSize of rows) {
      const rowIdx = rows.indexOf(rowSize);
      for (let i = 0; i < rowSize; i++) {
        positions.push({ x: 50 + (i - (rowSize - 1) / 2) * 11, y: startY + rowIdx * 10 });
      }
    }
  }
  return positions;
}

function makeCups(): Cup[] {
  return triangleFormation(10, 15).map((p, i) => ({ id: i, ...p, alive: true }));
}

// Re-rack: reposition alive cups into a tight triangle
function rerackCups(cups: Cup[]): Cup[] {
  const alive = cups.filter(c => c.alive);
  const n = alive.length;
  const positions = triangleFormation(n, 15);
  if (positions.length === 0) return cups;
  return alive.map((c, i) => ({ ...c, x: positions[i].x, y: positions[i].y }));
}

// ── Rosé Wine Glass SVG ──────────────────────────────────────────────────────

function RoséGlass({ x, y, scale, alive, hit, glow }: {
  x: number; y: number; scale: number; alive: boolean; hit: boolean; glow?: boolean;
}) {
  if (!alive && !hit) return null;
  const s = scale;

  return (
    <g transform={`translate(${x}, ${y})`} opacity={hit ? 0.15 : 1}>
      {/* Shadow on table */}
      <ellipse cx={0} cy={10 * s} rx={5.5 * s} ry={1.8 * s} fill="rgba(0,0,0,0.25)" />

      {/* Base — crystal foot */}
      <ellipse cx={0} cy={9 * s} rx={4.5 * s} ry={1.4 * s}
        fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.25)" strokeWidth={0.4} />

      {/* Stem — crystal */}
      <rect x={-0.7 * s} y={2 * s} width={1.4 * s} height={7 * s}
        fill="rgba(255,255,255,0.22)" rx={0.5 * s} />
      <rect x={-0.3 * s} y={2.5 * s} width={0.6 * s} height={6 * s}
        fill="rgba(255,255,255,0.08)" rx={0.3 * s} />

      {/* Bowl — elegant wine glass shape */}
      <path d={`
        M ${-5.5 * s} ${-7.5 * s}
        Q ${-6.5 * s} ${-1 * s}, ${-1.5 * s} ${2.5 * s}
        L ${1.5 * s} ${2.5 * s}
        Q ${6.5 * s} ${-1 * s}, ${5.5 * s} ${-7.5 * s}
        Z
      `}
        fill={hit ? 'rgba(60,30,40,0.15)' : 'rgba(255,255,255,0.1)'}
        stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />

      {/* Rosé wine inside — stronger pink */}
      {!hit && (
        <>
          <path d={`
            M ${-5 * s} ${-6 * s}
            Q ${-5.8 * s} ${-1 * s}, ${-1.5 * s} ${2 * s}
            L ${1.5 * s} ${2 * s}
            Q ${5.8 * s} ${-1 * s}, ${5 * s} ${-6 * s}
            Z
          `}
            fill="rgba(232,100,140,0.55)" />
          {/* Wine depth gradient */}
          <path d={`
            M ${-4 * s} ${-3 * s}
            Q ${-4.5 * s} ${0}, ${-1.5 * s} ${2 * s}
            L ${1.5 * s} ${2 * s}
            Q ${4.5 * s} ${0}, ${4 * s} ${-3 * s}
            Z
          `}
            fill="rgba(180,50,80,0.25)" />
        </>
      )}

      {/* Wine surface shimmer — more visible */}
      {!hit && (
        <ellipse cx={0} cy={-6 * s} rx={4.5 * s} ry={1 * s}
          fill="rgba(255,180,210,0.3)" />
      )}

      {/* Glass highlight — left side shine, stronger */}
      {!hit && (
        <path d={`
          M ${-4.2 * s} ${-6.5 * s}
          Q ${-5.2 * s} ${-2 * s}, ${-2 * s} ${1 * s}
          L ${-1.5 * s} ${0}
          Q ${-4 * s} ${-3 * s}, ${-3.5 * s} ${-6.5 * s}
          Z
        `}
          fill="rgba(255,255,255,0.28)" />
      )}

      {/* Right side subtle highlight */}
      {!hit && (
        <path d={`
          M ${4 * s} ${-5 * s}
          Q ${4.5 * s} ${-2 * s}, ${2 * s} ${0.5 * s}
          L ${1.8 * s} ${0}
          Q ${3.8 * s} ${-2.5 * s}, ${3.5 * s} ${-5 * s}
          Z
        `}
          fill="rgba(255,255,255,0.08)" />
      )}

      {/* Rim — stronger */}
      <ellipse cx={0} cy={-7.5 * s} rx={5.5 * s} ry={1.2 * s}
        fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={0.4} />

      {/* Ambient glow when it's your turn */}
      {glow && !hit && (
        <circle cx={0} cy={-2 * s} r={7 * s} fill="none"
          stroke="rgba(232,135,159,0.12)" strokeWidth={0.5}>
          <animate attributeName="r" values={`${6 * s};${8 * s};${6 * s}`} dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
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
  // Beer pong turn state: 2 shots per turn, "balls back" if both hit
  const [shotsLeft, setShotsLeft] = useState(2);
  const [turnHits, setTurnHits] = useState(0);
  const [rerackMsg, setRerackMsg] = useState<string | null>(null);
  const [hotHand, setHotHand] = useState(0);

  const svgRef = useRef<SVGSVGElement>(null);
  const raf = useRef<number>(0);
  const resultT = useRef<ReturnType<typeof setTimeout>>();
  const reconstructed = useRef(false);

  // ── Reconstruct state from move history ──────────────────────────────────

  useEffect(() => {
    if (reconstructed.current || !gameState?.moves) return;
    const moves = gameState.moves as any[];
    if (moves.length === 0) return;

    let myC = makeCups();
    let opC = makeCups();

    for (const m of moves) {
      if (m.type === 'throw' && m.hitId !== null && m.hitId !== undefined) {
        if (m.playerId === playerId) {
          opC = opC.map(c => c.id === m.hitId ? { ...c, alive: false } : c);
        } else {
          myC = myC.map(c => c.id === m.hitId ? { ...c, alive: false } : c);
        }
      }
      if (m.type === 'rerack' && m.playerId === playerId) {
        opC = rerackCups(opC);
      } else if (m.type === 'rerack' && m.playerId !== playerId) {
        myC = rerackCups(myC);
      }
    }

    setMyCups(myC);
    setOpCups(opC);

    const myAlive = myC.filter(c => c.alive).length;
    const opAlive = opC.filter(c => c.alive).length;
    if (myAlive === 0) { setOver(true); setWin(opponentId); }
    if (opAlive === 0) { setOver(true); setWin(playerId); }

    reconstructed.current = true;
  }, [gameState, playerId, opponentId]);

  // ── Sync ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId) return;

    if (m.type === 'throw') {
      const { hitId } = m;
      if (hitId !== null && hitId !== undefined) {
        setMyCups(prev => {
          const updated = prev.map(c => c.id === hitId ? { ...c, alive: false } : c);
          if (updated.filter(c => c.alive).length === 0) { setOver(true); setWin(opponentId); }
          // Show splash at the hit cup position (projected to near-view)
          const hitCup = prev.find(c => c.id === hitId);
          if (hitCup) {
            const py = 60 + (hitCup.y - 15) * 0.8;
            const px = 50 + (hitCup.x - 50) * 1.3;
            setSplash({ x: px, y: py });
            setTimeout(() => setSplash(null), 900);
          }
          return updated;
        });
        setLastResult('💔 Touché !');
      } else {
        setLastResult('✨ Raté !');
      }
      if (resultT.current) clearTimeout(resultT.current);
      resultT.current = setTimeout(() => setLastResult(null), 1800);
    }

    if (m.type === 'rerack') {
      setMyCups(prev => rerackCups(prev));
      setRerackMsg('🔄 Réalignement !');
      setTimeout(() => setRerackMsg(null), 2000);
    }
  }, [gameState?.lastMove]);

  useEffect(() => () => {
    cancelAnimationFrame(raf.current);
    if (resultT.current) clearTimeout(resultT.current);
  }, []);

  // Reset shots when it becomes my turn
  useEffect(() => {
    if (isPlayerTurn) {
      setShotsLeft(2);
      setTurnHits(0);
    }
  }, [isPlayerTurn]);

  // ── Throw ──────────────────────────────────────────────────────────────────

  const doThrow = useCallback((dx: number, dy: number) => {
    if (throwing || !isPlayerTurn || over || shotsLeft <= 0) return;
    setThrowing(true);

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

        const newShotsLeft = shotsLeft - 1;
        const newHits = hitCup ? turnHits + 1 : turnHits;

        if (hitCup) {
          setOpCups(prev => prev.map(c => c.id === hitCup!.id ? { ...c, alive: false } : c));
          setSplash({ x: hitCup.x, y: hitCup.y });
          setTimeout(() => setSplash(null), 900);
          setHotHand(h => h + 1);
          const streak = hotHand + 1;
          setLastResult(streak >= 3 ? `🔥🔥🔥 EN FEU ! (${streak})` : streak >= 2 ? `🔥 Hot hand ! (${streak})` : '🥂 Touché !');
          const remaining = opCups.filter(c => c.alive && c.id !== hitCup!.id);
          if (remaining.length === 0) {
            setOver(true); setWin(playerId);
            onGameOver({ winner_id: playerId });
            onMove({ type: 'throw', hitId: hitCup.id, _keepTurn: false });
            if (resultT.current) clearTimeout(resultT.current);
            resultT.current = setTimeout(() => setLastResult(null), 1800);
            setTimeout(() => { setBallPos(null); setThrowing(false); setBallTrail([]); }, 400);
            return;
          }

          // Check re-rack thresholds (6 and 3 cups)
          const aliveCount = remaining.length;
          if (aliveCount === 6 || aliveCount === 3) {
            setTimeout(() => {
              setOpCups(prev => rerackCups(prev));
              setRerackMsg(`🔄 Réalignement ! (${aliveCount} verres)`);
              setTimeout(() => setRerackMsg(null), 2000);
              onMove({ type: 'rerack', _keepTurn: true });
            }, 600);
          }
        } else {
          setLastResult('💨 Raté…');
          setHotHand(0);
        }

        // Send the throw move — keep turn as long as we have shots or balls back triggers
        const isLastShot = newShotsLeft <= 0;
        const ballsBack = isLastShot && newHits >= 2;
        const keepTurn = !isLastShot || ballsBack;

        onMove({ type: 'throw', hitId: hitCup?.id ?? null, _keepTurn: keepTurn });

        setTurnHits(newHits);

        if (ballsBack) {
          // Both shots hit! Grant 2 bonus shots
          setShotsLeft(2);
          setTurnHits(0);
          setTimeout(() => {
            setLastResult('🔥 Balls back ! 2 tirs bonus !');
            if (resultT.current) clearTimeout(resultT.current);
            resultT.current = setTimeout(() => setLastResult(null), 2500);
          }, 500);
        } else if (isLastShot) {
          setShotsLeft(0);
        } else {
          setShotsLeft(newShotsLeft);
        }

        if (resultT.current) clearTimeout(resultT.current);
        resultT.current = setTimeout(() => setLastResult(null), 1800);

        setTimeout(() => { setBallPos(null); setThrowing(false); setBallTrail([]); }, 400);
      }
    };

    raf.current = requestAnimationFrame(animate);
  }, [throwing, isPlayerTurn, over, opCups, onMove, onGameOver, playerId, shotsLeft, turnHits]);

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
    if (!isPlayerTurn || throwing || over || shotsLeft <= 0) return;
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
      background: 'linear-gradient(180deg, #1e0a20 0%, #2a1028 20%, #3a1530 40%, #0e0808 70%)',
      overflow: 'hidden', touchAction: 'none',
      fontFamily: "'Didot', 'Bodoni MT', Georgia, serif", position: 'relative',
    }}>

      {/* Ambient glow effects */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 15%, rgba(232,135,159,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 60%, rgba(212,144,58,0.04) 0%, transparent 40%)',
      }} />

      {/* Header */}
      <div style={{ padding: '12px 0 6px', textAlign: 'center', width: '100%', zIndex: 2 }}>
        <h1 style={{ fontSize: 30, fontWeight: 900, fontStyle: 'italic', margin: 0,
          background: 'linear-gradient(135deg, #f4b0c3, #e8527a, #d4a053)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          letterSpacing: 2, filter: 'drop-shadow(0 2px 8px rgba(232,82,122,0.3))',
        }}>🥂 Sandy Pong</h1>
        <div style={{ fontSize: 9, color: 'rgba(244,176,195,0.35)', fontStyle: 'italic', letterSpacing: 2, marginTop: 2 }}>
          Beer Pong × Rosé × Plage Chic
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 8, alignItems: 'center' }}>
          <div style={{ padding: '4px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(232,82,122,0.12), rgba(232,82,122,0.06))',
            border: '1px solid rgba(232,82,122,0.2)',
            boxShadow: '0 2px 8px rgba(232,82,122,0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
          }}>
            <span style={{ fontSize: 12, color: 'rgba(244,176,195,0.7)', fontWeight: 700, fontStyle: 'italic' }}>
              🎯 <strong style={{ color: '#e8527a', fontSize: 18 }}>{opAlive}</strong><span style={{ fontSize: 10, opacity: 0.6 }}>/10</span>
            </span>
          </div>
          {/* Shot indicator */}
          {isPlayerTurn && !over && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ padding: '4px 14px', borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(255,200,100,0.12), rgba(255,170,50,0.06))',
                border: '1px solid rgba(255,200,100,0.25)',
                boxShadow: '0 2px 10px rgba(255,180,50,0.1)',
              }}>
              <span style={{ fontSize: 12, color: 'rgba(255,210,130,0.85)', fontWeight: 800, fontStyle: 'italic' }}>
                🏐 <strong style={{ fontSize: 16, color: '#ffcc44' }}>{shotsLeft}</strong> <span style={{ fontSize: 10 }}>tir{shotsLeft > 1 ? 's' : ''}</span>
              </span>
            </motion.div>
          )}
          <div style={{ padding: '4px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(244,176,195,0.08), rgba(244,176,195,0.04))',
            border: '1px solid rgba(244,176,195,0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.02)',
          }}>
            <span style={{ fontSize: 12, color: 'rgba(244,176,195,0.7)', fontWeight: 700, fontStyle: 'italic' }}>
              🛡️ <strong style={{ color: '#f4b0c3', fontSize: 18 }}>{myAlive}</strong><span style={{ fontSize: 10, opacity: 0.6 }}>/10</span>
            </span>
          </div>
        </div>
      </div>

      {/* Status */}
      <motion.div key={over ? 'o' : isPlayerTurn ? 't' : 'w'} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '6px 22px', borderRadius: 14, fontSize: 14, fontWeight: 800, fontStyle: 'italic', marginBottom: 8, zIndex: 2,
          background: over
            ? (win === playerId ? 'linear-gradient(135deg, rgba(52,199,89,0.15), rgba(52,199,89,0.08))' : 'linear-gradient(135deg, rgba(232,82,122,0.12), rgba(232,82,122,0.06))')
            : isPlayerTurn ? 'linear-gradient(135deg, rgba(232,135,159,0.15), rgba(232,82,122,0.06))' : 'rgba(80,80,80,0.06)',
          color: over ? (win === playerId ? '#4ade80' : '#e8527a') : isPlayerTurn ? '#f4b0c3' : '#666',
          border: `1px solid ${over ? (win === playerId ? 'rgba(52,199,89,0.3)' : 'rgba(232,82,122,0.25)') : isPlayerTurn ? 'rgba(232,135,159,0.25)' : 'rgba(80,80,80,0.08)'}`,
          backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          boxShadow: over || isPlayerTurn ? '0 4px 16px rgba(0,0,0,0.15), 0 0 20px rgba(232,135,159,0.06)' : 'none',
          textShadow: over || isPlayerTurn ? '0 1px 6px rgba(0,0,0,0.3)' : 'none',
          letterSpacing: 0.5,
        }}>
        {over ? (win === playerId ? '🏆 Victoire !' : '💔 Défaite…') : isPlayerTurn ? (shotsLeft > 0 ? `🎯 Tir ${3 - shotsLeft}/2 — Glisse !` : '⏳ Changement…') : '⏳ Tour adverse…'}
      </motion.div>

      {/* Result popup */}
      <AnimatePresence>
        {lastResult && (
          <motion.div initial={{ scale: 0, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0, y: -15 }}
            style={{ position: 'absolute', top: '22%', left: '50%', transform: 'translateX(-50%)',
              padding: '12px 32px', borderRadius: 18, fontSize: 22, fontWeight: 900, fontStyle: 'italic',
              background: lastResult.includes('Balls back')
                ? 'linear-gradient(135deg, rgba(255,170,0,0.25), rgba(255,100,0,0.15))'
                : lastResult.includes('Touché')
                  ? 'linear-gradient(135deg, rgba(232,82,122,0.25), rgba(200,40,80,0.15))'
                  : 'rgba(50,40,35,0.25)',
              color: lastResult.includes('Balls back') ? '#ffbb33' : lastResult.includes('Touché') ? '#e8527a' : '#888',
              border: `2px solid ${lastResult.includes('Balls back') ? 'rgba(255,170,0,0.4)' : lastResult.includes('Touché') ? 'rgba(232,82,122,0.4)' : 'rgba(80,80,80,0.15)'}`,
              zIndex: 20, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: lastResult.includes('Touché') || lastResult.includes('Balls back')
                ? '0 8px 32px rgba(232,82,122,0.2), 0 0 40px rgba(232,82,122,0.08)' : 'none',
              textShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}>
            {lastResult}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-rack message */}
      <AnimatePresence>
        {rerackMsg && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            style={{ position: 'absolute', top: '16%', left: '50%', transform: 'translateX(-50%)',
              padding: '10px 26px', borderRadius: 16, fontSize: 17, fontWeight: 800, fontStyle: 'italic',
              background: 'linear-gradient(135deg, rgba(100,200,255,0.2), rgba(80,150,220,0.1))',
              color: '#7ad4ff',
              border: '2px solid rgba(100,200,255,0.3)',
              zIndex: 21, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 6px 24px rgba(100,200,255,0.1)',
              textShadow: '0 1px 6px rgba(0,0,0,0.3)',
            }}>
            {rerackMsg}
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
            {/* Sunset sky — richer, more colorful */}
            <linearGradient id="sky" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#0c0420" />
              <stop offset="10%" stopColor="#180830" />
              <stop offset="22%" stopColor="#2e0a3a" />
              <stop offset="36%" stopColor="#6a1845" />
              <stop offset="48%" stopColor="#a82850" />
              <stop offset="56%" stopColor="#cc4535" />
              <stop offset="65%" stopColor="#d87028" />
              <stop offset="75%" stopColor="#e09838" />
              <stop offset="85%" stopColor="#e8b848" />
              <stop offset="95%" stopColor="#f0d060" />
              <stop offset="100%" stopColor="#f5e070" />
            </linearGradient>
            {/* Wood table — warmer */}
            <linearGradient id="wood" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#4a2c1e" />
              <stop offset="25%" stopColor="#5a3424" />
              <stop offset="50%" stopColor="#6a3c2a" />
              <stop offset="75%" stopColor="#5a3220" />
              <stop offset="100%" stopColor="#7a4430" />
            </linearGradient>
            {/* Table warm glow from sunset reflection */}
            <radialGradient id="tableGlow" cx="50%" cy="15%" r="70%">
              <stop offset="0%" stopColor="rgba(240,180,80,0.12)" />
              <stop offset="40%" stopColor="rgba(232,135,159,0.06)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
            {/* Sun glow gradient */}
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,240,200,0.5)" />
              <stop offset="30%" stopColor="rgba(240,200,100,0.3)" />
              <stop offset="60%" stopColor="rgba(220,160,60,0.15)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* Sky background */}
          <rect width="100" height="100" fill="url(#sky)" />

          {/* Sun — larger, more luminous */}
          <circle cx="50" cy="52" r="30" fill="url(#sunGlow)" />
          <circle cx="50" cy="52" r="12" fill="rgba(255,220,120,0.25)" />
          <circle cx="50" cy="52" r="6" fill="rgba(255,235,160,0.35)" />
          <circle cx="50" cy="52" r="3" fill="rgba(255,245,200,0.5)" />
          <circle cx="50" cy="52" r="1.5" fill="rgba(255,250,220,0.7)" />

          {/* Horizon glow band */}
          <rect x="0" y="48" width="100" height="10" fill="rgba(255,200,80,0.06)" />

          {/* Stars (faint in sunset) */}
          {[12, 28, 72, 85, 40, 65, 18, 55, 90, 8, 35, 78].map((sx, i) => (
            <circle key={i} cx={sx} cy={2 + i * 1.5} r={0.3} fill="white" opacity={0.1 + (i % 4) * 0.03}>
              <animate attributeName="opacity" values={`${0.06 + i * 0.02};${0.18 + i * 0.02};${0.06 + i * 0.02}`}
                dur={`${2 + i % 3}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* Clouds — wispy sunset clouds */}
          <ellipse cx="25" cy="20" rx="12" ry="2" fill="rgba(180,80,100,0.06)" />
          <ellipse cx="70" cy="15" rx="10" ry="1.5" fill="rgba(160,60,90,0.05)" />
          <ellipse cx="45" cy="25" rx="8" ry="1.2" fill="rgba(200,100,120,0.04)" />

          {/* Ocean/horizon band */}
          <rect x="0" y="52" width="100" height="3" fill="rgba(20,60,80,0.15)" />
          <line x1="0" y1="52" x2="100" y2="52" stroke="rgba(240,200,100,0.2)" strokeWidth="0.4" />

          {/* Water reflections */}
          {[20, 35, 50, 65, 80].map((wx, i) => (
            <line key={i} x1={wx - 3} y1={53 + i * 0.15} x2={wx + 3} y2={53 + i * 0.15}
              stroke="rgba(240,200,100,0.06)" strokeWidth="0.3">
              <animate attributeName="opacity" values="0.04;0.1;0.04" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
            </line>
          ))}

          {/* Palm tree silhouettes — more detailed */}
          <g opacity={0.18}>
            {/* Left palm */}
            <line x1="8" y1="55" x2="11" y2="26" stroke="#1a0510" strokeWidth="1.2" />
            <ellipse cx="5" cy="24" rx="7" ry="2.8" fill="#1a0510" transform="rotate(-25, 5, 24)" />
            <ellipse cx="15" cy="25" rx="6" ry="2.2" fill="#1a0510" transform="rotate(15, 15, 25)" />
            <ellipse cx="11" cy="22" rx="6" ry="2" fill="#1a0510" transform="rotate(-5, 11, 22)" />
            <ellipse cx="8" cy="27" rx="5" ry="1.8" fill="#1a0510" transform="rotate(-40, 8, 27)" />
            {/* Right palm */}
            <line x1="92" y1="55" x2="89" y2="28" stroke="#1a0510" strokeWidth="1" />
            <ellipse cx="85" cy="26" rx="6" ry="2.2" fill="#1a0510" transform="rotate(-15, 85, 26)" />
            <ellipse cx="93" cy="27" rx="5.5" ry="2" fill="#1a0510" transform="rotate(20, 93, 27)" />
            <ellipse cx="88" cy="24" rx="5" ry="1.8" fill="#1a0510" transform="rotate(5, 88, 24)" />
          </g>

          {/* Table surface — wood in perspective */}
          <polygon points="8,55 92,55 100,100 0,100" fill="url(#wood)" />
          <polygon points="8,55 92,55 100,100 0,100" fill="url(#tableGlow)" />

          {/* Wood grain lines — more detail */}
          {[58, 63, 68, 73, 78, 83, 88, 93].map((yy, i) => {
            const xShrink = (100 - yy) * 0.3;
            return (
              <line key={i} x1={xShrink} y1={yy} x2={100 - xShrink} y2={yy}
                stroke={i % 2 === 0 ? 'rgba(120,70,35,0.12)' : 'rgba(80,45,20,0.08)'} strokeWidth={0.3} />
            );
          })}

          {/* Wood knots */}
          <circle cx="30" cy="72" r="1.2" fill="rgba(80,45,20,0.1)" />
          <circle cx="70" cy="85" r="0.8" fill="rgba(80,45,20,0.08)" />

          {/* Table edge highlight — warm glow */}
          <line x1="8" y1="55" x2="92" y2="55" stroke="rgba(255,220,150,0.15)" strokeWidth="0.8" />
          <line x1="8" y1="55.5" x2="92" y2="55.5" stroke="rgba(255,180,100,0.06)" strokeWidth="1.5" />

          {/* Center line on table */}
          <line x1="42" y1="55" x2="50" y2="100" stroke="rgba(255,200,150,0.04)" strokeWidth="0.3" />
          <line x1="58" y1="55" x2="50" y2="100" stroke="rgba(255,200,150,0.04)" strokeWidth="0.3" />

          {/* ── Opponent cups (far end, smaller) ── */}
          {opCups.map(cup => (
            <RoséGlass key={cup.id} x={cup.x} y={cup.y} scale={0.55}
              alive={cup.alive} hit={!cup.alive} glow={isPlayerTurn} />
          ))}

          {/* Splash when hit — dramatic rosé fountain */}
          {splash && (
            <g>
              {/* Upward splash droplets */}
              {[...Array(8)].map((_, i) => {
                const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.8;
                const d = 4 + Math.random() * 6;
                return (
                  <motion.circle key={`up${i}`}
                    initial={{ cx: splash.x, cy: splash.y, r: 0.3 + Math.random() * 0.4, opacity: 0.9 }}
                    animate={{
                      cx: splash.x + Math.cos(a) * d,
                      cy: splash.y + Math.sin(a) * d + 3,
                      r: 0, opacity: 0
                    }}
                    transition={{ duration: 0.6 + Math.random() * 0.3, ease: 'easeOut' }}
                    fill={i % 2 === 0 ? 'rgba(244,176,195,0.8)' : 'rgba(232,100,140,0.7)'} />
                );
              })}
              {/* Radial splash */}
              {[...Array(14)].map((_, i) => {
                const a = (i / 14) * Math.PI * 2;
                const r = 2 + Math.random() * 6;
                return (
                  <motion.circle key={i}
                    initial={{ cx: splash.x, cy: splash.y, r: 0.5, opacity: 0.8 }}
                    animate={{ cx: splash.x + Math.cos(a) * r, cy: splash.y + Math.sin(a) * r, r: 0, opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    fill={i % 3 === 0 ? 'rgba(255,180,200,0.7)' : 'rgba(232,100,140,0.6)'} />
                );
              })}
              {/* Wine spill stain */}
              <motion.circle initial={{ r: 0, opacity: 0.6 }} animate={{ r: 4, opacity: 0.2 }}
                transition={{ duration: 1.2 }}
                cx={splash.x} cy={splash.y} fill="rgba(232,100,140,0.4)" />
              {/* Wine puddle spreading */}
              <motion.ellipse initial={{ rx: 0, ry: 0, opacity: 0.5 }}
                animate={{ rx: 6, ry: 2, opacity: 0.1 }}
                transition={{ duration: 1.5, delay: 0.2 }}
                cx={splash.x} cy={splash.y + 3} fill="rgba(200,60,100,0.3)" />
              {/* Ripple rings */}
              <motion.circle initial={{ r: 0.5, opacity: 0.6 }} animate={{ r: 8, opacity: 0 }}
                transition={{ duration: 1 }}
                cx={splash.x} cy={splash.y} fill="none" stroke="rgba(255,180,200,0.4)" strokeWidth={0.3} />
              <motion.circle initial={{ r: 1, opacity: 0.4 }} animate={{ r: 10, opacity: 0 }}
                transition={{ duration: 1.2, delay: 0.1 }}
                cx={splash.x} cy={splash.y} fill="none" stroke="rgba(244,176,195,0.2)" strokeWidth={0.2} />
              <motion.circle initial={{ r: 2, opacity: 0.3 }} animate={{ r: 12, opacity: 0 }}
                transition={{ duration: 1.4, delay: 0.2 }}
                cx={splash.x} cy={splash.y} fill="none" stroke="rgba(244,176,195,0.15)" strokeWidth={0.15} />
            </g>
          )}

          {/* Ball in flight — with spin */}
          {ballPos && (
            <g>
              {/* Ball trail — gradient dots */}
              {ballTrail.length > 1 && ballTrail.map((p, i) => {
                const alpha = (i / ballTrail.length) * 0.3;
                const sz = (i / ballTrail.length) * 1.5 * ballPos.s;
                return i % 2 === 0 ? (
                  <circle key={`trail${i}`} cx={p.x} cy={p.y} r={sz}
                    fill={`rgba(255,255,255,${alpha})`} />
                ) : null;
              })}
              {/* Ball glow */}
              <circle cx={ballPos.x} cy={ballPos.y} r={3.5 * ballPos.s}
                fill="rgba(255,255,255,0.08)" />
              {/* Ball shadow on table */}
              <ellipse cx={ballPos.x} cy={Math.max(ballPos.y + 3, 58)} rx={2 * ballPos.s} ry={0.6 * ballPos.s}
                fill="rgba(0,0,0,0.15)" />
              {/* Ball body */}
              <circle cx={ballPos.x} cy={ballPos.y} r={2 * ballPos.s}
                fill="white" stroke="rgba(200,200,200,0.5)" strokeWidth={0.25} />
              {/* Spin seam line */}
              <ellipse cx={ballPos.x} cy={ballPos.y} rx={1.8 * ballPos.s} ry={0.4 * ballPos.s}
                fill="none" stroke="rgba(180,180,180,0.3)" strokeWidth={0.15}
                transform={`rotate(${Date.now() % 360}, ${ballPos.x}, ${ballPos.y})`} />
              {/* Ball highlight */}
              <circle cx={ballPos.x - 0.5 * ballPos.s} cy={ballPos.y - 0.5 * ballPos.s}
                r={0.6 * ballPos.s} fill="rgba(255,255,255,0.8)" />
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
          {isPlayerTurn && !throwing && !over && !dragStart && shotsLeft > 0 && (
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
