import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Phase = 'PLACEMENT' | 'BATTLE';
type Orientation = 'H' | 'V';
type CellState = 'empty' | 'miss' | 'hit';

interface ShipDef {
  name: string;
  size: number;
  emoji: string;
  color: string;
  colorDark: string;
}

interface PlacedShip {
  name: string;
  size: number;
  emoji: string;
  color: string;
  colorDark: string;
  cells: [number, number][];
  orientation: Orientation;
  sunk: boolean;
}

interface FxEvent {
  id: number;
  x: number;
  y: number;
}

interface SunkAnnouncement {
  id: number;
  name: string;
  emoji: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const GRID = 10;
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
const COL_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

const SHIP_DEFS: ShipDef[] = [
  { name: 'Porte-avions', size: 5, emoji: '🚢', color: '#3478F6', colorDark: '#1a4da8' },
  { name: 'Croiseur',     size: 4, emoji: '⛴️', color: '#30B0C7', colorDark: '#1a7a8c' },
  { name: 'Sous-marin',   size: 3, emoji: '🛥️', color: '#5856D6', colorDark: '#3634a3' },
  { name: 'Torpilleur',   size: 3, emoji: '⛵', color: '#007AFF', colorDark: '#0055b3' },
  { name: 'Patrouilleur', size: 2, emoji: '🚤', color: '#64D2FF', colorDark: '#2ba8d4' },
];

const NAVAL_BG = {
  main: 'linear-gradient(180deg, #0a1628 0%, #0d2137 40%, #0a1a2e 100%)',
  glass: 'rgba(13, 33, 55, 0.6)',
  glassBorder: 'rgba(52, 120, 246, 0.15)',
  accent: '#3478F6',
  accentGlow: 'rgba(52, 120, 246, 0.3)',
  labelColor: 'rgba(100, 210, 255, 0.7)',
  cellBorder: 'rgba(52, 120, 246, 0.18)',
  cellBg: 'linear-gradient(135deg, rgba(10, 22, 40, 0.8), rgba(13, 33, 55, 0.6))',
  hitGlow: 'rgba(255, 59, 48, 0.6)',
};

const makeGrid = (): CellState[][] =>
  Array.from({ length: GRID }, () => Array(GRID).fill('empty'));

// ── Glassmorphism panel style helper ───────────────────────────────────────────

const glassPanel = (extraShadow?: string): React.CSSProperties => ({
  background: NAVAL_BG.glass,
  border: `1px solid ${NAVAL_BG.glassBorder}`,
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  boxShadow: `0 0 24px rgba(0,0,0,0.4)${extraShadow ? `, ${extraShadow}` : ''}`,
});

// ── Component ──────────────────────────────────────────────────────────────────

export default function LeanavGame({ gameId, playerId, opponentId, isPlayerTurn, onMove, onGameOver }: any) {
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
  const [explosions, setExplosions] = useState<FxEvent[]>([]);
  const [splashes, setSplashes] = useState<FxEvent[]>([]);
  const [sunkAnnouncement, setSunkAnnouncement] = useState<SunkAnnouncement | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const fxId = useRef(0);
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
        emoji: currentShip.emoji,
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
        const eid = fxId.current++;
        setExplosions((prev) => [...prev, { id: eid, x: c, y: r }]);
        setTimeout(() => setExplosions((prev) => prev.filter((e) => e.id !== eid)), 900);

        const allHit = hitShip.cells.every(([sr, sc]) =>
          (sr === r && sc === c) || newGrid[sr][sc] === 'hit',
        );
        if (allHit) {
          const updatedShips = enemyShips.map((s) =>
            s.name === hitShip.name ? { ...s, sunk: true } : s,
          );
          setEnemyShips(updatedShips);

          const aid = fxId.current++;
          setSunkAnnouncement({ id: aid, name: hitShip.name, emoji: hitShip.emoji });
          if (announcementTimer.current) clearTimeout(announcementTimer.current);
          announcementTimer.current = setTimeout(() => setSunkAnnouncement(null), 2500);

          const allSunk = updatedShips.every((s) => s.sunk);
          if (allSunk) {
            setGameOver(true);
            onGameOver({ winner_id: playerId });
          }
        }
      } else {
        const sid = fxId.current++;
        setSplashes((prev) => [...prev, { id: sid, x: c, y: r }]);
        setTimeout(() => setSplashes((prev) => prev.filter((s) => s.id !== sid)), 700);
      }

