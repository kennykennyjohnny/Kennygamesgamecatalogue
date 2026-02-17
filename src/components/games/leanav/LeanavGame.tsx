import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════
// LÉA NAVAL — Bataille Navale  ×  Vin Rouge  ×  Peinture
//
// Ambiance : toile de peintre illuminée, cadre doré, fond atelier chaud
// Pièces  : bouteilles de vin couchées (Grand Cru 5, Bordeaux 4 …)
// Hits    : taches de vin / éclaboussures rouges
// Misses  : coups de pinceau dorés
// ═══════════════════════════════════════════════════════════════════════════

type Phase = 'PLACEMENT' | 'WAITING' | 'BATTLE';
type Dir = 'H' | 'V';
type CellState = 'empty' | 'miss' | 'hit';

interface ShipDef { id: string; name: string; size: number; color: string; label: string }
interface Ship extends ShipDef { cells: [number, number][]; dir: Dir; sunk: boolean }

const GRID = 10;
const CELL = 34;

const SHIPS: ShipDef[] = [
  { id: 'grand_cru',  name: 'Grand Cru',   size: 5, color: '#7b1024', label: '🍷' },
  { id: 'bordeaux',   name: 'Bordeaux',     size: 4, color: '#8b2040', label: '🍾' },
  { id: 'bourgogne',  name: 'Bourgogne',    size: 3, color: '#601848', label: '🍇' },
  { id: 'champagne',  name: 'Champagne',    size: 3, color: '#9b7820', label: '🥂' },
  { id: 'beaujolais', name: 'Beaujolais',   size: 2, color: '#a03048', label: '🫗' },
];

const grid0 = (): CellState[][] => Array.from({ length: GRID }, () => Array(GRID).fill('empty'));

function cellsFor(r: number, c: number, size: number, dir: Dir): [number, number][] | null {
  const out: [number, number][] = [];
  for (let i = 0; i < size; i++) {
    const nr = dir === 'V' ? r + i : r;
    const nc = dir === 'H' ? c + i : c;
    if (nr >= GRID || nc >= GRID) return null;
    out.push([nr, nc]);
  }
  return out;
}

function adjacent(cells: [number, number][], ships: Ship[]): boolean {
  const buf = new Set<string>();
  for (const s of ships)
    for (const [r, c] of s.cells)
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          buf.add(`${r + dr},${c + dc}`);
  return cells.some(([r, c]) => buf.has(`${r},${c}`));
}

function overlaps(cells: [number, number][], ships: Ship[]): boolean {
  const s = new Set(ships.flatMap(sh => sh.cells.map(([r, c]) => `${r},${c}`)));
  return cells.some(([r, c]) => s.has(`${r},${c}`));
}

// ── Beautiful Wine Bottle ────────────────────────────────────────────────────

