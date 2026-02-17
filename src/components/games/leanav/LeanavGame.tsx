import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = 'PLACEMENT' | 'BATTLE';
type Orientation = 'H' | 'V';
type CellState = 'empty' | 'miss' | 'hit';

interface ShipDef {
  name: string;
  size: number;
  color: string;
  colorDark: string;
}

interface PlacedShip {
  name: string;
  size: number;
  color: string;
  colorDark: string;
  cells: [number, number][];
  orientation: Orientation;
  sunk: boolean;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
}

interface SunkAnnouncement {
  id: number;
  name: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const GRID = 10;
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const SHIP_DEFS: ShipDef[] = [
  { name: 'Carrier',    size: 5, color: '#6366f1', colorDark: '#4338ca' },
  { name: 'Battleship', size: 4, color: '#22d3ee', colorDark: '#0891b2' },
  { name: 'Cruiser',    size: 3, color: '#f59e0b', colorDark: '#d97706' },
  { name: 'Submarine',  size: 3, color: '#10b981', colorDark: '#059669' },
  { name: 'Destroyer',  size: 2, color: '#f43f5e', colorDark: '#e11d48' },
];

const makeGrid = (): CellState[][] =>
  Array.from({ length: GRID }, () => Array(GRID).fill('empty'));

// ── Component ──────────────────────────────────────────────────────────────────

export default function LeanavGame({
  gameId,
  playerId,
  opponentId,
  isPlayerTurn,
  onMove,
  onGameOver,
}: {
  gameId: string;
  playerId: string;
  opponentId: string;
  isPlayerTurn: boolean;
  onMove: (data: any) => void;
  onGameOver: (data: any) => void;
}) {
  // ── Phase & placement state ──
  const [phase, setPhase] = useState<Phase>('PLACEMENT');
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [currentShipIdx, setCurrentShipIdx] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>('H');
  const [hoverCells, setHoverCells] = useState<[number, number][]>([]);
  const [hoverValid, setHoverValid] = useState(true);

  // ── Battle state ──
  const [myGrid, setMyGrid] = useState<CellState[][]>(makeGrid);
  const [enemyGrid, setEnemyGrid] = useState<CellState[][]>(makeGrid);
  const [enemyShips, setEnemyShips] = useState<PlacedShip[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [splashes, setSplashes] = useState<Explosion[]>([]);
  const [sunkAnnouncement, setSunkAnnouncement] = useState<SunkAnnouncement | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const explosionId = useRef(0);
  const announcementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const cellsForPlacement = useCallback(
    (r: number, c: number, size: number, dir: Orientation): [number, number][] | null => {
      const cells: [number, number][] = [];
      for (let i = 0; i < size; i++) {
        const nr = dir === 'V' ? r + i : r;
        const nc = dir === 'H' ? c + i : c;
        if (nr >= GRID || nc >= GRID) return null;
        cells.push([nr, nc]);
      }
      return cells;
    },
    [],
  );

  const overlaps = useCallback(
    (cells: [number, number][], existing: PlacedShip[]): boolean => {
      const occupied = new Set(existing.flatMap((s) => s.cells.map(([r, c]) => `${r},${c}`)));
      return cells.some(([r, c]) => occupied.has(`${r},${c}`));
    },
    [],
  );

  // ── Placement handlers ───────────────────────────────────────────────────────

  const currentShip: ShipDef | null =
    currentShipIdx < SHIP_DEFS.length ? SHIP_DEFS[currentShipIdx] : null;

  const handlePlacementHover = useCallback(
    (r: number, c: number) => {
      if (!currentShip) return;
      const cells = cellsForPlacement(r, c, currentShip.size, orientation);
      if (!cells) {
        setHoverCells([]);
        setHoverValid(false);
        return;
      }
      const valid = !overlaps(cells, placedShips);
      setHoverCells(cells);
      setHoverValid(valid);
    },
    [currentShip, orientation, placedShips, cellsForPlacement, overlaps],
  );

  const handlePlacementClick = useCallback(
    (r: number, c: number) => {
      if (!currentShip) return;
      const cells = cellsForPlacement(r, c, currentShip.size, orientation);
      if (!cells || overlaps(cells, placedShips)) return;

      const ship: PlacedShip = {
        name: currentShip.name,
        size: currentShip.size,
        color: currentShip.color,
        colorDark: currentShip.colorDark,
        cells,
        orientation,
        sunk: false,
      };
      setPlacedShips((prev) => [...prev, ship]);
      setCurrentShipIdx((prev) => prev + 1);
      setHoverCells([]);
    },
    [currentShip, orientation, placedShips, cellsForPlacement, overlaps],
  );

  const handleRotate = useCallback(() => {
    setOrientation((o) => (o === 'H' ? 'V' : 'H'));
    setHoverCells([]);
  }, []);

  const handleUndo = useCallback(() => {
    if (placedShips.length === 0) return;
    setPlacedShips((prev) => prev.slice(0, -1));
    setCurrentShipIdx((prev) => prev - 1);
    setHoverCells([]);
  }, [placedShips.length]);

  const handleReady = useCallback(() => {
    if (placedShips.length !== SHIP_DEFS.length) return;
    // Generate random enemy ships
    const enemy: PlacedShip[] = [];
    for (const def of SHIP_DEFS) {
      let placed = false;
      while (!placed) {
        const dir: Orientation = Math.random() < 0.5 ? 'H' : 'V';
        const maxR = dir === 'V' ? GRID - def.size : GRID - 1;
        const maxC = dir === 'H' ? GRID - def.size : GRID - 1;
        const r = Math.floor(Math.random() * (maxR + 1));
        const c = Math.floor(Math.random() * (maxC + 1));
        const cells: [number, number][] = [];
        for (let i = 0; i < def.size; i++) {
          cells.push([dir === 'V' ? r + i : r, dir === 'H' ? c + i : c]);
        }
        if (!overlaps(cells, enemy)) {
          enemy.push({ ...def, cells, orientation: dir, sunk: false });
          placed = true;
        }
      }
    }
    setEnemyShips(enemy);
    setPhase('BATTLE');
    onMove({
      type: 'ready',
      ships: placedShips.map((s) => ({
        name: s.name,
        size: s.size,
        cells: s.cells,
        orientation: s.orientation,
      })),
    });
  }, [placedShips, overlaps, onMove]);

  // ── Battle handlers ──────────────────────────────────────────────────────────

  const handleFire = useCallback(
    (r: number, c: number) => {
      if (!isPlayerTurn || gameOver) return;
      if (enemyGrid[r][c] !== 'empty') return;

      const hitShip = enemyShips.find((s) =>
        s.cells.some(([sr, sc]) => sr === r && sc === c),
      );

      const newGrid = enemyGrid.map((row) => [...row]);
      newGrid[r][c] = hitShip ? 'hit' : 'miss';
      setEnemyGrid(newGrid);

      if (hitShip) {
        // Explosion effect
        const eid = explosionId.current++;
        setExplosions((prev) => [...prev, { id: eid, x: c, y: r }]);
        setTimeout(() => setExplosions((prev) => prev.filter((e) => e.id !== eid)), 800);

        // Check if sunk
        const allHit = hitShip.cells.every(([sr, sc]) =>
          (sr === r && sc === c) || newGrid[sr][sc] === 'hit',
        );
        if (allHit) {
          const updatedShips = enemyShips.map((s) =>
            s.name === hitShip.name ? { ...s, sunk: true } : s,
          );
          setEnemyShips(updatedShips);

          const aid = explosionId.current++;
          setSunkAnnouncement({ id: aid, name: hitShip.name });
          if (announcementTimer.current) clearTimeout(announcementTimer.current);
          announcementTimer.current = setTimeout(() => setSunkAnnouncement(null), 2500);

          // Check win
          const allSunk = updatedShips.every((s) => s.sunk);
          if (allSunk) {
            setGameOver(true);
            onGameOver({ winner_id: playerId });
          }
        }
      } else {
        const sid = explosionId.current++;
        setSplashes((prev) => [...prev, { id: sid, x: c, y: r }]);
        setTimeout(() => setSplashes((prev) => prev.filter((s) => s.id !== sid)), 600);
      }

      onMove({ type: 'fire', x: c, y: r });
    },
    [isPlayerTurn, gameOver, enemyGrid, enemyShips, onMove, onGameOver, playerId],
  );

  // Cleanup announcement timer
  useEffect(() => {
    return () => {
      if (announcementTimer.current) clearTimeout(announcementTimer.current);
    };
  }, []);

  // ── Ship lookup for player grid ──────────────────────────────────────────────

  const playerShipAt = useCallback(
    (r: number, c: number): PlacedShip | undefined =>
      placedShips.find((s) => s.cells.some(([sr, sc]) => sr === r && sc === c)),
    [placedShips],
  );

  const hoverSet = new Set(hoverCells.map(([r, c]) => `${r},${c}`));

  // ── Count sunk ships ─────────────────────────────────────────────────────────

  const sunkCount = enemyShips.filter((s) => s.sunk).length;
  const totalShips = SHIP_DEFS.length;

  // ── Render helpers ───────────────────────────────────────────────────────────

  const renderGrid = (
    grid: CellState[][] | null,
    onClick: ((r: number, c: number) => void) | null,
    onHover: ((r: number, c: number) => void) | null,
    showShips: boolean,
    isEnemy: boolean,
    small: boolean,
  ) => {
    const cellSize = small ? 'w-[28px] h-[28px] sm:w-[32px] sm:h-[32px]' : 'w-[32px] h-[32px] sm:w-[36px] sm:h-[36px]';
    const fontSize = small ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs';

    return (
      <div className="inline-block">
        {/* Column labels */}
        <div className="flex">
          <div className={`${cellSize} flex-shrink-0`} />
          {COL_LABELS.map((label) => (
            <div
              key={label}
              className={`${cellSize} flex items-center justify-center ${fontSize} font-bold text-cyan-300/70 select-none`}
            >
              {label}
            </div>
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: GRID }, (_, r) => (
          <div key={r} className="flex">
            {/* Row label */}
            <div
              className={`${cellSize} flex items-center justify-center ${fontSize} font-bold text-cyan-300/70 select-none`}
            >
              {ROW_LABELS[r]}
            </div>
            {/* Cells */}
            {Array.from({ length: GRID }, (_, c) => {
              const state = grid ? grid[r][c] : 'empty';
              const ship = showShips ? playerShipAt(r, c) : undefined;
              const isHover = hoverSet.has(`${r},${c}`);
              const isClickable = !!onClick && state === 'empty';
              const explosion = explosions.find((e) => e.x === c && e.y === r);
              const splash = splashes.find((s) => s.x === c && s.y === r);

              // Enemy sunk ship highlight
              const enemySunkShip = isEnemy
                ? enemyShips.find((s) => s.sunk && s.cells.some(([sr, sc]) => sr === r && sc === c))
                : undefined;

              return (
                <div
                  key={c}
                  className={`
                    ${cellSize} relative border border-cyan-900/40 flex items-center justify-center
                    transition-colors duration-150 select-none
                    ${isClickable ? 'cursor-crosshair hover:bg-cyan-500/20' : 'cursor-default'}
                    ${ship ? '' : 'bg-gradient-to-br from-slate-800/60 to-slate-900/80'}
                  `}
                  style={
                    ship
                      ? {
                          background: `linear-gradient(135deg, ${ship.color}cc, ${ship.colorDark}cc)`,
                          boxShadow: `inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3)`,
                        }
                      : isHover
                        ? {
                            background: hoverValid
                              ? `linear-gradient(135deg, ${currentShip?.color}88, ${currentShip?.colorDark}88)`
                              : 'rgba(239,68,68,0.4)',
                          }
                        : enemySunkShip
                          ? {
                              background: `linear-gradient(135deg, ${enemySunkShip.color}55, ${enemySunkShip.colorDark}55)`,
                            }
                          : undefined
                  }
                  onClick={() => onClick?.(r, c)}
                  onMouseEnter={() => onHover?.(r, c)}
                  onMouseLeave={() => onHover && setHoverCells([])}
                >
                  {/* Hit marker */}
                  {state === 'hit' && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span className="text-red-500 font-black text-lg drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]">
                        ✕
                      </span>
                    </motion.div>
                  )}
                  {/* Miss marker */}
                  {state === 'miss' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 rounded-full bg-white/70 shadow-[0_0_4px_rgba(255,255,255,0.5)]"
                    />
                  )}
                  {/* Explosion animation */}
                  <AnimatePresence>
                    {explosion && (
                      <motion.div
                        key={explosion.id}
                        initial={{ scale: 0.2, opacity: 1 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                      >
                        <div className="w-full h-full rounded-full bg-gradient-radial from-yellow-400 via-orange-500 to-red-600 opacity-80" 
                             style={{ background: 'radial-gradient(circle, #facc15, #f97316, #dc2626, transparent)' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Splash animation */}
                  <AnimatePresence>
                    {splash && (
                      <motion.div
                        key={splash.id}
                        initial={{ scale: 0.3, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                      >
                        <div className="w-full h-full rounded-full"
                             style={{ background: 'radial-gradient(circle, rgba(147,197,253,0.8), rgba(59,130,246,0.3), transparent)' }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  // ── PLACEMENT PHASE ──────────────────────────────────────────────────────────

  if (phase === 'PLACEMENT') {
    const allPlaced = placedShips.length === SHIP_DEFS.length;

    return (
      <div
        className="min-h-screen flex flex-col items-center px-2 py-4 overflow-auto"
        style={{
          background: 'linear-gradient(180deg, #0c1220 0%, #0f172a 40%, #1e293b 100%)',
        }}
      >
        {/* Title */}
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-1 tracking-wide"
        >
          ⚓ SEA BATTLE
        </motion.h1>
        <p className="text-cyan-300/60 text-xs sm:text-sm mb-4">Deploy your fleet, Admiral</p>

        {/* Ship selector */}
        <div className="w-full max-w-md mb-4">
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {SHIP_DEFS.map((def, idx) => {
              const isPlaced = idx < placedShips.length;
              const isCurrent = idx === currentShipIdx;
              return (
                <div
                  key={def.name}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all
                    ${isPlaced ? 'opacity-40 line-through' : ''}
                    ${isCurrent ? 'ring-2 ring-white/60 scale-105' : ''}
                  `}
                  style={{
                    background: isPlaced
                      ? `${def.colorDark}66`
                      : `linear-gradient(135deg, ${def.color}, ${def.colorDark})`,
                    color: 'white',
                  }}
                >
                  {def.name} ({def.size})
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleRotate}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <span className="inline-block transition-transform" style={{ transform: orientation === 'V' ? 'rotate(90deg)' : 'none' }}>
                ↔
              </span>
              {orientation === 'H' ? 'Horizontal' : 'Vertical'}
            </button>
            <button
              onClick={handleUndo}
              disabled={placedShips.length === 0}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              ↩ Undo
            </button>
          </div>
        </div>

        {/* Placement grid */}
        <div
          className="p-2 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(15,23,42,0.6))',
            boxShadow: '0 0 30px rgba(6,182,212,0.1), inset 0 0 30px rgba(6,182,212,0.05)',
          }}
        >
          {renderGrid(null, allPlaced ? null : handlePlacementClick, allPlaced ? null : handlePlacementHover, true, false, false)}
        </div>

        {/* Ready button */}
        {allPlaced && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReady}
            className="mt-5 px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-green-500/30 transition-all"
          >
            ⚔ Ready for Battle!
          </motion.button>
        )}

        {!allPlaced && currentShip && (
          <p className="mt-3 text-cyan-300/70 text-sm">
            Tap the grid to place your <span className="font-bold text-white">{currentShip.name}</span> ({currentShip.size} cells)
          </p>
        )}
      </div>
    );
  }

  // ── BATTLE PHASE ─────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col items-center px-2 py-3 overflow-auto"
      style={{
        background: 'linear-gradient(180deg, #0c1220 0%, #0f172a 40%, #1e293b 100%)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 tracking-wide"
        >
          ⚓ SEA BATTLE
        </motion.h1>
        <div className="text-xs text-slate-400 font-mono">
          {sunkCount}/{totalShips} sunk
        </div>
      </div>

      {/* Turn indicator */}
      <motion.div
        key={isPlayerTurn ? 'turn' : 'wait'}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          px-4 py-1.5 rounded-full text-sm font-bold mb-3 tracking-wide
          ${gameOver
            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
            : isPlayerTurn
              ? 'bg-green-500/20 text-green-300 border border-green-500/30 animate-pulse'
              : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
          }
        `}
      >
        {gameOver ? '🏆 VICTORY!' : isPlayerTurn ? '🎯 Your turn — Fire!' : '⏳ Waiting for opponent...'}
      </motion.div>

      {/* Sunk announcement */}
      <AnimatePresence>
        {sunkAnnouncement && (
          <motion.div
            key={sunkAnnouncement.id}
            initial={{ scale: 0.5, opacity: 0, y: -10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="px-5 py-2 bg-red-600/30 border border-red-500/50 rounded-xl text-red-200 font-bold text-sm mb-2 shadow-lg shadow-red-500/20"
          >
            💥 {sunkAnnouncement.name.toUpperCase()} SUNK!
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enemy grid */}
      <div className="mb-2">
        <h2 className="text-center text-xs font-bold text-red-400/80 uppercase tracking-widest mb-1">
          Enemy Waters
        </h2>
        <div
          className="p-1.5 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.06), rgba(15,23,42,0.6))',
            boxShadow: '0 0 20px rgba(239,68,68,0.08)',
          }}
        >
          {renderGrid(
            enemyGrid,
            gameOver ? null : isPlayerTurn ? handleFire : null,
            null,
            false,
            true,
            false,
          )}
        </div>
      </div>

      {/* Ship status bar */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-2 max-w-md">
        {enemyShips.map((ship) => (
          <div
            key={ship.name}
            className={`px-2 py-0.5 rounded text-[10px] sm:text-xs font-semibold transition-all ${
              ship.sunk ? 'line-through opacity-40' : ''
            }`}
            style={{
              background: ship.sunk ? '#374151' : `linear-gradient(135deg, ${ship.color}aa, ${ship.colorDark}aa)`,
              color: 'white',
            }}
          >
            {ship.sunk ? '💀' : '🚢'} {ship.name}
          </div>
        ))}
      </div>

      {/* Player grid */}
      <div>
        <h2 className="text-center text-xs font-bold text-cyan-400/80 uppercase tracking-widest mb-1">
          Your Fleet
        </h2>
        <div
          className="p-1.5 rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(15,23,42,0.6))',
            boxShadow: '0 0 20px rgba(6,182,212,0.08)',
          }}
        >
          {renderGrid(myGrid, null, null, true, false, true)}
        </div>
      </div>
    </div>
  );
}