      onMove({ type: 'fire', x: c, y: r });
    },
    [isPlayerTurn, gameOver, enemyGrid, enemyShips, onMove, onGameOver, playerId],
  );

  useEffect(() => {
    return () => {
      if (announcementTimer.current) clearTimeout(announcementTimer.current);
    };
  }, []);

  // ── Lookup helpers ───────────────────────────────────────────────────────────

  const playerShipAt = useCallback(
    (r: number, c: number): PlacedShip | undefined =>
      placedShips.find((s) => s.cells.some(([sr, sc]) => sr === r && sc === c)),
    [placedShips],
  );

  const hoverSet = new Set(hoverCells.map(([r, c]) => `${r},${c}`));
  const sunkCount = enemyShips.filter((s) => s.sunk).length;
  const totalShips = SHIP_DEFS.length;

  // ── Render grid ──────────────────────────────────────────────────────────────

  const renderGrid = (
    grid: CellState[][] | null,
    onClick: ((r: number, c: number) => void) | null,
    onHover: ((r: number, c: number) => void) | null,
    showShips: boolean,
    isEnemy: boolean,
    small: boolean,
  ) => {
    const cellPx = small ? 28 : 32;
    const cellPxSm = small ? 32 : 36;
    const cellSize = small
      ? 'w-[28px] h-[28px] sm:w-[32px] sm:h-[32px]'
      : 'w-[32px] h-[32px] sm:w-[36px] sm:h-[36px]';
    const fontSize = small ? 'text-[9px] sm:text-[10px]' : 'text-[10px] sm:text-xs';
    const emojiSize = small ? 'text-sm' : 'text-base';

    return (
      <div className="inline-block">
        {/* Column labels */}
        <div className="flex">
          <div className={`${cellSize} flex-shrink-0`} />
          {COL_LABELS.map((label) => (
            <div
              key={label}
              className={`${cellSize} flex items-center justify-center ${fontSize} font-bold select-none`}
              style={{ color: NAVAL_BG.labelColor }}
            >
              {label}
            </div>
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: GRID }, (_, r) => (
          <div key={r} className="flex">
            <div
              className={`${cellSize} flex items-center justify-center ${fontSize} font-bold select-none`}
              style={{ color: NAVAL_BG.labelColor }}
            >
              {ROW_LABELS[r]}
            </div>
            {Array.from({ length: GRID }, (_, c) => {
              const state = grid ? grid[r][c] : 'empty';
              const ship = showShips ? playerShipAt(r, c) : undefined;
              const isHover = hoverSet.has(`${r},${c}`);
              const isClickable = !!onClick && state === 'empty';
              const explosion = explosions.find((e) => e.x === c && e.y === r);
              const splash = splashes.find((s) => s.x === c && s.y === r);
              const enemySunkShip = isEnemy
                ? enemyShips.find((s) => s.sunk && s.cells.some(([sr, sc]) => sr === r && sc === c))
                : undefined;

              let cellStyle: React.CSSProperties = {
                borderColor: NAVAL_BG.cellBorder,
              };

              if (ship) {
                cellStyle = {
                  ...cellStyle,
                  background: `linear-gradient(135deg, ${ship.color}cc, ${ship.colorDark}cc)`,
                  boxShadow: `inset 0 1px 3px rgba(255,255,255,0.15), inset 0 -1px 3px rgba(0,0,0,0.4), 0 0 6px ${ship.color}44`,
                };
              } else if (isHover) {
                cellStyle = {
                  ...cellStyle,
                  background: hoverValid
                    ? `linear-gradient(135deg, ${currentShip?.color}66, ${currentShip?.colorDark}66)`
                    : 'rgba(180, 30, 30, 0.4)',
                };
              } else if (enemySunkShip) {
                cellStyle = {
                  ...cellStyle,
                  background: `linear-gradient(135deg, ${enemySunkShip.color}44, ${enemySunkShip.colorDark}44)`,
                };
              } else {
                cellStyle = {
                  ...cellStyle,
                  background: NAVAL_BG.cellBg,
                };
              }

              return (
                <div
                  key={c}
                  className={`
                    ${cellSize} relative border flex items-center justify-center
                    transition-colors duration-150 select-none
                    ${isClickable ? 'cursor-crosshair' : 'cursor-default'}
                  `}
                  style={cellStyle}
                  onClick={() => onClick?.(r, c)}
                  onMouseEnter={() => {
                    onHover?.(r, c);
                    // subtle hover glow for enemy clickable cells
                  }}
                  onMouseLeave={() => onHover && setHoverCells([])}
                  onTouchStart={() => onHover?.(r, c)}
                >
                  {/* Ship emoji on player grid */}
                  {ship && showShips && !isEnemy && state !== 'hit' && (
                    <span className={`${emojiSize} drop-shadow-[0_0_4px_rgba(201,162,39,0.5)]`}>
                      {ship.emoji}
                    </span>
                  )}

                  {/* Hit marker: red splash 💥 */}
                  {state === 'hit' && (
                    <motion.div
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span
                        className={`${small ? 'text-base' : 'text-lg'}`}
                        style={{
                          filter: 'drop-shadow(0 0 8px rgba(255, 59, 48, 0.9))',
                        }}
                      >
                        💥
                      </span>
                    </motion.div>
                  )}

                  {/* Miss marker: white dot 💨 */}
                  {state === 'miss' && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <span
                        className={`${small ? 'text-xs' : 'text-sm'}`}
                        style={{
                          filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.6))',
                        }}
                      >
                        💨
                      </span>
                    </motion.div>
                  )}

                  {/* Explosion ripple animation */}
                  <AnimatePresence>
                    {explosion && (
                      <motion.div
                        key={explosion.id}
                        initial={{ scale: 0.2, opacity: 1 }}
                        animate={{ scale: 2.8, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                      >
                        <div
                          className="w-full h-full rounded-full"
                          style={{
                            background: 'radial-gradient(circle, rgba(220,38,38,0.9), rgba(180,30,30,0.5), rgba(139,26,74,0.3), transparent)',
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Splash ripple animation */}
                  <AnimatePresence>
                    {splash && (
                      <motion.div
                        key={splash.id}
                        initial={{ scale: 0.3, opacity: 0.8 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                      >
                        <div
                          className="w-full h-full rounded-full"
                          style={{
                            background: 'radial-gradient(circle, rgba(255,255,255,0.6), rgba(201,162,39,0.2), transparent)',
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Hover glow overlay for clickable cells */}
                  {isClickable && !isHover && (
                    <div
                      className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle, rgba(201,162,39,0.15), transparent)',
                      }}
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

  // ── PLACEMENT PHASE ──────────────────────────────────────────────────────────

  if (phase === 'PLACEMENT') {
    const allPlaced = placedShips.length === SHIP_DEFS.length;

    return (
      <div
        className="min-h-screen flex flex-col items-center px-2 py-4 overflow-auto"
        style={{ background: NAVAL_BG.main }}
      >
        {/* Title */}
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-2xl sm:text-3xl font-black mb-1 tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #3478F6, #64D2FF, #3478F6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ⚓ LÉA NAVAL
        </motion.h1>
        <p className="text-xs sm:text-sm mb-4" style={{ color: 'rgba(100, 210, 255, 0.5)' }}>
          Placez vos navires, Amiral
        </p>

        {/* Ship / bottle selector */}
        <div className="w-full max-w-md mb-4">
          <div className="flex flex-wrap gap-2 justify-center mb-3">
            {SHIP_DEFS.map((def, idx) => {
              const isPlaced = idx < placedShips.length;
              const isCurrent = idx === currentShipIdx;
              return (
                <motion.div
                  key={def.name}
                  animate={isCurrent ? { scale: 1.08 } : { scale: 1 }}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all
                    ${isPlaced ? 'opacity-35 line-through' : ''}
                  `}
                  style={{
                    ...glassPanel(isCurrent ? `0 0 12px ${def.color}88` : undefined),
                    background: isPlaced
                      ? 'rgba(10, 22, 40, 0.4)'
                      : `linear-gradient(135deg, ${def.color}cc, ${def.colorDark}cc)`,
                    color: '#c8e0f5',
                    border: isCurrent ? `2px solid ${NAVAL_BG.accent}` : `1px solid ${NAVAL_BG.glassBorder}`,
                  }}
                >
                  {def.emoji} {def.name} ({def.size})
                </motion.div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            <button
              onClick={handleRotate}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 active:scale-95"
              style={{
                ...glassPanel(),
                color: '#c8e0f5',
              }}
            >
              <span
                className="inline-block transition-transform text-base"
                style={{ transform: orientation === 'V' ? 'rotate(90deg)' : 'none' }}
              >
                ↔
              </span>
              {orientation === 'H' ? 'Horizontal' : 'Vertical'}
            </button>
            <button
              onClick={handleUndo}
              disabled={placedShips.length === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-95"
              style={{
                ...glassPanel(),
                color: '#c8e0f5',
              }}
            >
              ↩ Annuler
            </button>
          </div>
        </div>

        {/* Placement grid */}
        <div
          className="p-2 rounded-xl"
          style={{
            ...glassPanel(`0 0 30px ${NAVAL_BG.accentGlow}`),
          }}
        >
          {renderGrid(
            null,
            allPlaced ? null : handlePlacementClick,
            allPlaced ? null : handlePlacementHover,
            true,
            false,
            false,
          )}
        </div>

        {/* Ready button */}
        {allPlaced && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.04 }}
            onClick={handleReady}
            className="mt-5 px-8 py-3 font-bold text-lg rounded-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #3478F6, #1a4da8)',
              color: '#c8e0f5',
              boxShadow: '0 0 20px rgba(52, 120, 246, 0.5), 0 0 40px rgba(52, 120, 246, 0.2)',
              border: '1px solid rgba(100, 210, 255, 0.3)',
            }}
          >
            ⚓ Prêt !
          </motion.button>
        )}

        {!allPlaced && currentShip && (
          <p className="mt-3 text-sm" style={{ color: 'rgba(100, 210, 255, 0.6)' }}>
            Placez votre{' '}
            <span className="font-bold" style={{ color: '#c8e0f5' }}>
              {currentShip.emoji} {currentShip.name}
            </span>{' '}
            ({currentShip.size} cases)
          </p>
        )}
      </div>
    );
  }

  // ── BATTLE PHASE ─────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col items-center px-2 py-3 overflow-auto"
      style={{ background: NAVAL_BG.main }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-xl sm:text-2xl font-black tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #3478F6, #64D2FF, #3478F6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ⚓ LÉA NAVAL
        </motion.h1>
        <div
          className="text-xs font-mono px-2 py-0.5 rounded"
          style={{ color: NAVAL_BG.labelColor, ...glassPanel() }}
        >
          {sunkCount}/{totalShips} coulés
        </div>
      </div>

      {/* Turn indicator */}
      <motion.div
        key={isPlayerTurn ? 'turn' : 'wait'}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 py-1.5 rounded-full text-sm font-bold mb-3 tracking-wide"
        style={
          gameOver
            ? {
                background: 'rgba(201, 162, 39, 0.2)',
                color: '#64D2FF',
                border: '1px solid rgba(100, 210, 255, 0.4)',
                boxShadow: '0 0 16px rgba(100, 210, 255, 0.3)',
              }
            : isPlayerTurn
              ? {
                  background: 'rgba(201, 162, 39, 0.15)',
                  color: '#64D2FF',
                  border: '1px solid rgba(100, 210, 255, 0.4)',
                  boxShadow: '0 0 20px rgba(201, 162, 39, 0.25)',
                  animation: 'pulse 2s ease-in-out infinite',
                }
              : {
                  background: 'rgba(13, 33, 55, 0.3)',
                  color: 'rgba(100, 210, 255, 0.5)',
                  border: '1px solid rgba(13, 33, 55, 0.4)',
                }
        }
      >
        {gameOver
          ? '🏆 VICTOIRE !'
          : isPlayerTurn
            ? '🎯 À vous de tirer !'
            : '⏳ L\'adversaire réfléchit...'}
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
            className="px-5 py-2.5 rounded-xl font-bold text-sm mb-2"
            style={{
              background: 'rgba(52, 120, 246, 0.4)',
              border: '1px solid rgba(255, 59, 48, 0.5)',
              color: '#c6daf5',
              boxShadow: '0 0 20px rgba(255, 59, 48, 0.3)',
            }}
          >
            💥 {sunkAnnouncement.emoji} {sunkAnnouncement.name.toUpperCase()} COULÉE !
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enemy grid — Flotte Ennemie */}
      <div className="mb-2">
        <h2
          className="text-center text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: 'rgba(255, 100, 100, 0.7)' }}
        >
          Flotte Ennemie
        </h2>
        <div
          className="p-1.5 rounded-xl"
          style={{
            ...glassPanel('0 0 16px rgba(52, 120, 246, 0.15)'),
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

      {/* Ship / bottle status bar */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-2 max-w-md">
        {enemyShips.map((ship) => (
          <div
            key={ship.name}
            className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-semibold transition-all ${
              ship.sunk ? 'line-through opacity-35' : ''
            }`}
            style={{
              background: ship.sunk
                ? 'rgba(10, 22, 40, 0.5)'
                : `linear-gradient(135deg, ${ship.color}99, ${ship.colorDark}99)`,
              color: '#c8e0f5',
              border: `1px solid ${ship.sunk ? 'rgba(10,22,40,0.3)' : `${ship.color}44`}`,
            }}
          >
            {ship.sunk ? '💀' : ship.emoji} {ship.name}
          </div>
        ))}
      </div>

      {/* Player grid — Ma Flotte */}
      <div>
        <h2
          className="text-center text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: NAVAL_BG.labelColor }}
        >
          Ma Flotte
        </h2>
        <div
          className="p-1.5 rounded-xl"
          style={{
            ...glassPanel(`0 0 16px ${NAVAL_BG.accentGlow}`),
          }}
        >
          {renderGrid(myGrid, null, null, true, false, true)}
        </div>
      </div>
    </div>
  );
}
