import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ═══════════════════════════════════════════════════════════════════════════
// LÉA NAVAL — Bataille Navale thème Vin Rouge & Peinture
// Les bateaux sont des bouteilles de vin, la grille est une toile de peintre
// ═══════════════════════════════════════════════════════════════════════════

type Phase = 'PLACEMENT' | 'WAITING' | 'BATTLE';
type Dir = 'H' | 'V';
type CellState = 'empty' | 'miss' | 'hit';

interface ShipDef { id: string; name: string; size: number; color: string; light: string }
interface Ship extends ShipDef { cells: [number, number][]; dir: Dir; sunk: boolean }

const GRID = 10;
const CELL = 36;

// Wine bottle fleet — each "ship" is a wine bottle
const SHIPS: ShipDef[] = [
  { id: 'grand_cru',    name: 'Grand Cru',        size: 5, color: '#6b1030', light: '#9b1b48' },
  { id: 'bordeaux',     name: 'Bordeaux',          size: 4, color: '#7c2d3a', light: '#a83c50' },
  { id: 'bourgogne',    name: 'Bourgogne',         size: 3, color: '#581845', light: '#7b2262' },
  { id: 'champagne',    name: 'Champagne',         size: 3, color: '#8b6914', light: '#c4972a' },
  { id: 'beaujolais',   name: 'Beaujolais',        size: 2, color: '#922b3e', light: '#c44058' },
];

// Wine/painting palette
const P = {
  bg: 'linear-gradient(145deg, #1a0a12 0%, #2d1018 30%, #1a0d14 60%, #0f0a10 100%)',
  canvas: 'rgba(25,12,18,0.6)',       // dark wine canvas
  canvasBorder: 'rgba(139,32,56,0.2)',
  cell: 'rgba(20,10,15,0.5)',
  cellBorder: 'rgba(139,32,56,0.12)',
  accent: '#c44058',
  accentGold: '#d4a053',
  text: '#e8c8d0',
  dim: 'rgba(196,64,88,0.5)',
  hit: '#ff2244',
  miss: 'rgba(212,160,83,0.4)',
};

const grid0 = (): CellState[][] => Array.from({ length: GRID }, () => Array(GRID).fill('empty'));

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Wine Bottle SVG ──────────────────────────────────────────────────────────

