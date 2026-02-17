import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Types ────────────────────────────────────────────────────────────────────

type Phase = 'PLACEMENT' | 'WAITING' | 'BATTLE';
type Orientation = 'H' | 'V';
type CellState = 'empty' | 'miss' | 'hit';

interface ShipDef { id: string; name: string; size: number; color: string; colorLight: string }
interface PlacedShip extends ShipDef {
  cells: [number, number][]; orientation: Orientation; sunk: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const GRID = 10;

const SHIP_DEFS: ShipDef[] = [
  { id: 'carrier',    name: 'Porte-avions', size: 5, color: '#3b82f6', colorLight: '#60a5fa' },
  { id: 'cruiser',    name: 'Croiseur',     size: 4, color: '#8b5cf6', colorLight: '#a78bfa' },
  { id: 'submarine',  name: 'Sous-marin',   size: 3, color: '#06b6d4', colorLight: '#22d3ee' },
  { id: 'destroyer',  name: 'Torpilleur',   size: 3, color: '#10b981', colorLight: '#34d399' },
  { id: 'patrol',     name: 'Patrouilleur', size: 2, color: '#f59e0b', colorLight: '#fbbf24' },
];

const CELL = 36;
const GAP = 1;

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

function hasAdjacentShip(cells: [number, number][], existing: PlacedShip[]): boolean {
  const occupied = new Set<string>();
  for (const ship of existing) {
    for (const [sr, sc] of ship.cells) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          occupied.add(`${sr + dr},${sc + dc}`);
    }
  }
  return cells.some(([r, c]) => occupied.has(`${r},${c}`));
}

function overlaps(cells: [number, number][], existing: PlacedShip[]): boolean {
  const set = new Set(existing.flatMap(s => s.cells.map(([r, c]) => `${r},${c}`)));
  return cells.some(([r, c]) => set.has(`${r},${c}`));
}

// ── Ship SVG renderer ────────────────────────────────────────────────────────
// Renders a single ship spanning its cells as one continuous shape