function WineBottle({ ship, cs }: { ship: Ship; cs: number }) {
  const isH = ship.dir === 'H';
  const minR = Math.min(...ship.cells.map(c => c[0]));
  const minC = Math.min(...ship.cells.map(c => c[1]));
  const bw = isH ? ship.size * cs : cs;
  const bh = isH ? cs : ship.size * cs;
  const m = 3;

  // Bottle dimensions inside the bounding box
  const bodyW = bw - m * 2;
  const bodyH = bh - m * 2;
  const neckRatio = 0.2;

  if (isH) {
    const neckW = bodyW * neckRatio;
    const bodyMainW = bodyW - neckW;
    const bodyR = bodyH * 0.4;
    return (
      <g transform={`translate(${minC * cs + m},${minR * cs + m})`}>
        <rect x={0} y={1} width={bodyW} height={bodyH} rx={bodyR} fill="rgba(0,0,0,0.2)" />
        {/* Main body */}
        <rect x={neckW} y={0} width={bodyMainW} height={bodyH} rx={bodyR}
          fill={ship.color} />
        {/* Shine */}
        <rect x={neckW + 3} y={2} width={bodyMainW - 6} height={bodyH * 0.3} rx={bodyR * 0.6}
          fill="rgba(255,255,255,0.12)" />
        {/* Neck */}
        <rect x={0} y={bodyH * 0.25} width={neckW + bodyR} height={bodyH * 0.5}
          rx={bodyH * 0.25} fill={ship.color} />
        {/* Cork */}
        <rect x={-2} y={bodyH * 0.32} width={6} height={bodyH * 0.36}
          rx={3} fill="#c9a050" stroke="#a07830" strokeWidth={0.5} />
        {/* Label */}
        <rect x={bodyW * 0.4} y={bodyH * 0.18} width={bodyW * 0.35} height={bodyH * 0.64}
          rx={2} fill="rgba(255,240,220,0.18)" stroke="rgba(255,220,180,0.12)" strokeWidth={0.3} />
        <text x={bodyW * 0.57} y={bodyH * 0.58} textAnchor="middle"
          fontSize={Math.min(7, bodyH * 0.3)} fill="rgba(255,220,180,0.4)"
          fontFamily="Georgia, serif" fontStyle="italic" fontWeight={700}>
          {ship.name.split(' ')[0]}
        </text>
        {/* Foil */}
        <rect x={neckW - 2} y={bodyH * 0.2} width={4} height={bodyH * 0.6}
          rx={1} fill={ship.id === 'champagne' ? '#d4a853' : ship.color} opacity={0.5} />
      </g>
    );
  } else {
    const neckH = bodyH * neckRatio;
    const bodyMainH = bodyH - neckH;
    const bodyR = bodyW * 0.4;
    return (
      <g transform={`translate(${minC * cs + m},${minR * cs + m})`}>
        <rect x={1} y={0} width={bodyW} height={bodyH} rx={bodyR} fill="rgba(0,0,0,0.2)" />
        <rect x={0} y={neckH} width={bodyW} height={bodyMainH} rx={bodyR} fill={ship.color} />
        <rect x={2} y={neckH + 3} width={bodyW * 0.3} height={bodyMainH - 6} rx={bodyR * 0.6}
          fill="rgba(255,255,255,0.12)" />
        <rect x={bodyW * 0.25} y={0} width={bodyW * 0.5} height={neckH + bodyR}
          rx={bodyW * 0.25} fill={ship.color} />
        <rect x={bodyW * 0.32} y={-2} width={bodyW * 0.36} height={6}
          rx={3} fill="#c9a050" stroke="#a07830" strokeWidth={0.5} />
        <rect x={bodyW * 0.18} y={bodyH * 0.4} width={bodyW * 0.64} height={bodyH * 0.35}
          rx={2} fill="rgba(255,240,220,0.18)" stroke="rgba(255,220,180,0.12)" strokeWidth={0.3} />
        <text x={bodyW * 0.5} y={bodyH * 0.62} textAnchor="middle"
          fontSize={Math.min(7, bodyW * 0.3)} fill="rgba(255,220,180,0.4)"
          fontFamily="Georgia, serif" fontStyle="italic" fontWeight={700}>
          {ship.name.split(' ')[0]}
        </text>
      </g>
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════

export default function LeanavGame({ gameId, playerId, opponentId, isPlayerTurn, gameState, onMove, onGameOver }: any) {
  const [phase, setPhase] = useState<Phase>('PLACEMENT');
  const [ships, setShips] = useState<Ship[]>([]);
  const [shipIdx, setShipIdx] = useState(0);
  const [dir, setDir] = useState<Dir>('H');
  const [hover, setHover] = useState<[number, number][]>([]);
  const [hoverOk, setHoverOk] = useState(true);
  const [myGrid, setMyGrid] = useState(grid0);
  const [opGrid, setOpGrid] = useState(grid0);
  const [mySunk, setMySunk] = useState<string[]>([]);
  const [opSunk, setOpSunk] = useState<string[]>([]);
  const [lastHit, setLastHit] = useState<{r: number; c: number; hit: boolean} | null>(null);
  const [sunkMsg, setSunkMsg] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [win, setWin] = useState<string | null>(null);
  const [hoverTgt, setHoverTgt] = useState<{r: number; c: number} | null>(null);
  const sunkT = useRef<ReturnType<typeof setTimeout>>();

  // Random paint specks for canvas texture (memoized)
  const canvasSpecks = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      x: (i * 37 + 13) % (GRID * CELL),
      y: (i * 23 + 7) % (GRID * CELL),
      r: 0.5 + (i % 4) * 0.4,
      color: ['rgba(139,32,56,0.06)', 'rgba(212,160,83,0.05)', 'rgba(160,48,72,0.04)', 'rgba(155,120,32,0.05)'][i % 4],
    })), []);

  // ── Reconstruct state from move history on mount ──────────────────────────
  const reconstructed = useRef(false);

  useEffect(() => {
    if (reconstructed.current || !gameState?.moves) return;
    const moves = gameState.moves as any[];
    if (moves.length === 0) return;

    // Check if I already sent 'ready' — recover my ships from _playerState
    const myReady = moves.find((m: any) => m.playerId === playerId && m.type === 'ready');
    const opReady = moves.find((m: any) => m.playerId === opponentId && m.type === 'ready');

    // Recover ships from player state stored in gameState
    const myShipData = gameState[`player_${playerId}`]?.ships;
    if (myReady && myShipData) {
      const recovered: Ship[] = myShipData.map((s: any) => {
        const def = SHIPS.find(d => d.id === s.id)!;
        return { ...def, cells: s.cells, dir: s.dir, sunk: false };
      });
      setShips(recovered);
      setShipIdx(SHIPS.length);

      if (opReady) {
        // Both ready → reconstruct battle state from fire/result history
        const mg = grid0();
        const og = grid0();
        const mySunkNames: string[] = [];
        const opSunkNames: string[] = [];

        for (const m of moves) {
          if (m.type === 'fire' && m.playerId === opponentId) {
            // Opponent fired at me — check result in subsequent result move
            const resultMove = moves.find((rm: any) => rm.playerId === playerId && rm.type === 'result' && rm.r === m.r && rm.c === m.c);
            if (resultMove) {
              mg[m.r][m.c] = resultMove.hit ? 'hit' : 'miss';
              if (resultMove.sunk && resultMove.name) mySunkNames.push(resultMove.name);
            }
          }
          if (m.type === 'fire' && m.playerId === playerId) {
            const resultMove = moves.find((rm: any) => rm.playerId === opponentId && rm.type === 'result' && rm.r === m.r && rm.c === m.c);
            if (resultMove) {
              og[m.r][m.c] = resultMove.hit ? 'hit' : 'miss';
              if (resultMove.sunk && resultMove.name && !opSunkNames.includes(resultMove.name)) opSunkNames.push(resultMove.name);
            }
          }
        }

        setMyGrid(mg);
        setOpGrid(og);
        setMySunk([...new Set(mySunkNames)]);
        setOpSunk([...new Set(opSunkNames)]);
        setPhase('BATTLE');

        // Check if game was already won
        if ([...new Set(mySunkNames)].length >= SHIPS.length) { setOver(true); setWin(opponentId); }
        if ([...new Set(opSunkNames)].length >= SHIPS.length) { setOver(true); setWin(playerId); }
      } else {
        setPhase('WAITING');
      }
      reconstructed.current = true;
    } else if (opReady && !myReady) {
      // Opponent ready but I haven't placed ships yet — stay in placement
      reconstructed.current = true;
    }
  }, [gameState, playerId, opponentId]);

  // ── Sync ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId) return;

    if (m.type === 'ready' && phase === 'WAITING') setPhase('BATTLE');

    if (m.type === 'fire' && phase === 'BATTLE') {
      const { r, c } = m;
      const hit = ships.find(s => s.cells.some(([sr, sc]) => sr === r && sc === c));
      const g = myGrid.map(row => [...row]);
      g[r][c] = hit ? 'hit' : 'miss';
      setMyGrid(g);
      setLastHit({ r, c, hit: !!hit });
      setTimeout(() => setLastHit(null), 1200);
      const sunk = hit ? hit.cells.every(([sr, sc]) => (sr === r && sc === c) || g[sr][sc] === 'hit') : false;
      if (sunk && hit) {
        setMySunk(prev => {
          const n = [...prev, hit.name];
          if (n.length >= SHIPS.length) { setOver(true); setWin(opponentId); }
          return n;
        });
      }
      onMove({ type: 'result', r, c, hit: !!hit, sunk, name: sunk ? hit?.name : null, _keepTurn: !!hit });
    }

    if (m.type === 'result') {
      const { r, c, hit, sunk, name } = m;
      const g = opGrid.map(row => [...row]);
      g[r][c] = hit ? 'hit' : 'miss';
      setOpGrid(g);
      setLastHit({ r, c, hit });
      setTimeout(() => setLastHit(null), 1200);
      if (sunk && name) {
        setOpSunk(prev => {
          const n = [...prev, name];
          if (n.length >= SHIPS.length) { setOver(true); setWin(playerId); onGameOver({ winner_id: playerId }); }
          return n;
        });
        setSunkMsg(`🍷 ${name} brisé !`);
        if (sunkT.current) clearTimeout(sunkT.current);
        sunkT.current = setTimeout(() => setSunkMsg(null), 3000);
      }
    }
  }, [gameState?.lastMove]);

  // Also check for opponent ready when in WAITING phase (polling fallback)
  useEffect(() => {
    if (!gameState?.moves || phase !== 'WAITING') return;
    if (gameState.moves.some((m: any) => m.playerId === opponentId && m.type === 'ready')) setPhase('BATTLE');
  }, [gameState, phase, opponentId]);

  useEffect(() => () => { if (sunkT.current) clearTimeout(sunkT.current); }, []);

  // ── Placement ──────────────────────────────────────────────────────────────

  const cur = shipIdx < SHIPS.length ? SHIPS[shipIdx] : null;

  const onHover = useCallback((r: number, c: number) => {
    if (!cur) return;
    const cells = cellsFor(r, c, cur.size, dir);
    if (!cells) { setHover([]); setHoverOk(false); return; }
    setHover(cells);
    setHoverOk(!overlaps(cells, ships) && !adjacent(cells, ships));
  }, [cur, dir, ships]);

  const onPlace = useCallback((r: number, c: number) => {
    if (!cur) return;
    const cells = cellsFor(r, c, cur.size, dir);
    if (!cells || overlaps(cells, ships) || adjacent(cells, ships)) return;
    setShips(prev => [...prev, { ...cur, cells, dir, sunk: false }]);
    setShipIdx(i => i + 1);
    setHover([]);
  }, [cur, dir, ships]);

  const onReady = () => {
    if (ships.length !== SHIPS.length) return;
    onMove({
      type: 'ready',
      _playerState: { ships: ships.map(s => ({ id: s.id, name: s.name, size: s.size, cells: s.cells, dir: s.dir })) },
      _keepTurn: false,
    });
    const opReady = gameState?.moves?.some((m: any) => m.playerId === opponentId && m.type === 'ready');
    setPhase(opReady ? 'BATTLE' : 'WAITING');
  };

  const onFire = useCallback((r: number, c: number) => {
    if (!isPlayerTurn || over || phase !== 'BATTLE' || opGrid[r][c] !== 'empty') return;
    onMove({ type: 'fire', r, c, _keepTurn: true });
  }, [isPlayerTurn, over, phase, opGrid, onMove]);

  // ── Grid Component ─────────────────────────────────────────────────────────

  const hoverSet = new Set(hover.map(([r, c]) => `${r},${c}`));

  const BattleGrid = ({ grid, click, hov, showShips, small }: {
    grid: CellState[][] | null; click: ((r: number, c: number) => void) | null;
    hov: ((r: number, c: number) => void) | null; showShips: boolean; small: boolean;
  }) => {
    const cs = small ? 24 : CELL;
    const gp = GRID * cs;
    const pad = 20;

    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {/* Golden frame */}
        <div style={{
          padding: small ? 3 : 6,
          borderRadius: small ? 6 : 10,
          background: 'linear-gradient(145deg, #c9a050, #8b6920, #d4b060, #7a5a18)',
          boxShadow: small
            ? '0 2px 8px rgba(0,0,0,0.4)'
            : '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,220,160,0.3), 0 0 40px rgba(201,160,80,0.08)',
        }}>
          {/* Inner frame bevel */}
          <div style={{
            padding: small ? 2 : 4,
            borderRadius: small ? 4 : 7,
            background: 'linear-gradient(145deg, #5a3810, #3a2208)',
          }}>
            {/* Canvas surface */}
            <svg width={gp + pad} height={gp + pad} viewBox={`-${pad} -${pad} ${gp + pad} ${gp + pad}`}
              style={{ display: 'block', borderRadius: small ? 3 : 5, touchAction: 'none' }}
              onTouchMove={(e) => {
                if (small || !hov) return;
                e.preventDefault();
                const svg = e.currentTarget;
                const rect = svg.getBoundingClientRect();
                const touch = e.touches[0];
                const svgX = (touch.clientX - rect.left) / rect.width * (gp + pad) - pad;
                const svgY = (touch.clientY - rect.top) / rect.height * (gp + pad) - pad;
                const tr = Math.floor(svgY / cs);
                const tc = Math.floor(svgX / cs);
                if (tr >= 0 && tr < GRID && tc >= 0 && tc < GRID) {
                  hov(tr, tc);
                }
              }}>

              {/* Canvas background — warm linen texture */}
              <defs>
                <linearGradient id={`canvasBg${small ? 's' : ''}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2a1810" />
                  <stop offset="30%" stopColor="#321c14" />
                  <stop offset="60%" stopColor="#2e1a12" />
                  <stop offset="100%" stopColor="#241410" />
                </linearGradient>
                <pattern id={`canvasTex${small ? 's' : ''}`} width="4" height="4" patternUnits="userSpaceOnUse">
                  <rect width="4" height="4" fill="transparent" />
                  <line x1="0" y1="0" x2="4" y2="0" stroke="rgba(255,220,180,0.03)" strokeWidth="0.3" />
                  <line x1="0" y1="0" x2="0" y2="4" stroke="rgba(255,220,180,0.02)" strokeWidth="0.3" />
                </pattern>
              </defs>

              <rect x={-pad} y={-pad} width={gp + pad} height={gp + pad}
                fill={`url(#canvasBg${small ? 's' : ''})`} />
              <rect x={-pad} y={-pad} width={gp + pad} height={gp + pad}
                fill={`url(#canvasTex${small ? 's' : ''})`} />

              {/* Paint specks on canvas */}
              {!small && canvasSpecks.map((s, i) => (
                <circle key={i} cx={s.x} cy={s.y} r={s.r} fill={s.color} />
              ))}

              {/* Row labels A-J */}
              {'ABCDEFGHIJ'.split('').map((l, i) => (
                <text key={l} x={-11} y={i * cs + cs / 2 + 3} textAnchor="middle"
                  fill="rgba(201,160,80,0.35)" fontSize={small ? 6 : 8} fontWeight={700}
                  fontFamily="Georgia, serif" fontStyle="italic">{l}</text>
              ))}
              {Array.from({ length: 10 }, (_, i) => (
                <text key={i} x={i * cs + cs / 2} y={-6} textAnchor="middle"
                  fill="rgba(201,160,80,0.35)" fontSize={small ? 6 : 8} fontWeight={700}
                  fontFamily="Georgia, serif" fontStyle="italic">{i + 1}</text>
              ))}

              {/* Grid lines — subtle paint cracks */}
              {Array.from({ length: GRID + 1 }, (_, i) => (
                <g key={i}>
                  <line x1={0} y1={i * cs} x2={gp} y2={i * cs}
                    stroke="rgba(139,32,56,0.08)" strokeWidth={0.5} />
                  <line x1={i * cs} y1={0} x2={i * cs} y2={gp}
                    stroke="rgba(139,32,56,0.08)" strokeWidth={0.5} />
                </g>
              ))}

              {/* Cells */}
              {Array.from({ length: GRID }, (_, r) =>
                Array.from({ length: GRID }, (_, c) => {
                  const st = grid ? grid[r][c] : 'empty';
                  const isHov = !small && hoverSet.has(`${r},${c}`);
                  const canClick = !!click && st === 'empty';
                  const isTgt = hoverTgt?.r === r && hoverTgt?.c === c && canClick;

                  return (
                    <g key={`${r}-${c}`}>
                      {/* Hover highlight */}
                      {isHov && (
                        <rect x={c * cs + 1} y={r * cs + 1} width={cs - 2} height={cs - 2} rx={2}
                          fill={hoverOk ? 'rgba(123,16,36,0.15)' : 'rgba(255,0,0,0.12)'} />
                      )}
                      {isTgt && (
                        <rect x={c * cs + 1} y={r * cs + 1} width={cs - 2} height={cs - 2} rx={2}
                          fill="rgba(201,160,80,0.08)" />
                      )}

                      {/* Clickable area */}
                      <rect x={c * cs} y={r * cs} width={cs} height={cs}
                        fill="transparent" style={{ cursor: canClick ? 'crosshair' : 'default' }}
                        onClick={() => { hov?.(r, c); click?.(r, c); }}
                        onTouchEnd={(e) => { e.preventDefault(); hov?.(r, c); click?.(r, c); }}
                        onMouseEnter={() => { hov?.(r, c); if (canClick) setHoverTgt({ r, c }); }}
                        onMouseLeave={() => { if (!small) setHover([]); setHoverTgt(null); }}
                      />

                      {/* Miss — golden paint brush stroke */}
                      {st === 'miss' && (
                        <g>
                          <ellipse cx={c * cs + cs / 2} cy={r * cs + cs / 2}
                            rx={cs * 0.25} ry={cs * 0.15}
                            fill="rgba(201,160,80,0.25)"
                            transform={`rotate(${((r * 7 + c * 13) % 60) - 30}, ${c * cs + cs / 2}, ${r * cs + cs / 2})`} />
                          <ellipse cx={c * cs + cs / 2 + 2} cy={r * cs + cs / 2 - 1}
                            rx={cs * 0.12} ry={cs * 0.08}
                            fill="rgba(201,160,80,0.15)"
                            transform={`rotate(${((r * 11 + c * 3) % 40) - 20}, ${c * cs + cs / 2 + 2}, ${r * cs + cs / 2 - 1})`} />
                        </g>
                      )}

                      {/* Hit — wine spill stain */}
                      {st === 'hit' && !showShips && (
                        <g>
                          <circle cx={c * cs + cs / 2} cy={r * cs + cs / 2}
                            r={cs * 0.35} fill="rgba(123,16,36,0.5)" />
                          <circle cx={c * cs + cs / 2} cy={r * cs + cs / 2}
                            r={cs * 0.2} fill="rgba(180,20,50,0.6)" />
                          {/* Splash drops */}
                          <circle cx={c * cs + cs * 0.25} cy={r * cs + cs * 0.3}
                            r={cs * 0.06} fill="rgba(160,20,40,0.4)" />
                          <circle cx={c * cs + cs * 0.72} cy={r * cs + cs * 0.65}
                            r={cs * 0.05} fill="rgba(140,16,35,0.35)" />
                          {/* X mark */}
                          <line x1={c * cs + cs * 0.3} y1={r * cs + cs * 0.3}
                            x2={c * cs + cs * 0.7} y2={r * cs + cs * 0.7}
                            stroke="rgba(255,200,210,0.5)" strokeWidth={1.5} strokeLinecap="round" />
                          <line x1={c * cs + cs * 0.7} y1={r * cs + cs * 0.3}
                            x2={c * cs + cs * 0.3} y2={r * cs + cs * 0.7}
                            stroke="rgba(255,200,210,0.5)" strokeWidth={1.5} strokeLinecap="round" />
                        </g>
                      )}
                    </g>
                  );
                })
              )}

              {/* Wine bottles (ships) */}
              {showShips && ships.map(s => (
                <WineBottle key={s.id} ship={s} cs={cs} />
              ))}

              {/* Hit on own ships — wine splash overlay */}
              {showShips && grid && Array.from({ length: GRID }, (_, r) =>
                Array.from({ length: GRID }, (_, c) => {
                  if (grid[r][c] !== 'hit') return null;
                  return (
                    <g key={`h${r}-${c}`}>
                      <circle cx={c * cs + cs / 2} cy={r * cs + cs / 2}
                        r={cs * 0.3} fill="rgba(200,20,50,0.5)" />
                      <line x1={c * cs + cs * 0.3} y1={r * cs + cs * 0.3}
                        x2={c * cs + cs * 0.7} y2={r * cs + cs * 0.7}
                        stroke="rgba(255,220,230,0.6)" strokeWidth={1.8} strokeLinecap="round" />
                      <line x1={c * cs + cs * 0.7} y1={r * cs + cs * 0.3}
                        x2={c * cs + cs * 0.3} y2={r * cs + cs * 0.7}
                        stroke="rgba(255,220,230,0.6)" strokeWidth={1.8} strokeLinecap="round" />
                    </g>
                  );
                })
              )}

              {/* Hover preview */}
              {!small && hover.length > 0 && cur && hoverOk && (() => {
                const previewShip: Ship = {
                  ...cur, cells: hover as [number, number][], dir, sunk: false,
                };
                return <g opacity={0.4}><WineBottle ship={previewShip} cs={cs} /></g>;
              })()}

              {/* Hit/miss ripple */}
              {lastHit && (
                <circle cx={lastHit.c * cs + cs / 2} cy={lastHit.r * cs + cs / 2} r={2}
                  fill="none" stroke={lastHit.hit ? '#c0183a' : '#c9a050'} strokeWidth={1.5} opacity={0.8}>
                  <animate attributeName="r" from="2" to={`${cs * 0.8}`} dur="0.7s" fill="freeze" />
                  <animate attributeName="opacity" from="0.8" to="0" dur="0.7s" fill="freeze" />
                </circle>
              )}
            </svg>
          </div>
        </div>
      </div>
    );
  };

  const allPlaced = ships.length === SHIPS.length;
  const font = 'Georgia, "Playfair Display", serif';

  // ── Background wrapper ─────────────────────────────────────────────────────

  const Bg = ({ children }: { children: React.ReactNode }) => (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '12px 6px', fontFamily: font, overflow: 'auto',
      background: 'linear-gradient(160deg, #18100c 0%, #241810 25%, #2a1c14 50%, #1e1410 75%, #14100c 100%)',
    }}>
      {/* Warm ambient glow */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(201,160,80,0.04) 0%, transparent 60%)',
      }} />
      {children}
    </div>
  );

  // ── PLACEMENT ──────────────────────────────────────────────────────────────

  if (phase === 'PLACEMENT') {
    return (
      <Bg>
        <motion.div initial={{ y: -15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{ textAlign: 'center', marginBottom: 10 }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, fontStyle: 'italic', margin: 0,
            color: '#c9a050', textShadow: '0 0 20px rgba(201,160,80,0.15)',
          }}>🍷 Léa Naval</h1>
          <p style={{ fontSize: 11, color: 'rgba(201,160,80,0.35)', margin: '2px 0 0', fontStyle: 'italic' }}>
            Dispose tes bouteilles sur la toile — elles ne doivent pas se toucher
          </p>
        </motion.div>

        {/* Bottle queue */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8, maxWidth: 440 }}>
          {SHIPS.map((def, i) => {
            const placed = i < ships.length;
            const active = i === shipIdx;
            return (
              <motion.div key={def.id} animate={active ? { scale: [1, 1.03, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8,
                  background: placed ? 'rgba(20,10,8,0.3)' : active ? 'rgba(123,16,36,0.08)' : 'rgba(20,10,8,0.15)',
                  border: active ? '1.5px solid rgba(201,160,80,0.3)' : '1px solid rgba(201,160,80,0.08)',
                  opacity: placed ? 0.25 : 1, transition: 'all 0.3s',
                }}>
                <span style={{ fontSize: 14 }}>{def.label}</span>
                <div style={{
                  width: def.size * 8, height: 8, borderRadius: 4,
                  background: placed ? 'rgba(40,20,15,0.5)' : `linear-gradient(90deg, ${def.color}, ${def.color}cc)`,
                  boxShadow: placed ? 'none' : `0 0 6px ${def.color}33`,
                }} />
                <span style={{ fontSize: 10, fontWeight: 600, fontStyle: 'italic',
                  color: placed ? 'rgba(201,160,80,0.15)' : 'rgba(201,160,80,0.5)',
                  textDecoration: placed ? 'line-through' : 'none',
                }}>{def.name}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <button onClick={() => { setDir(d => d === 'H' ? 'V' : 'H'); setHover([]); }}
            style={{ padding: '5px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: 'rgba(20,10,8,0.3)', border: '1px solid rgba(201,160,80,0.12)',
              color: 'rgba(201,160,80,0.5)', cursor: 'pointer', fontStyle: 'italic' }}>
            ⇄ {dir === 'H' ? 'Horizontal' : 'Vertical'}
          </button>
          <button onClick={() => { if (!ships.length) return; setShips(p => p.slice(0, -1)); setShipIdx(i => i - 1); setHover([]); }}
            disabled={!ships.length}
            style={{ padding: '5px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700,
              background: 'rgba(20,10,8,0.3)', border: '1px solid rgba(201,160,80,0.12)',
              color: 'rgba(201,160,80,0.5)', cursor: ships.length ? 'pointer' : 'not-allowed',
              opacity: ships.length ? 1 : 0.3, fontStyle: 'italic' }}>
            ↩ Annuler
          </button>
        </div>

        <BattleGrid grid={null} click={allPlaced ? null : onPlace} hov={allPlaced ? null : onHover} showShips={true} small={false} />

        {allPlaced && (
          <motion.button initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onReady}
            style={{ marginTop: 12, padding: '10px 30px', borderRadius: 10, fontSize: 15, fontWeight: 800,
              fontStyle: 'italic', background: 'linear-gradient(135deg, #7b1024, #5a0c1a)',
              color: '#e8c090', border: '1px solid rgba(201,160,80,0.2)', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(123,16,36,0.25), 0 0 30px rgba(201,160,80,0.05)',
              letterSpacing: 1 }}>
            🍷 Cave prête !
          </motion.button>
        )}

        {!allPlaced && cur && (
          <p style={{ marginTop: 8, fontSize: 11, color: 'rgba(201,160,80,0.3)', fontStyle: 'italic' }}>
            {cur.label} Place <strong style={{ color: 'rgba(201,160,80,0.5)' }}>{cur.name}</strong> — {cur.size} cases
          </p>
        )}
      </Bg>
    );
  }

  // ── WAITING ────────────────────────────────────────────────────────────────

  if (phase === 'WAITING') {
    return (
      <Bg>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 5, repeat: Infinity }}
            style={{ fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(123,16,36,0.3))' }}>🍷</motion.div>
          <h2 style={{ color: '#c9a050', fontSize: 20, fontWeight: 800, fontStyle: 'italic', marginBottom: 6 }}>Cave prête !</h2>
          <p style={{ color: 'rgba(201,160,80,0.3)', fontSize: 12, fontStyle: 'italic' }}>En attente du sommelier adverse…</p>
          <motion.div animate={{ opacity: [0.15, 0.5, 0.15] }} transition={{ duration: 2.5, repeat: Infinity }}
            style={{ marginTop: 20, width: 50, height: 1.5, borderRadius: 1, background: '#c9a050' }} />
        </div>
      </Bg>
    );
  }

  // ── BATTLE ─────────────────────────────────────────────────────────────────

  return (
    <Bg>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, fontStyle: 'italic', margin: 0,
          color: '#c9a050', textShadow: '0 0 15px rgba(201,160,80,0.1)', letterSpacing: 0.5 }}>🍷 Léa Naval</h1>
        <div style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8,
          background: 'rgba(123,16,36,0.1)', border: '1px solid rgba(123,16,36,0.15)',
          color: 'rgba(201,160,80,0.5)', fontStyle: 'italic' }}>
          💀 {opSunk.length}/{SHIPS.length} coulés
        </div>
      </div>

      <motion.div key={isPlayerTurn ? 'y' : 'n'} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '4px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700, fontStyle: 'italic', marginBottom: 8,
          background: over ? 'rgba(52,199,89,0.08)' : isPlayerTurn ? 'rgba(123,16,36,0.08)' : 'rgba(80,80,80,0.04)',
          color: over ? (win === playerId ? '#4ade80' : '#e85050') : isPlayerTurn ? '#c9a050' : '#555',
          border: `1px solid ${over ? 'rgba(52,199,89,0.15)' : isPlayerTurn ? 'rgba(201,160,80,0.15)' : 'rgba(80,80,80,0.06)'}`,
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        }}>
        {over ? (win === playerId ? '🏆 Victoire !' : '💔 Défaite…') : isPlayerTurn ? '🎯 À toi de tirer !' : '⏳ Tour adverse…'}
      </motion.div>

      <AnimatePresence>
        {sunkMsg && (
          <motion.div initial={{ scale: 0.5, opacity: 0, y: -8 }} animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.5, opacity: 0, y: -8 }}
            style={{ padding: '6px 20px', borderRadius: 10, fontSize: 15, fontWeight: 700, fontStyle: 'italic', marginBottom: 6,
              background: 'rgba(123,16,36,0.15)', border: '1px solid rgba(123,16,36,0.25)',
              color: '#d4506a', textShadow: '0 0 8px rgba(180,20,50,0.2)',
              boxShadow: '0 4px 16px rgba(123,16,36,0.1)',
            }}>
            {sunkMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enemy grid */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 2, fontStyle: 'italic',
          color: 'rgba(180,60,80,0.35)', marginBottom: 3, textTransform: 'uppercase' }}>🎯 Cave Ennemie</div>
        <BattleGrid grid={opGrid} click={over ? null : isPlayerTurn ? onFire : null} hov={null} showShips={false} small={false} />
      </div>

      {/* Fleet status */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8, maxWidth: 400 }}>
        {SHIPS.map(def => {
          const sunk = opSunk.includes(def.name);
          return (
            <span key={def.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', borderRadius: 6,
              fontSize: 10, fontWeight: 600, fontStyle: 'italic',
              background: sunk ? 'rgba(20,10,8,0.25)' : 'rgba(123,16,36,0.06)',
              color: sunk ? 'rgba(60,30,20,0.3)' : 'rgba(201,160,80,0.45)',
              textDecoration: sunk ? 'line-through' : 'none',
              border: `1px solid ${sunk ? 'rgba(60,30,20,0.1)' : 'rgba(123,16,36,0.06)'}`,
              transition: 'all 0.3s',
            }}>
              {def.label} {def.name}
            </span>
          );
        })}
      </div>

      {/* My grid */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 2, fontStyle: 'italic',
          color: 'rgba(201,160,80,0.25)', marginBottom: 3, textTransform: 'uppercase' }}>🛡️ Ma Cave</div>
        <BattleGrid grid={myGrid} click={null} hov={null} showShips={true} small={true} />
      </div>

      {/* My sunk info */}
      {mySunk.length > 0 && (
        <div style={{ textAlign: 'center', fontSize: 10, fontStyle: 'italic', color: 'rgba(200,60,80,0.4)', marginBottom: 6 }}>
          Perdus : {mySunk.join(', ')}
        </div>
      )}
    </Bg>
  );
}
