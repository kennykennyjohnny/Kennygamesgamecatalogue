import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ────────────────────────────────────────────────────────────────────

type Phase = 'PLACEMENT' | 'WAITING' | 'BATTLE';
type Orientation = 'H' | 'V';
type CellState = 'empty' | 'miss' | 'hit';

interface ShipDef { name: string; size: number; emoji: string; color: string; colorDark: string }
interface PlacedShip {
  name: string; size: number; emoji: string; color: string; colorDark: string;
  cells: [number, number][]; orientation: Orientation; sunk: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const GRID = 10;
const ROW_LABELS = 'ABCDEFGHIJ'.split('');
const COL_LABELS = Array.from({ length: 10 }, (_, i) => `${i + 1}`);

const SHIP_DEFS: ShipDef[] = [
  { name: 'Porte-avions', size: 5, emoji: '🚢', color: '#3478F6', colorDark: '#1a4da8' },
  { name: 'Croiseur',     size: 4, emoji: '⛴️', color: '#30B0C7', colorDark: '#1a7a8c' },
  { name: 'Sous-marin',   size: 3, emoji: '🛥️', color: '#5856D6', colorDark: '#3634a3' },
  { name: 'Torpilleur',   size: 3, emoji: '⛵', color: '#007AFF', colorDark: '#0055b3' },
  { name: 'Patrouilleur', size: 2, emoji: '🚤', color: '#64D2FF', colorDark: '#2ba8d4' },
];

// Navy palette
const C = {
  bg: 'linear-gradient(180deg, #0a1628 0%, #0d2137 40%, #0a1a2e 100%)',
  glass: 'rgba(13, 33, 55, 0.7)',
  border: 'rgba(52, 120, 246, 0.2)',
  accent: '#3478F6',
  text: '#c8e0f5',
  textDim: 'rgba(100, 210, 255, 0.6)',
  cellBg: 'rgba(10, 22, 40, 0.6)',
  cellBorder: 'rgba(52, 120, 246, 0.15)',
};

const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';

const makeGrid = (): CellState[][] =>
  Array.from({ length: GRID }, () => Array(GRID).fill('empty') as CellState[]);

// ── Helpers ──────────────────────────────────────────────────────────────────

function getCells(r: number, c: number, size: number, dir: Orientation): [number, number][] | null {
  const cells: [number, number][] = [];
  for (let i = 0; i < size; i++) {
    const nr = dir === 'V' ? r + i : r;
    const nc = dir === 'H' ? c + i : c;
    if (nr >= GRID || nc >= GRID) return null;
    cells.push([nr, nc]);
  }
  return cells;
}

// Check adjacency – ships cannot touch each other (not even diagonally)
function hasAdjacentShip(cells: [number, number][], existing: PlacedShip[]): boolean {
  const occupied = new Set<string>();
  for (const ship of existing) {
    for (const [sr, sc] of ship.cells) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          occupied.add(`${sr + dr},${sc + dc}`);
        }
      }
    }
  }
  return cells.some(([r, c]) => occupied.has(`${r},${c}`));
}

function overlaps(cells: [number, number][], existing: PlacedShip[]): boolean {
  const set = new Set(existing.flatMap(s => s.cells.map(([r, c]) => `${r},${c}`)));
  return cells.some(([r, c]) => set.has(`${r},${c}`));
}

// ── Component ────────────────────────────────────────────────────────────────