function BottleSVG({ ship, cs, hits }: { ship: Ship; cs: number; hits?: Set<string> }) {
  const isH = ship.dir === 'H';
  const minR = Math.min(...ship.cells.map(c => c[0]));
  const minC = Math.min(...ship.cells.map(c => c[1]));
  const w = isH ? ship.size * cs : cs;
  const h = isH ? cs : ship.size * cs;
  const pad = 4;

  return (
    <g transform={`translate(${minC * cs},${minR * cs})`}>
      {/* Shadow */}
      <rect x={pad + 1} y={pad + 2} width={w - pad * 2} height={h - pad * 2}
        rx={isH ? (h - pad * 2) / 2 : (w - pad * 2) / 2} fill="rgba(0,0,0,0.3)" />
      {/* Bottle body */}
      <rect x={pad} y={pad} width={w - pad * 2} height={h - pad * 2}
        rx={isH ? (h - pad * 2) / 2 : (w - pad * 2) / 2}
        fill={ship.color} stroke={ship.light} strokeWidth={1.2} />
      {/* Glass shine */}
      <rect
        x={isH ? pad + 4 : pad + 2}
        y={isH ? pad + 2 : pad + 4}
        width={isH ? w - pad * 2 - 8 : (w - pad * 2) * 0.35}
        height={isH ? (h - pad * 2) * 0.35 : h - pad * 2 - 8}
        rx={4} fill="rgba(255,255,255,0.12)" />

      {/* Neck (at the start of the bottle) */}
      {isH ? (
        <rect x={pad - 1} y={h / 2 - 4} width={8} height={8} rx={3}
          fill={ship.light} opacity={0.6} />
      ) : (
        <rect x={w / 2 - 4} y={pad - 1} width={8} height={8} rx={3}
          fill={ship.light} opacity={0.6} />
      )}

      {/* Cork */}
      {isH ? (
        <rect x={pad - 3} y={h / 2 - 2.5} width={5} height={5} rx={1.5}
          fill="#b8860b" stroke="#8b6914" strokeWidth={0.5} />
      ) : (
        <rect x={w / 2 - 2.5} y={pad - 3} width={5} height={5} rx={1.5}
          fill="#b8860b" stroke="#8b6914" strokeWidth={0.5} />
      )}

      {/* Label */}
      {ship.size >= 3 && (
        isH ? (
          <g>
            <rect x={w / 2 - 10} y={pad + 4} width={20} height={h - pad * 2 - 8}
              rx={2} fill="rgba(255,235,200,0.15)" />
            <rect x={w / 2 - 8} y={pad + 6} width={16} height={2} rx={1}
              fill="rgba(255,235,200,0.2)" />
          </g>
        ) : (
          <g>
            <rect x={pad + 4} y={h / 2 - 10} width={w - pad * 2 - 8} height={20}
              rx={2} fill="rgba(255,235,200,0.15)" />
            <rect x={pad + 6} y={h / 2 - 8} width={2} height={16} rx={1}
              fill="rgba(255,235,200,0.2)" />
          </g>
        )
      )}

      {/* Hit markers */}
      {hits && ship.cells.map(([cr, cc], i) => {
        if (!hits.has(`${cr},${cc}`)) return null;
        const cx = (cc - minC) * cs + cs / 2;
        const cy = (cr - minR) * cs + cs / 2;
        return (
          <g key={i}>
            <circle cx={cx} cy={cy} r={cs / 3} fill="rgba(255,0,0,0.6)" />
            {/* Wine splash */}
            <circle cx={cx - 3} cy={cy - 4} r={2} fill="#8b1030" opacity={0.7} />
            <circle cx={cx + 4} cy={cy + 2} r={1.5} fill="#6b1030" opacity={0.6} />
            <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} stroke="#ffccdd" strokeWidth={1.8} />
            <line x1={cx + 5} y1={cy - 5} x2={cx - 5} y2={cy + 5} stroke="#ffccdd" strokeWidth={1.8} />
          </g>
        );
      })}
    </g>
  );
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
  const [lastHit, setLastHit] = useState<{ r: number; c: number; hit: boolean } | null>(null);
  const [sunkMsg, setSunkMsg] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [win, setWin] = useState<string | null>(null);
  const [hoverTgt, setHoverTgt] = useState<{ r: number; c: number } | null>(null);

  const sunkT = useRef<ReturnType<typeof setTimeout>>();

  // ── Sync ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!gameState?.lastMove) return;
    const m = gameState.lastMove;
    if (m.playerId === playerId) return;

    if (m.type === 'ready' && phase === 'WAITING') setPhase('BATTLE');

    if (m.type === 'fire') {
      const { r, c } = m;
      const hit = ships.find(s => s.cells.some(([sr, sc]) => sr === r && sc === c));
      const g = myGrid.map(row => [...row]);
      g[r][c] = hit ? 'hit' : 'miss';
      setMyGrid(g);
      setLastHit({ r, c, hit: !!hit });
      setTimeout(() => setLastHit(null), 900);

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
      setTimeout(() => setLastHit(null), 900);
      if (sunk && name) {
        setOpSunk(prev => {
          const n = [...prev, name];
          if (n.length >= SHIPS.length) { setOver(true); setWin(playerId); onGameOver({ winner_id: playerId }); }
          return n;
        });
        setSunkMsg(`🍷 ${name} brisé !`);
        if (sunkT.current) clearTimeout(sunkT.current);
        sunkT.current = setTimeout(() => setSunkMsg(null), 2500);
      }
    }
  }, [gameState?.lastMove]);

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

  // ── Grid Renderer ──────────────────────────────────────────────────────────

  const hoverSet = new Set(hover.map(([r, c]) => `${r},${c}`));

  const Grid = ({ grid, click, hov, showShips, small }: {
    grid: CellState[][] | null; click: ((r: number, c: number) => void) | null;
    hov: ((r: number, c: number) => void) | null; showShips: boolean; small: boolean;
  }) => {
    const cs = small ? 26 : CELL;
    const gp = GRID * cs;
    const hitSet = new Set<string>();
    if (grid) {
      for (let r = 0; r < GRID; r++)
        for (let c = 0; c < GRID; c++)
          if (grid[r][c] === 'hit') hitSet.add(`${r},${c}`);
    }

    return (
      <svg width={gp + 22} height={gp + 22} viewBox={`-22 -22 ${gp + 22} ${gp + 22}`}>
        {/* Labels */}
        {'ABCDEFGHIJ'.split('').map((l, i) => (
          <text key={l} x={-12} y={i * cs + cs / 2 + 3} textAnchor="middle"
            fill={P.dim} fontSize={8} fontWeight={700} fontFamily="serif" fontStyle="italic">{l}</text>
        ))}
        {Array.from({ length: 10 }, (_, i) => (
          <text key={i} x={i * cs + cs / 2} y={-8} textAnchor="middle"
            fill={P.dim} fontSize={8} fontWeight={700} fontFamily="serif" fontStyle="italic">{i + 1}</text>
        ))}

        {/* Canvas texture overlay */}
        <rect x={0} y={0} width={gp} height={gp} rx={4}
          fill="rgba(25,12,18,0.15)" stroke={P.canvasBorder} strokeWidth={1} />

        {/* Cells */}
        {Array.from({ length: GRID }, (_, r) =>
          Array.from({ length: GRID }, (_, c) => {
            const st = grid ? grid[r][c] : 'empty';
            const isH = !small && hoverSet.has(`${r},${c}`);
            const canClick = !!click && st === 'empty';
            const isTgt = hoverTgt?.r === r && hoverTgt?.c === c && canClick;

            let fill = P.cell;
            if (isH) fill = hoverOk ? `${cur?.color || '#6b1030'}33` : 'rgba(255,0,0,0.15)';
            if (isTgt) fill = 'rgba(196,64,88,0.15)';

            return (
              <g key={`${r}-${c}`}>
                <rect x={c * cs + 0.5} y={r * cs + 0.5} width={cs - 1} height={cs - 1}
                  fill={fill} stroke={P.cellBorder} strokeWidth={0.5}
                  style={{ cursor: canClick ? 'crosshair' : 'default' }}
                  onClick={() => click?.(r, c)}
                  onMouseEnter={() => { hov?.(r, c); if (canClick) setHoverTgt({ r, c }); }}
                  onMouseLeave={() => { if (!small) setHover([]); setHoverTgt(null); }}
                />
                {st === 'miss' && (
                  <g>
                    {/* Paint splatter miss */}
                    <circle cx={c * cs + cs / 2} cy={r * cs + cs / 2} r={cs / 6}
                      fill={P.miss} />
                    <circle cx={c * cs + cs / 2 + 3} cy={r * cs + cs / 2 - 2} r={cs / 10}
                      fill={P.miss} opacity={0.6} />
                  </g>
                )}
                {st === 'hit' && !showShips && (
                  <g>
                    {/* Wine stain hit */}
                    <circle cx={c * cs + cs / 2} cy={r * cs + cs / 2} r={cs / 3}
                      fill="rgba(139,16,48,0.6)" />
                    <circle cx={c * cs + cs / 2} cy={r * cs + cs / 2} r={cs / 5}
                      fill={P.hit} opacity={0.8} />
                    <line x1={c * cs + cs * 0.3} y1={r * cs + cs * 0.3} x2={c * cs + cs * 0.7} y2={r * cs + cs * 0.7}
                      stroke="#ffd0dd" strokeWidth={1.5} strokeLinecap="round" />
                    <line x1={c * cs + cs * 0.7} y1={r * cs + cs * 0.3} x2={c * cs + cs * 0.3} y2={r * cs + cs * 0.7}
                      stroke="#ffd0dd" strokeWidth={1.5} strokeLinecap="round" />
                  </g>
                )}
              </g>
            );
          })
        )}

        {/* Ships (wine bottles) */}
        {showShips && ships.map(s => (
          <BottleSVG key={s.id} ship={s} cs={cs} hits={hitSet} />
        ))}

        {/* Hover preview bottle */}
        {!small && hover.length > 0 && cur && hoverOk && (
          <g opacity={0.45}>
            {(() => {
              const minR = Math.min(...hover.map(c => c[0]));
              const minC = Math.min(...hover.map(c => c[1]));
              const w = dir === 'H' ? cur.size * cs : cs;
              const h = dir === 'H' ? cs : cur.size * cs;
              const rr = Math.min(w - 8, h - 8) / 2;
              return <rect x={minC * cs + 4} y={minR * cs + 4} width={w - 8} height={h - 8} rx={rr}
                fill={cur.color} stroke={cur.light} strokeWidth={1.2} />;
            })()}
          </g>
        )}

        {/* Hit ripple */}
        {lastHit && (
          <circle cx={lastHit.c * cs + cs / 2} cy={lastHit.r * cs + cs / 2} r={2}
            fill="none" stroke={lastHit.hit ? P.hit : P.accentGold} strokeWidth={2} opacity={0.8}>
            <animate attributeName="r" from="2" to={`${cs}`} dur="0.6s" fill="freeze" />
            <animate attributeName="opacity" from="0.8" to="0" dur="0.6s" fill="freeze" />
          </circle>
        )}
      </svg>
    );
  };

  const allPlaced = ships.length === SHIPS.length;
  const font = 'Georgia, "Times New Roman", serif';

  // ── PLACEMENT ──────────────────────────────────────────────────────────────

  if (phase === 'PLACEMENT') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '16px 8px', background: P.bg, fontFamily: font, overflow: 'auto' }}>
        <motion.div initial={{ y: -15, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={{ textAlign: 'center', marginBottom: 12 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, fontStyle: 'italic',
            background: 'linear-gradient(135deg, #c44058, #d4a053, #922b3e)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>🍷 Léa Naval</h1>
          <p style={{ fontSize: 12, color: P.dim, marginTop: 2 }}>
            Place tes bouteilles sur la toile — elles ne doivent pas se toucher !
          </p>
        </motion.div>

        {/* Bottle queue */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10, maxWidth: 440 }}>
          {SHIPS.map((def, i) => {
            const placed = i < ships.length;
            const active = i === shipIdx;
            return (
              <div key={def.id} style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 10,
                background: placed ? 'rgba(20,10,15,0.3)' : active ? `${def.color}22` : 'rgba(20,10,15,0.2)',
                border: active ? `2px solid ${def.light}` : `1px solid ${P.canvasBorder}`,
                opacity: placed ? 0.3 : 1, transition: 'all 0.2s',
              }}>
                <div style={{
                  width: def.size * 8 + 6, height: 10, borderRadius: 5,
                  background: placed ? '#333' : `linear-gradient(90deg, ${def.color}, ${def.light})`,
                }} />
                <span style={{ fontSize: 11, fontWeight: 600, fontStyle: 'italic', color: P.text,
                  textDecoration: placed ? 'line-through' : 'none' }}>{def.name} ({def.size})</span>
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <button onClick={() => { setDir(d => d === 'H' ? 'V' : 'H'); setHover([]); }}
            style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, fontStyle: 'italic',
              background: P.canvas, border: `1px solid ${P.canvasBorder}`, color: P.text, cursor: 'pointer' }}>
            ⇄ {dir === 'H' ? 'Horizontal' : 'Vertical'}
          </button>
          <button onClick={() => { if (!ships.length) return; setShips(p => p.slice(0, -1)); setShipIdx(i => i - 1); setHover([]); }}
            disabled={!ships.length}
            style={{ padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: P.canvas, border: `1px solid ${P.canvasBorder}`, color: P.text,
              cursor: ships.length ? 'pointer' : 'not-allowed', opacity: ships.length ? 1 : 0.3 }}>
            ↩ Annuler
          </button>
        </div>

        {/* Grid canvas */}
        <div style={{ padding: 8, borderRadius: 16, background: P.canvas, border: `1px solid ${P.canvasBorder}`,
          boxShadow: '0 0 40px rgba(139,32,56,0.1), inset 0 0 60px rgba(0,0,0,0.3)' }}>
          <Grid grid={null} click={allPlaced ? null : onPlace} hov={allPlaced ? null : onHover} showShips={true} small={false} />
        </div>

        {allPlaced && (
          <motion.button initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReady}
            style={{ marginTop: 14, padding: '10px 28px', borderRadius: 12, fontSize: 16, fontWeight: 800,
              fontStyle: 'italic', background: 'linear-gradient(135deg, #922b3e, #6b1030)',
              color: '#ffe0e8', border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(146,43,62,0.4)' }}>
            🍷 Cave prête !
          </motion.button>
        )}

        {!allPlaced && cur && (
          <p style={{ marginTop: 10, fontSize: 12, color: P.dim, fontStyle: 'italic' }}>
            Place <strong style={{ color: P.text }}>{cur.name}</strong> — {cur.size} cases
          </p>
        )}
      </div>
    );
  }

  // ── WAITING ────────────────────────────────────────────────────────────────

  if (phase === 'WAITING') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: P.bg, fontFamily: font }}>
        <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}
          style={{ fontSize: 52, marginBottom: 16 }}>🍷</motion.div>
        <h2 style={{ color: P.text, fontSize: 20, fontWeight: 800, fontStyle: 'italic', marginBottom: 6 }}>Cave prête !</h2>
        <p style={{ color: P.dim, fontSize: 13 }}>En attente du sommelier adverse...</p>
        <motion.div animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 2, repeat: Infinity }}
          style={{ marginTop: 16, width: 40, height: 2, borderRadius: 1, background: P.accent }} />
      </div>
    );
  }

  // ── BATTLE ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '8px 4px', background: P.bg, fontFamily: font, overflow: 'auto' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <h1 style={{ fontSize: 20, fontWeight: 900, fontStyle: 'italic',
          background: 'linear-gradient(135deg, #c44058, #d4a053)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>🍷 Léa Naval</h1>
        <div style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
          background: P.canvas, border: `1px solid ${P.canvasBorder}`, color: P.dim }}>
          💀 {opSunk.length}/{SHIPS.length}
        </div>
      </div>

      <motion.div key={isPlayerTurn ? 'y' : 'n'} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: '4px 16px', borderRadius: 16, fontSize: 13, fontWeight: 700, fontStyle: 'italic', marginBottom: 6,
          background: over ? 'rgba(52,199,89,0.1)' : isPlayerTurn ? 'rgba(196,64,88,0.1)' : 'rgba(80,80,80,0.08)',
          color: over ? '#34C759' : isPlayerTurn ? P.accent : '#6b6b6b',
          border: `1px solid ${over ? 'rgba(52,199,89,0.2)' : isPlayerTurn ? P.canvasBorder : 'rgba(80,80,80,0.1)'}`,
        }}>
        {over ? (win === playerId ? '🏆 Victoire !' : '💔 Défaite...') : isPlayerTurn ? '🎯 À toi !' : '⏳ Adversaire...'}
      </motion.div>

      <AnimatePresence>
        {sunkMsg && (
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
            style={{ padding: '6px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, fontStyle: 'italic', marginBottom: 4,
              background: 'rgba(139,16,48,0.15)', border: '1px solid rgba(139,16,48,0.3)', color: '#ff6680' }}>
            {sunkMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enemy grid */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,100,100,0.4)',
          marginBottom: 2, textTransform: 'uppercase', fontStyle: 'italic' }}>Cave Ennemie</div>
        <div style={{ padding: 4, borderRadius: 14, background: P.canvas, border: `1px solid ${P.canvasBorder}` }}>
          <Grid grid={opGrid} click={over ? null : isPlayerTurn ? onFire : null} hov={null} showShips={false} small={false} />
        </div>
      </div>

      {/* Fleet status */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 6, maxWidth: 380 }}>
        {SHIPS.map(def => {
          const sunk = opSunk.includes(def.name);
          return (
            <span key={def.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '1px 6px', borderRadius: 5,
              fontSize: 10, fontWeight: 600, fontStyle: 'italic',
              background: sunk ? 'rgba(20,10,15,0.3)' : `${def.color}22`,
              color: sunk ? '#4b3040' : P.text, textDecoration: sunk ? 'line-through' : 'none' }}>
              <div style={{ width: def.size * 5, height: 4, borderRadius: 2,
                background: sunk ? '#2a1520' : `linear-gradient(90deg, ${def.color}, ${def.light})` }} />
              {def.name}
            </span>
          );
        })}
      </div>

      {/* My grid */}
      <div>
        <div style={{ textAlign: 'center', fontSize: 10, fontWeight: 700, letterSpacing: 2, color: P.dim,
          marginBottom: 2, textTransform: 'uppercase', fontStyle: 'italic' }}>Ma Cave</div>
        <div style={{ padding: 4, borderRadius: 14, background: P.canvas, border: `1px solid ${P.canvasBorder}` }}>
          <Grid grid={myGrid} click={null} hov={null} showShips={true} small={true} />
        </div>
      </div>
    </div>
  );
}
