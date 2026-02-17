// GAME ICONS — adapted to real character themes

export const GameIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'sandy':
      // SandyPong — Rosé wine glasses + ping pong ball
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="sandyRosé" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4b0c3" />
              <stop offset="100%" stopColor="#e8879f" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="#1a0f14" rx="8" />
          {/* Glass 1 */}
          <path d="M28,35 Q24,55 32,62 L32,75 L24,78 L40,78 L32,75 L32,62 Q40,55 36,35 Z"
            fill="rgba(232,135,159,0.2)" stroke="#f4b0c3" strokeWidth="1" />
          <path d="M29,40 Q26,52 32,58 L32,58 Q38,52 35,40 Z" fill="url(#sandyRosé)" opacity="0.4" />
          {/* Glass 2 */}
          <path d="M48,30 Q44,50 52,57 L52,72 L44,75 L60,75 L52,72 L52,57 Q60,50 56,30 Z"
            fill="rgba(232,135,159,0.2)" stroke="#f4b0c3" strokeWidth="1" />
          <path d="M49,35 Q46,47 52,53 L52,53 Q58,47 55,35 Z" fill="url(#sandyRosé)" opacity="0.4" />
          {/* Glass 3 */}
          <path d="M68,35 Q64,55 72,62 L72,75 L64,78 L80,78 L72,75 L72,62 Q80,55 76,35 Z"
            fill="rgba(232,135,159,0.2)" stroke="#f4b0c3" strokeWidth="1" />
          <path d="M69,40 Q66,52 72,58 L72,58 Q78,52 75,40 Z" fill="url(#sandyRosé)" opacity="0.4" />
          {/* Ball */}
          <circle cx="38" cy="20" r="7" fill="white" />
          <circle cx="35" cy="17" r="2.5" fill="white" opacity="0.8" />
          <path d="M22,30 Q30,10 50,18" stroke="#e8879f" strokeWidth="1" fill="none" strokeDasharray="3 2" opacity="0.4" />
        </svg>
      );

    case 'lea':
      // LéaNaval — Wine bottle on canvas
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="leaWine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9b1b48" />
              <stop offset="100%" stopColor="#6b1030" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="#1a0a12" rx="8" />
          {/* Canvas frame */}
          <rect x="8" y="8" width="84" height="84" rx="3" fill="none" stroke="#d4a053" strokeWidth="2" opacity="0.3" />
          {/* Grid (battleship) */}
          <g stroke="rgba(139,32,56,0.12)" strokeWidth="0.5">
            {[20,35,50,65,80].map(v => <line key={`h${v}`} x1="12" y1={v} x2="88" y2={v} />)}
            {[20,35,50,65,80].map(v => <line key={`v${v}`} x1={v} y1="12" x2={v} y2="88" />)}
          </g>
          {/* Wine bottle */}
          <rect x="42" y="25" width="16" height="40" rx="8" fill="url(#leaWine)" />
          <rect x="42" y="25" width="16" height="40" rx="8" stroke="#9b1b48" strokeWidth="1" fill="none" />
          <rect x="46" y="18" width="8" height="10" rx="3" fill="#9b1b48" opacity="0.7" />
          <rect x="47" y="14" width="6" height="6" rx="2" fill="#b8860b" />
          <rect x="45" y="35" width="10" height="14" rx="1" fill="rgba(255,235,200,0.15)" />
          {/* Glass shine */}
          <rect x="44" y="28" width="5" height="20" rx="2" fill="rgba(255,255,255,0.1)" />
          {/* Hit marker */}
          <circle cx="30" cy="72" r="5" fill="rgba(139,16,48,0.4)" />
          <line x1="27" y1="69" x2="33" y2="75" stroke="#ffd0dd" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="33" y1="69" x2="27" y2="75" stroke="#ffd0dd" strokeWidth="1.5" strokeLinecap="round" />
          {/* Miss splatter */}
          <circle cx="72" cy="38" r="3" fill="rgba(212,160,83,0.3)" />
          <circle cx="74" cy="36" r="1.5" fill="rgba(212,160,83,0.2)" />
        </svg>
      );

    case 'liliano':
      // LilianoThunder — Neon punk tank
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="lilianoBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a21caf" />
              <stop offset="50%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
            <radialGradient id="lightningGlow">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100" height="100" fill="#0a0008" rx="8" />
          {/* Terrain */}
          <path d="M0,75 Q25,65 50,72 T100,70 L100,100 L0,100 Z" fill="#1a1a1a" stroke="#ff00ff" strokeWidth="0.5" opacity="0.6" />
          {/* Tank body */}
          <rect x="25" y="57" width="40" height="12" rx="4" fill="url(#lilianoBody)" />
          <rect x="24" y="67" width="42" height="5" rx="2" fill="#333" stroke="#ff00ff" strokeWidth="0.3" />
          {/* Turret */}
          <ellipse cx="45" cy="57" rx="12" ry="8" fill="#d946ef" />
          <rect x="55" y="53" width="18" height="5" rx="2" fill="#c026d3" stroke="#a21caf" strokeWidth="1" />
          {/* Lightning */}
          <circle cx="85" cy="35" r="10" fill="url(#lightningGlow)" />
          <path d="M80,22 L86,30 L82,32 L89,42" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <path d="M80,22 L86,30 L82,32 L89,42" stroke="#fef3c7" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Neon stars */}
          <circle cx="15" cy="15" r="1" fill="#ff00ff" opacity="0.6" />
          <circle cx="75" cy="12" r="0.8" fill="#00ffff" opacity="0.5" />
          <circle cx="30" cy="25" r="0.6" fill="#ffff00" opacity="0.4" />
        </svg>
      );

    case 'nour':
      // NourArchery — Matrix/Neo digital target
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <rect width="100" height="100" fill="#0a0a0a" rx="8" />
          {/* Matrix code rain */}
          {[15,30,45,60,75,88].map((x, i) => (
            <text key={i} x={x} y={20 + i * 8} fill="#00ff41" fontSize="6" fontFamily="monospace" opacity={0.2 + i * 0.05}>
              {'アウキ012'[i]}
            </text>
          ))}
          {/* Grid */}
          <g stroke="rgba(0,255,65,0.06)" strokeWidth="0.3">
            {[20,40,60,80].map(v => <line key={`h${v}`} x1="0" y1={v} x2="100" y2={v} />)}
            {[20,40,60,80].map(v => <line key={`v${v}`} x1={v} y1="0" x2={v} y2="100" />)}
          </g>
          {/* Digital target */}
          <circle cx="50" cy="48" r="28" fill="none" stroke="rgba(0,255,65,0.15)" strokeWidth="0.5" strokeDasharray="2,2" />
          <circle cx="50" cy="48" r="20" fill="none" stroke="rgba(0,229,255,0.2)" strokeWidth="0.5" />
          <circle cx="50" cy="48" r="12" fill="none" stroke="rgba(0,229,255,0.3)" strokeWidth="0.5" />
          <circle cx="50" cy="48" r="5" fill="rgba(255,0,100,0.15)" stroke="#ff0064" strokeWidth="0.5" />
          <circle cx="50" cy="48" r="1.5" fill="#ff0044" />
          {/* Crosshairs */}
          <line x1="22" y1="48" x2="78" y2="48" stroke="rgba(0,255,65,0.15)" strokeWidth="0.3" />
          <line x1="50" y1="20" x2="50" y2="76" stroke="rgba(0,255,65,0.15)" strokeWidth="0.3" />
          {/* Corner brackets */}
          <path d="M22,22 L22,28 M22,22 L28,22" stroke="#00ff41" strokeWidth="0.8" />
          <path d="M78,22 L78,28 M78,22 L72,22" stroke="#00ff41" strokeWidth="0.8" />
          <path d="M22,74 L22,68 M22,74 L28,74" stroke="#00ff41" strokeWidth="0.8" />
          <path d="M78,74 L78,68 M78,74 L72,74" stroke="#00ff41" strokeWidth="0.8" />
          {/* Arrow = data beam */}
          <line x1="18" y1="78" x2="48" y2="49" stroke="#00e5ff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="48" cy="49" r="2" fill="#00e5ff" opacity="0.6" />
        </svg>
      );

    default:
      return null;
  }
};