export default function LeanavGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: any) {
  // Placement state
  const [phase, setPhase] = useState<Phase>('PLACEMENT');
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [currentShipIdx, setCurrentShipIdx] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>('H');
  const [hoverCells, setHoverCells] = useState<[number, number][]>([]);
  const [hoverValid, setHoverValid] = useState(true);

  // Battle state
  const [myGrid, setMyGrid] = useState<CellState[][]>(makeGrid);
  const [enemyGrid, setEnemyGrid] = useState<CellState[][]>(makeGrid);
  const [mySunkShips, setMySunkShips] = useState<string[]>([]);
  const [enemySunkShips, setEnemySunkShips] = useState<string[]>([]);
  const [lastHitAnim, setLastHitAnim] = useState<{ r: number; c: number; hit: boolean } | null>(null);
  const [sunkAnnouncement, setSunkAnnouncement] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);

  const announcementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Sync with shared game_state from Supabase ─────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const move = gameState.lastMove;
    if (move.playerId === playerId) return; // own move, ignore

    if (move.type === 'ready') {
      // Opponent is ready – if we're also ready, start battle
      if (phase === 'WAITING') {
        setPhase('BATTLE');
      }
    }

    if (move.type === 'fire') {
      // Opponent fired at our grid
      const { r, c } = move;
      const hitShip = placedShips.find(s =>
        s.cells.some(([sr, sc]) => sr === r && sc === c)
      );

      const newMyGrid = myGrid.map(row => [...row]);
      newMyGrid[r][c] = hitShip ? 'hit' : 'miss';
      setMyGrid(newMyGrid);

      // Show animation
      setLastHitAnim({ r, c, hit: !!hitShip });
      setTimeout(() => setLastHitAnim(null), 800);

      // Check if ship sunk
      if (hitShip) {
        const allHit = hitShip.cells.every(([sr, sc]) =>
          (sr === r && sc === c) || newMyGrid[sr][sc] === 'hit'
        );
        if (allHit) {
          setMySunkShips(prev => [...prev, hitShip.name]);
          // Check if all our ships sunk → we lost
          const totalSunk = mySunkShips.length + 1;
          if (totalSunk >= SHIP_DEFS.length) {
            setGameOver(true);
            setWinner(opponentId);
          }
        }
      }

      // Send result back to opponent
      const sunk = hitShip ? hitShip.cells.every(([sr, sc]) =>
        (sr === r && sc === c) || newMyGrid[sr][sc] === 'hit'
      ) : false;

      onMove({
        type: 'fire_result',
        r, c,
        hit: !!hitShip,
        sunk,
        sunkShipName: sunk ? hitShip?.name : null,
        sunkShipEmoji: sunk ? hitShip?.emoji : null,
        _keepTurn: !!hitShip, // if hit, opponent keeps their turn
      });
    }

    if (move.type === 'fire_result') {
      // We got the result of our shot
      const { r, c, hit, sunk, sunkShipName, sunkShipEmoji } = move;
      const newEnemyGrid = enemyGrid.map(row => [...row]);
      newEnemyGrid[r][c] = hit ? 'hit' : 'miss';
      setEnemyGrid(newEnemyGrid);

      setLastHitAnim({ r, c, hit });
      setTimeout(() => setLastHitAnim(null), 800);

      if (sunk && sunkShipName) {
        setEnemySunkShips(prev => [...prev, sunkShipName]);
        setSunkAnnouncement(`${sunkShipEmoji} ${sunkShipName} coulé !`);
        if (announcementTimer.current) clearTimeout(announcementTimer.current);
        announcementTimer.current = setTimeout(() => setSunkAnnouncement(null), 2500);

        // Check win
        const totalEnemySunk = enemySunkShips.length + 1;
        if (totalEnemySunk >= SHIP_DEFS.length) {
          setGameOver(true);
          setWinner(playerId);
          onGameOver({ winner_id: playerId });
        }
      }
    }
  }, [gameState?.lastMove]);

  // Check if opponent already sent 'ready'
  useEffect(() => {
    if (!gameState?.moves) return;
    const opponentReady = gameState.moves.some(
      (m: any) => m.playerId === opponentId && m.type === 'ready'
    );
    if (opponentReady && phase === 'WAITING') {
      setPhase('BATTLE');
    }
  }, [gameState, phase, opponentId]);

  useEffect(() => {
    return () => { if (announcementTimer.current) clearTimeout(announcementTimer.current); };
  }, []);

  // ── Placement Logic ───────────────────────────────────────────────────────

  const currentShip = currentShipIdx < SHIP_DEFS.length ? SHIP_DEFS[currentShipIdx] : null;

  const handlePlacementHover = useCallback((r: number, c: number) => {
    if (!currentShip) return;
    const cells = getCells(r, c, currentShip.size, orientation);
    if (!cells) { setHoverCells([]); setHoverValid(false); return; }
    const valid = !overlaps(cells, placedShips) && !hasAdjacentShip(cells, placedShips);
    setHoverCells(cells);
    setHoverValid(valid);
  }, [currentShip, orientation, placedShips]);

  const handlePlacementClick = useCallback((r: number, c: number) => {
    if (!currentShip) return;
    const cells = getCells(r, c, currentShip.size, orientation);
    if (!cells || overlaps(cells, placedShips) || hasAdjacentShip(cells, placedShips)) return;

    const ship: PlacedShip = {
      ...currentShip, cells, orientation, sunk: false,
    };
    setPlacedShips(prev => [...prev, ship]);
    setCurrentShipIdx(prev => prev + 1);
    setHoverCells([]);
  }, [currentShip, orientation, placedShips]);

  const handleRotate = () => { setOrientation(o => o === 'H' ? 'V' : 'H'); setHoverCells([]); };

  const handleUndo = () => {
    if (placedShips.length === 0) return;
    setPlacedShips(prev => prev.slice(0, -1));
    setCurrentShipIdx(prev => prev - 1);
    setHoverCells([]);
  };

  const handleReady = () => {
    if (placedShips.length !== SHIP_DEFS.length) return;
    onMove({
      type: 'ready',
      _playerState: {
        ships: placedShips.map(s => ({
          name: s.name, size: s.size, cells: s.cells, orientation: s.orientation,
        })),
      },
      _keepTurn: false,
    });

    // Check if opponent already ready
    const opponentReady = gameState?.moves?.some(
      (m: any) => m.playerId === opponentId && m.type === 'ready'
    );
    setPhase(opponentReady ? 'BATTLE' : 'WAITING');
  };

  // ── Fire Logic ─────────────────────────────────────────────────────────────

  const handleFire = useCallback((r: number, c: number) => {
    if (!isPlayerTurn || gameOver || phase !== 'BATTLE') return;
    if (enemyGrid[r][c] !== 'empty') return;

    onMove({ type: 'fire', r, c, _keepTurn: true }); // keep turn until result comes back
  }, [isPlayerTurn, gameOver, phase, enemyGrid, onMove]);

  // ── Render helpers ─────────────────────────────────────────────────────────

  const shipAt = (r: number, c: number) =>
    placedShips.find(s => s.cells.some(([sr, sc]) => sr === r && sc === c));

  const hoverSet = new Set(hoverCells.map(([r, c]) => `${r},${c}`));

  const renderGrid = (
    grid: CellState[][] | null,
    onClick: ((r: number, c: number) => void) | null,
    onHover: ((r: number, c: number) => void) | null,
    showShips: boolean,
    isEnemy: boolean,
    small: boolean,
  ) => {
    const cellSize = small ? 28 : 34;

    return (
      <div style={{ display: 'inline-block' }}>
        {/* Column labels */}
        <div style={{ display: 'flex' }}>
          <div style={{ width: cellSize, height: cellSize, flexShrink: 0 }} />
          {COL_LABELS.map(label => (
            <div key={label} style={{
              width: cellSize, height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: C.textDim,
            }}>{label}</div>
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: GRID }, (_, r) => (
          <div key={r} style={{ display: 'flex' }}>
            <div style={{
              width: cellSize, height: cellSize, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 700, color: C.textDim,
            }}>{ROW_LABELS[r]}</div>
            {Array.from({ length: GRID }, (_, c) => {
              const state = grid ? grid[r][c] : 'empty';
              const ship = showShips ? shipAt(r, c) : undefined;
              const isHover = hoverSet.has(`${r},${c}`);
              const isClickable = !!onClick && state === 'empty';
              const isAnimating = lastHitAnim?.r === r && lastHitAnim?.c === c;

              let bg = C.cellBg;
              if (ship && showShips) bg = `linear-gradient(135deg, ${ship.color}cc, ${ship.colorDark}cc)`;
              else if (isHover) bg = hoverValid ? `${currentShip?.color}44` : 'rgba(255,59,48,0.3)';

              return (
                <div
                  key={c}
                  onClick={() => onClick?.(r, c)}
                  onMouseEnter={() => onHover?.(r, c)}
                  onMouseLeave={() => onHover && setHoverCells([])}
                  style={{
                    width: cellSize, height: cellSize, position: 'relative',
                    border: `1px solid ${C.cellBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: bg, cursor: isClickable ? 'crosshair' : 'default',
                    transition: 'background 0.15s',
                  }}
                >
                  {/* Ship emoji */}
                  {ship && showShips && !isEnemy && state !== 'hit' && (
                    <span style={{ fontSize: small ? 12 : 14 }}>{ship.emoji}</span>
                  )}

                  {/* Hit */}
                  {state === 'hit' && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      style={{ fontSize: small ? 14 : 18, filter: 'drop-shadow(0 0 6px rgba(255,59,48,0.8))' }}
                    >💥</motion.span>
                  )}

                  {/* Miss */}
                  {state === 'miss' && (
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: 'rgba(100,210,255,0.4)',
                        boxShadow: '0 0 6px rgba(100,210,255,0.3)',
                      }}
                    />
                  )}

                  {/* Animation ripple */}
                  <AnimatePresence>
                    {isAnimating && (
                      <motion.div
                        initial={{ scale: 0.2, opacity: 1 }}
                        animate={{ scale: 3, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        style={{
                          position: 'absolute', inset: 0,
                          borderRadius: '50%', pointerEvents: 'none',
                          background: lastHitAnim?.hit
                            ? 'radial-gradient(circle, rgba(255,59,48,0.8), transparent)'
                            : 'radial-gradient(circle, rgba(100,210,255,0.5), transparent)',
                        }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Hover glow */}
                  {isClickable && (
                    <div style={{
                      position: 'absolute', inset: 0, opacity: 0, transition: 'opacity 0.2s',
                      background: 'radial-gradient(circle, rgba(52,120,246,0.15), transparent)',
                    }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '1'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '0'; }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ── PLACEMENT PHASE ────────────────────────────────────────────────────────

  if (phase === 'PLACEMENT') {
    const allPlaced = placedShips.length === SHIP_DEFS.length;

    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 8px', background: C.bg, fontFamily: font, overflow: 'auto',
      }}>
        <motion.h1
          initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{
            fontSize: 24, fontWeight: 900, marginBottom: 4,
            background: 'linear-gradient(135deg, #3478F6, #64D2FF)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}
        >⚓ LÉA NAVAL</motion.h1>
        <p style={{ fontSize: 13, color: C.textDim, marginBottom: 16 }}>
          Place tes navires, Amiral — ils ne doivent pas se toucher !
        </p>

        {/* Ship selector */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 12, maxWidth: 440 }}>
          {SHIP_DEFS.map((def, idx) => {
            const isPlaced = idx < placedShips.length;
            const isCurrent = idx === currentShipIdx;
            return (
              <div key={def.name} style={{
                padding: '4px 12px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                background: isPlaced ? 'rgba(10,22,40,0.5)' : `linear-gradient(135deg, ${def.color}cc, ${def.colorDark}cc)`,
                color: C.text, opacity: isPlaced ? 0.4 : 1,
                border: isCurrent ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                textDecoration: isPlaced ? 'line-through' : 'none',
                boxShadow: isCurrent ? `0 0 12px ${def.color}66` : 'none',
                transition: 'all 0.2s',
              }}>
                {def.emoji} {def.name} ({def.size})
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button onClick={handleRotate} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: C.glass, border: `1px solid ${C.border}`, color: C.text,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span style={{ transform: orientation === 'V' ? 'rotate(90deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>↔</span>
            {orientation === 'H' ? 'Horizontal' : 'Vertical'}
          </button>
          <button onClick={handleUndo} disabled={placedShips.length === 0} style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
            background: C.glass, border: `1px solid ${C.border}`, color: C.text,
            cursor: placedShips.length === 0 ? 'not-allowed' : 'pointer',
            opacity: placedShips.length === 0 ? 0.3 : 1,
          }}>↩ Annuler</button>
        </div>

        {/* Grid */}
        <div style={{
          padding: 8, borderRadius: 16,
          background: C.glass, border: `1px solid ${C.border}`,
          boxShadow: `0 0 24px rgba(52,120,246,0.15)`,
        }}>
          {renderGrid(null, allPlaced ? null : handlePlacementClick, allPlaced ? null : handlePlacementHover, true, false, false)}
        </div>

        {/* Ready button */}
        {allPlaced && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReady}
            style={{
              marginTop: 16, padding: '12px 32px', borderRadius: 14, fontSize: 18, fontWeight: 800,
              background: 'linear-gradient(135deg, #3478F6, #1a4da8)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(52,120,246,0.4)',
            }}
          >⚓ Prêt !</motion.button>
        )}

        {!allPlaced && currentShip && (
          <p style={{ marginTop: 12, fontSize: 13, color: C.textDim }}>
            Place ton <strong style={{ color: C.text }}>{currentShip.emoji} {currentShip.name}</strong> ({currentShip.size} cases)
          </p>
        )}
      </div>
    );
  }

  // ── WAITING PHASE ──────────────────────────────────────────────────────────

  if (phase === 'WAITING') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: C.bg, fontFamily: font,
      }}>
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ fontSize: 48, marginBottom: 16 }}
        >⚓</motion.div>
        <h2 style={{ color: C.text, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Flotte déployée !
        </h2>
        <p style={{ color: C.textDim, fontSize: 14 }}>En attente de l'adversaire...</p>
      </div>
    );
  }

  // ── BATTLE PHASE ───────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 4px', background: C.bg, fontFamily: font, overflow: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <h1 style={{
          fontSize: 20, fontWeight: 900,
          background: 'linear-gradient(135deg, #3478F6, #64D2FF)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>⚓ LÉA NAVAL</h1>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 8,
          background: C.glass, border: `1px solid ${C.border}`, color: C.textDim,
        }}>{enemySunkShips.length}/{SHIP_DEFS.length} coulés</span>
      </div>

      {/* Turn indicator */}
      <motion.div
        key={isPlayerTurn ? 'turn' : 'wait'}
        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '6px 20px', borderRadius: 20, fontSize: 14, fontWeight: 700, marginBottom: 8,
          background: gameOver
            ? 'rgba(52,199,89,0.2)' : isPlayerTurn
              ? 'rgba(52,120,246,0.15)' : 'rgba(100,100,100,0.15)',
          color: gameOver
            ? '#34C759' : isPlayerTurn
              ? '#64D2FF' : '#8e8e93',
          border: `1px solid ${gameOver ? 'rgba(52,199,89,0.3)' : isPlayerTurn ? 'rgba(52,120,246,0.3)' : 'rgba(100,100,100,0.2)'}`,
        }}
      >
        {gameOver
          ? (winner === playerId ? '🏆 Victoire !' : '💥 Défaite...')
          : isPlayerTurn ? '🎯 À toi de tirer !' : '⏳ L\'adversaire vise...'}
      </motion.div>

      {/* Sunk announcement */}
      <AnimatePresence>
        {sunkAnnouncement && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            style={{
              padding: '8px 20px', borderRadius: 12, fontSize: 14, fontWeight: 700, marginBottom: 6,
              background: 'rgba(255,59,48,0.15)', border: '1px solid rgba(255,59,48,0.3)',
              color: '#FF6961',
            }}
          >💥 {sunkAnnouncement}</motion.div>
        )}
      </AnimatePresence>

      {/* Enemy grid */}
      <div style={{ marginBottom: 6 }}>
        <h2 style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,100,100,0.7)', marginBottom: 4, textTransform: 'uppercase' }}>
          Flotte Ennemie
        </h2>
        <div style={{
          padding: 6, borderRadius: 12, background: C.glass, border: `1px solid ${C.border}`,
        }}>
          {renderGrid(enemyGrid, gameOver ? null : isPlayerTurn ? handleFire : null, null, false, true, false)}
        </div>
      </div>

      {/* Enemy ships status */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginBottom: 8, maxWidth: 400 }}>
        {SHIP_DEFS.map(def => {
          const sunk = enemySunkShips.includes(def.name);
          return (
            <span key={def.name} style={{
              padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
              background: sunk ? 'rgba(10,22,40,0.5)' : `${def.color}44`,
              color: C.text, opacity: sunk ? 0.4 : 1,
              textDecoration: sunk ? 'line-through' : 'none',
            }}>{sunk ? '💀' : def.emoji} {def.name}</span>
          );
        })}
      </div>

      {/* My grid */}
      <div>
        <h2 style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: 2, color: C.textDim, marginBottom: 4, textTransform: 'uppercase' }}>
          Ma Flotte
        </h2>
        <div style={{
          padding: 6, borderRadius: 12, background: C.glass, border: `1px solid ${C.border}`,
        }}>
          {renderGrid(myGrid, null, null, true, false, true)}
        </div>
      </div>
    </div>
  );
}