function ShipSVG({ ship, cellSize, isHit }: { ship: PlacedShip; cellSize: number; isHit?: Set<string> }) {
  const isH = ship.orientation === 'H';
  const len = ship.size;
  const w = isH ? len * cellSize : cellSize;
  const h = isH ? cellSize : len * cellSize;
  const minR = Math.min(...ship.cells.map(c => c[0]));
  const minC = Math.min(...ship.cells.map(c => c[1]));

  // Ship body with rounded ends
  const pad = 3;
  const bodyW = w - pad * 2;
  const bodyH = h - pad * 2;
  const r = Math.min(bodyW, bodyH) / 2 - 1;

  return (
    <g transform={`translate(${minC * cellSize}, ${minR * cellSize})`}>
      {/* Hull shadow */}
      <rect x={pad + 1} y={pad + 2} width={bodyW} height={bodyH} rx={r} fill="rgba(0,0,0,0.3)" />
      {/* Hull */}
      <rect x={pad} y={pad} width={bodyW} height={bodyH} rx={r}
        fill={ship.color} stroke={ship.colorLight} strokeWidth={1.5} />
      {/* Hull shine */}
      <rect x={pad + 2} y={pad + 1} width={bodyW - 4} height={bodyH * 0.4} rx={r - 2}
        fill="rgba(255,255,255,0.15)" />

      {/* Deck details based on ship type */}
      {ship.id === 'carrier' && (
        <>
          {/* Flight deck stripe */}
          <rect x={pad + 4} y={h / 2 - 1} width={bodyW - 8} height={2} rx={1}
            fill="rgba(255,255,255,0.25)" />
          {/* Control tower */}
          {isH ? (
            <rect x={w * 0.6} y={pad + 3} width={8} height={bodyH - 6} rx={2}
              fill={ship.colorLight} opacity={0.5} />
          ) : (
            <rect x={pad + 3} y={h * 0.6} width={bodyW - 6} height={8} rx={2}
              fill={ship.colorLight} opacity={0.5} />
          )}
        </>
      )}
      {ship.id === 'cruiser' && (
        <>
          {/* Front turret */}
          <circle cx={isH ? pad + 10 : w / 2} cy={isH ? h / 2 : pad + 10} r={4}
            fill={ship.colorLight} opacity={0.4} />
          {/* Rear turret */}
          <circle cx={isH ? w - pad - 10 : w / 2} cy={isH ? h / 2 : h - pad - 10} r={4}
            fill={ship.colorLight} opacity={0.4} />
        </>
      )}
      {ship.id === 'submarine' && (
        <>
          {/* Conning tower */}
          <ellipse cx={w / 2} cy={h / 2}
            rx={isH ? 8 : bodyW / 2 - 4} ry={isH ? bodyH / 2 - 4 : 8}
            fill={ship.colorLight} opacity={0.3} />
          {/* Periscope */}
          {isH ? (
            <line x1={w / 2} y1={pad - 1} x2={w / 2} y2={pad + 5} stroke={ship.colorLight} strokeWidth={1.5} opacity={0.5} />
          ) : (
            <line x1={pad - 1} y1={h / 2} x2={pad + 5} y2={h / 2} stroke={ship.colorLight} strokeWidth={1.5} opacity={0.5} />
          )}
        </>
      )}
      {ship.id === 'destroyer' && (
        <circle cx={isH ? pad + 8 : w / 2} cy={isH ? h / 2 : pad + 8} r={3}
          fill={ship.colorLight} opacity={0.4} />
      )}
      {ship.id === 'patrol' && (
        <circle cx={w / 2} cy={h / 2} r={3} fill={ship.colorLight} opacity={0.4} />
      )}

      {/* Hit markers on this ship */}
      {isHit && ship.cells.map(([cr, cc], idx) => {
        if (!isHit.has(`${cr},${cc}`)) return null;
        const cx = (cc - minC) * cellSize + cellSize / 2;
        const cy = (cr - minR) * cellSize + cellSize / 2;
        return (
          <g key={idx}>
            <circle cx={cx} cy={cy} r={cellSize / 3} fill="rgba(239,68,68,0.7)" />
            <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} stroke="#fff" strokeWidth={2} />
            <line x1={cx + 5} y1={cy - 5} x2={cx - 5} y2={cy + 5} stroke="#fff" strokeWidth={2} />
          </g>
        );
      })}
    </g>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function LeanavGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: any) {
  const [phase, setPhase] = useState<Phase>('PLACEMENT');
  const [placedShips, setPlacedShips] = useState<PlacedShip[]>([]);
  const [currentShipIdx, setCurrentShipIdx] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>('H');
  const [hoverCells, setHoverCells] = useState<[number, number][]>([]);
  const [hoverValid, setHoverValid] = useState(true);

  const [myGrid, setMyGrid] = useState<CellState[][]>(makeGrid);
  const [enemyGrid, setEnemyGrid] = useState<CellState[][]>(makeGrid);
  const [mySunkShips, setMySunkShips] = useState<string[]>([]);
  const [enemySunkShips, setEnemySunkShips] = useState<string[]>([]);
  const [lastHit, setLastHit] = useState<{ r: number; c: number; hit: boolean } | null>(null);
  const [sunkMsg, setSunkMsg] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [hoverTarget, setHoverTarget] = useState<{ r: number; c: number } | null>(null);

  const sunkTimer = useRef<ReturnType<typeof setTimeout>>();

  // ── Sync ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId) return;

    if (m.type === 'ready') {
      if (phase === 'WAITING') setPhase('BATTLE');
    }

    if (m.type === 'fire') {
      const { r, c } = m;
      const hitShip = placedShips.find(s => s.cells.some(([sr, sc]) => sr === r && sc === c));
      const g = myGrid.map(row => [...row]);
      g[r][c] = hitShip ? 'hit' : 'miss';
      setMyGrid(g);
      setLastHit({ r, c, hit: !!hitShip });
      setTimeout(() => setLastHit(null), 900);

      const sunk = hitShip ? hitShip.cells.every(([sr, sc]) =>
        (sr === r && sc === c) || g[sr][sc] === 'hit'
      ) : false;
      if (sunk && hitShip) {
        setMySunkShips(prev => {
          const next = [...prev, hitShip.name];
          if (next.length >= SHIP_DEFS.length) {
            setGameOver(true);
            setWinner(opponentId);
          }
          return next;
        });
      }
      onMove({ type: 'fire_result', r, c, hit: !!hitShip, sunk, sunkName: sunk ? hitShip?.name : null, _keepTurn: !!hitShip });
    }

    if (m.type === 'fire_result') {
      const { r, c, hit, sunk, sunkName } = m;
      const g = enemyGrid.map(row => [...row]);
      g[r][c] = hit ? 'hit' : 'miss';
      setEnemyGrid(g);
      setLastHit({ r, c, hit });
      setTimeout(() => setLastHit(null), 900);
      if (sunk && sunkName) {
        setEnemySunkShips(prev => {
          const next = [...prev, sunkName];
          if (next.length >= SHIP_DEFS.length) {
            setGameOver(true);
            setWinner(playerId);
            onGameOver({ winner_id: playerId });
          }
          return next;
        });
        setSunkMsg(`💀 ${sunkName} coulé !`);
        if (sunkTimer.current) clearTimeout(sunkTimer.current);
        sunkTimer.current = setTimeout(() => setSunkMsg(null), 2500);
      }
    }
  }, [gameState?.lastMove]);

  useEffect(() => {
    if (!gameState?.moves) return;
    if (phase === 'WAITING' && gameState.moves.some((m: any) => m.playerId === opponentId && m.type === 'ready')) {
      setPhase('BATTLE');
    }
  }, [gameState, phase, opponentId]);

  useEffect(() => () => { if (sunkTimer.current) clearTimeout(sunkTimer.current); }, []);

  // ── Placement ──────────────────────────────────────────────────────────────

  const curShip = currentShipIdx < SHIP_DEFS.length ? SHIP_DEFS[currentShipIdx] : null;

  const handleHover = useCallback((r: number, c: number) => {
    if (!curShip) return;
    const cells = getCells(r, c, curShip.size, orientation);
    if (!cells) { setHoverCells([]); setHoverValid(false); return; }
    const ok = !overlaps(cells, placedShips) && !hasAdjacentShip(cells, placedShips);
    setHoverCells(cells);
    setHoverValid(ok);
  }, [curShip, orientation, placedShips]);

  const handlePlace = useCallback((r: number, c: number) => {
    if (!curShip) return;
    const cells = getCells(r, c, curShip.size, orientation);
    if (!cells || overlaps(cells, placedShips) || hasAdjacentShip(cells, placedShips)) return;
    setPlacedShips(prev => [...prev, { ...curShip, cells, orientation, sunk: false }]);
    setCurrentShipIdx(prev => prev + 1);
    setHoverCells([]);
  }, [curShip, orientation, placedShips]);

  const handleReady = () => {
    if (placedShips.length !== SHIP_DEFS.length) return;
    onMove({
      type: 'ready',
      _playerState: { ships: placedShips.map(s => ({ id: s.id, name: s.name, size: s.size, cells: s.cells, orientation: s.orientation })) },
      _keepTurn: false,
    });
    const opReady = gameState?.moves?.some((m: any) => m.playerId === opponentId && m.type === 'ready');
    setPhase(opReady ? 'BATTLE' : 'WAITING');
  };

  const handleFire = useCallback((r: number, c: number) => {
    if (!isPlayerTurn || gameOver || phase !== 'BATTLE') return;
    if (enemyGrid[r][c] !== 'empty') return;
    onMove({ type: 'fire', r, c, _keepTurn: true });
  }, [isPlayerTurn, gameOver, phase, enemyGrid, onMove]);

  // ── SVG Grid Renderer ─────────────────────────────────────────────────────

  const hoverSet = new Set(hoverCells.map(([r, c]) => `${r},${c}`));
  const gridPx = GRID * CELL;

  const renderSVGGrid = (
    grid: CellState[][] | null,
    onClick: ((r: number, c: number) => void) | null,
    onHover: ((r: number, c: number) => void) | null,
    showShips: boolean,
    small: boolean,
  ) => {
    const cs = small ? 28 : CELL;
    const gp = GRID * cs;
    const hitSet = grid ? new Set<string>() : undefined;
    if (grid && hitSet) {
      for (let r = 0; r < GRID; r++)
        for (let c = 0; c < GRID; c++)
          if (grid[r][c] === 'hit') hitSet.add(`${r},${c}`);
    }

    return (
      <svg
        width={gp + 20} height={gp + 20}
        viewBox={`-20 -20 ${gp + 20} ${gp + 20}`}
        style={{ display: 'block' }}
      >
        {/* Row labels */}
        {'ABCDEFGHIJ'.split('').map((l, i) => (
          <text key={l} x={-12} y={i * cs + cs / 2 + 4} textAnchor="middle"
            fill="rgba(100,210,255,0.5)" fontSize={9} fontWeight={700}>{l}</text>
        ))}
        {/* Col labels */}
        {Array.from({ length: 10 }, (_, i) => (
          <text key={i} x={i * cs + cs / 2} y={-6} textAnchor="middle"
            fill="rgba(100,210,255,0.5)" fontSize={9} fontWeight={700}>{i + 1}</text>
        ))}

        {/* Grid cells */}
        {Array.from({ length: GRID }, (_, r) =>
          Array.from({ length: GRID }, (_, c) => {
            const state = grid ? grid[r][c] : 'empty';
            const isHov = !small && hoverSet.has(`${r},${c}`);
            const clickable = !!onClick && state === 'empty';
            const isTargetHover = hoverTarget?.r === r && hoverTarget?.c === c && clickable;

            let fill = 'rgba(10,22,40,0.5)';
            if (isHov) fill = hoverValid ? `${curShip?.color || '#3b82f6'}33` : 'rgba(239,68,68,0.25)';
            if (isTargetHover) fill = 'rgba(52,120,246,0.2)';

            return (
              <g key={`${r}-${c}`}>
                <rect
                  x={c * cs + 0.5} y={r * cs + 0.5} width={cs - 1} height={cs - 1}
                  fill={fill} stroke="rgba(52,120,246,0.12)" strokeWidth={0.5}
                  style={{ cursor: clickable ? 'crosshair' : 'default' }}
                  onClick={() => onClick?.(r, c)}
                  onMouseEnter={() => {
                    onHover?.(r, c);
                    if (clickable) setHoverTarget({ r, c });
                  }}
                  onMouseLeave={() => {
                    if (!small) setHoverCells([]);
                    setHoverTarget(null);
                  }}
                />
                {/* Miss dot */}
                {state === 'miss' && (
                  <circle cx={c * cs + cs / 2} cy={r * cs + cs / 2} r={cs / 8}
                    fill="rgba(100,210,255,0.35)">
                    <animate attributeName="r" values={`${cs / 10};${cs / 7};${cs / 8}`} dur="0.4s" fill="freeze" />
                  </circle>
                )}
                {/* Hit X (for enemy grid) */}
                {state === 'hit' && !showShips && (
                  <g>
                    <circle cx={c * cs + cs / 2} cy={r * cs + cs / 2} r={cs / 3}
                      fill="rgba(239,68,68,0.6)" />
                    <line x1={c * cs + cs * 0.3} y1={r * cs + cs * 0.3} x2={c * cs + cs * 0.7} y2={r * cs + cs * 0.7}
                      stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                    <line x1={c * cs + cs * 0.7} y1={r * cs + cs * 0.3} x2={c * cs + cs * 0.3} y2={r * cs + cs * 0.7}
                      stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })
        )}

        {/* Ships as continuous SVG shapes */}
        {showShips && placedShips.map(ship => (
          <ShipSVG key={ship.id} ship={ship} cellSize={cs} isHit={hitSet} />
        ))}

        {/* Hover preview ship */}
        {!small && hoverCells.length > 0 && curShip && hoverValid && (
          <g opacity={0.5}>
            {(() => {
              const minR = Math.min(...hoverCells.map(c => c[0]));
              const minC = Math.min(...hoverCells.map(c => c[1]));
              const isH = orientation === 'H';
              const w = isH ? curShip.size * cs : cs;
              const h = isH ? cs : curShip.size * cs;
              const pad = 3;
              const rr = Math.min(w - pad * 2, h - pad * 2) / 2 - 1;
              return (
                <rect x={minC * cs + pad} y={minR * cs + pad}
                  width={w - pad * 2} height={h - pad * 2} rx={rr}
                  fill={curShip.color} stroke={curShip.colorLight} strokeWidth={1.5} />
              );
            })()}
          </g>
        )}

        {/* Ripple on last hit */}
        {lastHit && (
          <circle cx={lastHit.c * cs + cs / 2} cy={lastHit.r * cs + cs / 2} r={2}
            fill="none" stroke={lastHit.hit ? '#ef4444' : '#60a5fa'} strokeWidth={2} opacity={0.8}>
            <animate attributeName="r" from="2" to={cs} dur="0.7s" fill="freeze" />
            <animate attributeName="opacity" from="0.8" to="0" dur="0.7s" fill="freeze" />
          </circle>
        )}
      </svg>
    );
  };

  const allPlaced = placedShips.length === SHIP_DEFS.length;
  const font = '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif';
  const bg = 'linear-gradient(180deg, #060e1a 0%, #0d1f33 50%, #081420 100%)';
  const glass = 'rgba(10,25,45,0.75)';
  const border = 'rgba(52,120,246,0.18)';

  // ── PLACEMENT ──────────────────────────────────────────────────────────────

  if (phase === 'PLACEMENT') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '12px 8px', background: bg, fontFamily: font, overflow: 'auto',
      }}>
        <motion.div initial={{ y: -15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{ textAlign: 'center', marginBottom: 10 }}>
          <h1 style={{
            fontSize: 26, fontWeight: 900, letterSpacing: 1,
            background: 'linear-gradient(135deg, #3478F6, #60a5fa, #22d3ee)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>⚓ BATAILLE NAVALE</h1>
          <p style={{ fontSize: 12, color: 'rgba(100,210,255,0.5)', marginTop: 2, fontWeight: 500 }}>
            Place ta flotte — les bateaux ne peuvent pas se toucher !
          </p>
        </motion.div>

        {/* Ship queue */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10, maxWidth: 460 }}>
          {SHIP_DEFS.map((def, i) => {
            const placed = i < placedShips.length;
            const active = i === currentShipIdx;
            return (
              <div key={def.id} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 8,
                background: placed ? 'rgba(10,22,40,0.4)' : active ? `${def.color}22` : 'rgba(10,22,40,0.3)',
                border: active ? `2px solid ${def.color}` : `1px solid ${border}`,
                opacity: placed ? 0.35 : 1, transition: 'all 0.2s',
              }}>
                <div style={{
                  width: def.size * 10 + 8, height: 10, borderRadius: 5,
                  background: placed ? '#333' : `linear-gradient(90deg, ${def.color}, ${def.colorLight})`,
                }} />
                <span style={{
                  fontSize: 11, fontWeight: 600, color: '#c8e0f5',
                  textDecoration: placed ? 'line-through' : 'none',
                }}>{def.name} ({def.size})</span>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button onClick={() => { setOrientation(o => o === 'H' ? 'V' : 'H'); setHoverCells([]); }}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: glass, border: `1px solid ${border}`, color: '#c8e0f5',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}>
            <span style={{
              display: 'inline-block', transition: 'transform 0.2s',
              transform: orientation === 'V' ? 'rotate(90deg)' : 'none', fontSize: 14,
            }}>⇄</span>
            {orientation === 'H' ? 'Horizontal' : 'Vertical'}
          </button>
          <button onClick={() => { if (placedShips.length === 0) return; setPlacedShips(p => p.slice(0, -1)); setCurrentShipIdx(i => i - 1); setHoverCells([]); }}
            disabled={placedShips.length === 0}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              background: glass, border: `1px solid ${border}`, color: '#c8e0f5',
              cursor: placedShips.length === 0 ? 'not-allowed' : 'pointer',
              opacity: placedShips.length === 0 ? 0.3 : 1,
            }}>↩ Annuler</button>
        </div>

        {/* Grid */}
        <div style={{
          padding: 6, borderRadius: 14, background: glass, border: `1px solid ${border}`,
          boxShadow: '0 0 30px rgba(52,120,246,0.1)',
        }}>
          {renderSVGGrid(null, allPlaced ? null : handlePlace, allPlaced ? null : handleHover, true, false)}
        </div>

        {/* Ready */}
        {allPlaced && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReady}
            style={{
              marginTop: 14, padding: '10px 28px', borderRadius: 12, fontSize: 16, fontWeight: 800,
              background: 'linear-gradient(135deg, #3478F6, #1a4da8)',
              color: '#fff', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(52,120,246,0.4)',
            }}
          >⚓ Flotte prête !</motion.button>
        )}

        {!allPlaced && curShip && (
          <p style={{ marginTop: 10, fontSize: 12, color: 'rgba(100,210,255,0.5)' }}>
            <span style={{ color: curShip.color, fontWeight: 700 }}>{curShip.name}</span> — {curShip.size} cases
          </p>
        )}
      </div>
    );
  }

  // ── WAITING ────────────────────────────────────────────────────────────────

  if (phase === 'WAITING') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: bg, fontFamily: font,
      }}>
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ fontSize: 52, marginBottom: 16 }}>⚓</motion.div>
        <h2 style={{ color: '#c8e0f5', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Flotte déployée !</h2>
        <p style={{ color: 'rgba(100,210,255,0.5)', fontSize: 13 }}>En attente de l'adversaire...</p>
        <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
          style={{ marginTop: 16, width: 40, height: 3, borderRadius: 2, background: '#3478F6' }} />
      </div>
    );
  }

  // ── BATTLE ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 4px', background: bg, fontFamily: font, overflow: 'auto',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 style={{
          fontSize: 18, fontWeight: 900,
          background: 'linear-gradient(135deg, #3478F6, #60a5fa)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>⚓ BATAILLE NAVALE</h1>
        <div style={{
          fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
          background: glass, border: `1px solid ${border}`, color: 'rgba(100,210,255,0.6)',
        }}>💀 {enemySunkShips.length}/{SHIP_DEFS.length}</div>
      </div>

      {/* Turn */}
      <motion.div
        key={isPlayerTurn ? 'my' : 'op'}
        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '4px 16px', borderRadius: 16, fontSize: 13, fontWeight: 700, marginBottom: 6,
          background: gameOver ? 'rgba(52,199,89,0.12)' : isPlayerTurn ? 'rgba(52,120,246,0.12)' : 'rgba(100,100,100,0.1)',
          color: gameOver ? '#34C759' : isPlayerTurn ? '#60a5fa' : '#6b7280',
          border: `1px solid ${gameOver ? 'rgba(52,199,89,0.25)' : isPlayerTurn ? 'rgba(52,120,246,0.25)' : 'rgba(100,100,100,0.12)'}`,
        }}
      >
        {gameOver
          ? (winner === playerId ? '🏆 Victoire !' : '💥 Défaite...')
          : isPlayerTurn ? '🎯 À toi !' : '⏳ Adversaire...'}
      </motion.div>

      {/* Sunk message */}
      <AnimatePresence>
        {sunkMsg && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            style={{
              padding: '6px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, marginBottom: 4,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
            }}>{sunkMsg}</motion.div>
        )}
      </AnimatePresence>

      {/* Enemy grid */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(239,68,68,0.5)', marginBottom: 2, textTransform: 'uppercase' }}>
          Flotte Ennemie
        </div>
        <div style={{ padding: 4, borderRadius: 12, background: glass, border: `1px solid ${border}` }}>
          {renderSVGGrid(enemyGrid, gameOver ? null : isPlayerTurn ? handleFire : null, null, false, false)}
        </div>
      </div>

      {/* Enemy fleet status */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6, maxWidth: 400 }}>
        {SHIP_DEFS.map(def => {
          const sunk = enemySunkShips.includes(def.name);
          return (
            <span key={def.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 5,
              fontSize: 10, fontWeight: 600,
              background: sunk ? 'rgba(10,22,40,0.4)' : `${def.color}22`,
              color: sunk ? '#4b5563' : '#c8e0f5', textDecoration: sunk ? 'line-through' : 'none',
            }}>
              <div style={{
                width: def.size * 6, height: 4, borderRadius: 2,
                background: sunk ? '#374151' : `linear-gradient(90deg, ${def.color}, ${def.colorLight})`,
              }} />
              {def.name}
            </span>
          );
        })}
      </div>

      {/* My grid */}
      <div>
        <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(100,210,255,0.4)', marginBottom: 2, textTransform: 'uppercase' }}>
          Ma Flotte
        </div>
        <div style={{ padding: 4, borderRadius: 12, background: glass, border: `1px solid ${border}` }}>
          {renderSVGGrid(myGrid, null, null, true, true)}
        </div>
      </div>
    </div>
  );
}
