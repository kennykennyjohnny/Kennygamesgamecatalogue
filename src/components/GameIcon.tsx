// GAME ICONS — adapted to real themes

export const GameIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'sandy':
      // SandyPong — Beer pong cups + ball
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="sandyCup" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            <radialGradient id="sandyBall">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="80%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#d1d5db" />
            </radialGradient>
          </defs>
          {/* Table surface hint */}
          <rect x="10" y="60" width="80" height="35" rx="4" fill="#5c3a1e" opacity="0.4" />
          {/* 3 cups triangle */}
          <path d="M30,50 L25,78 L35,78 Z" fill="url(#sandyCup)" />
          <ellipse cx="30" cy="50" rx="6" ry="2" fill="#fca5a5" />
          <ellipse cx="30" cy="58" rx="4.5" ry="1.5" fill="#fbbf24" opacity="0.5" />
          <path d="M50,45 L45,73 L55,73 Z" fill="url(#sandyCup)" />
          <ellipse cx="50" cy="45" rx="6" ry="2" fill="#fca5a5" />
          <ellipse cx="50" cy="53" rx="4.5" ry="1.5" fill="#fbbf24" opacity="0.5" />
          <path d="M70,50 L65,78 L75,78 Z" fill="url(#sandyCup)" />
          <ellipse cx="70" cy="50" rx="6" ry="2" fill="#fca5a5" />
          <ellipse cx="70" cy="58" rx="4.5" ry="1.5" fill="#fbbf24" opacity="0.5" />
          {/* Ball in arc */}
          <circle cx="40" cy="25" r="8" fill="url(#sandyBall)" />
          <ellipse cx="36" cy="22" rx="3" ry="3" fill="white" opacity="0.8" />
          {/* Arc trail */}
          <path d="M20,40 Q30,12 50,20" stroke="#f59e0b" strokeWidth="1.5" fill="none" strokeDasharray="3 2" opacity="0.5" />
        </svg>
      );

    case 'lea':
      // LéaNaval — Warship/battleship on ocean
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="leaOcean" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a5f" />
              <stop offset="100%" stopColor="#0d2137" />
            </linearGradient>
            <linearGradient id="leaShip" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6b7280" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
          </defs>
          {/* Ocean */}
          <rect width="100" height="100" fill="url(#leaOcean)" rx="8" />
          {/* Waves */}
          <path d="M0,60 Q12,56 24,60 T48,60 T72,60 T96,60 L100,60" stroke="#3478F6" strokeWidth="2" fill="none" opacity="0.5" />
          <path d="M0,68 Q15,64 30,68 T60,68 T90,68" stroke="#60a5fa" strokeWidth="1.5" fill="none" opacity="0.3" />
          {/* Ship hull */}
          <path d="M18,52 L82,52 L76,62 L24,62 Z" fill="url(#leaShip)" />
          <path d="M18,52 L82,52 L76,62 L24,62 Z" stroke="#4b5563" strokeWidth="1.5" fill="none" />
          {/* Deck */}
          <rect x="28" y="44" width="44" height="8" rx="2" fill="#4b5563" />
          {/* Bridge */}
          <rect x="42" y="32" width="16" height="12" rx="2" fill="#6b7280" />
          <rect x="45" y="34" width="4" height="3" rx="1" fill="#93c5fd" opacity="0.6" />
          <rect x="51" y="34" width="4" height="3" rx="1" fill="#93c5fd" opacity="0.6" />
          {/* Mast */}
          <line x1="50" y1="18" x2="50" y2="32" stroke="#9ca3af" strokeWidth="2" />
          <line x1="44" y1="22" x2="56" y2="22" stroke="#9ca3af" strokeWidth="1" />
          {/* Turrets */}
          <circle cx="34" cy="48" r="4" fill="#374151" stroke="#6b7280" strokeWidth="1" />
          <line x1="34" y1="48" x2="26" y2="44" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="66" cy="48" r="4" fill="#374151" stroke="#6b7280" strokeWidth="1" />
          <line x1="66" y1="48" x2="74" y2="44" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" />
          {/* Grid overlay (battleship reference) */}
          <g stroke="#3478F6" strokeWidth="0.5" opacity="0.15">
            <line x1="0" y1="20" x2="100" y2="20" />
            <line x1="0" y1="40" x2="100" y2="40" />
            <line x1="0" y1="80" x2="100" y2="80" />
            <line x1="20" y1="0" x2="20" y2="100" />
            <line x1="40" y1="0" x2="40" y2="100" />
            <line x1="60" y1="0" x2="60" y2="100" />
            <line x1="80" y1="0" x2="80" y2="100" />
          </g>
          {/* Target crosshair */}
          <circle cx="30" cy="80" r="6" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.6" />
          <line x1="30" y1="74" x2="30" y2="86" stroke="#ef4444" strokeWidth="1" opacity="0.4" />
          <line x1="24" y1="80" x2="36" y2="80" stroke="#ef4444" strokeWidth="1" opacity="0.4" />
        </svg>
      );

    case 'liliano':
      // LilianoThunder — Tank with lightning (already good, keep)
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="lilianoBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a21caf" />
              <stop offset="50%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
            <linearGradient id="lilianoShine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="lightningGlow">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="50" cy="75" rx="30" ry="3" fill="black" opacity="0.25" />
          <rect x="25" y="62" width="50" height="10" rx="5" fill="#6b21a8" />
          <rect x="25" y="63" width="50" height="4" rx="2" fill="#7e22ce" />
          <circle cx="32" cy="67" r="5" fill="#581c87" />
          <circle cx="32" cy="67" r="3.5" fill="#4c1d95" />
          <circle cx="44" cy="67" r="5" fill="#581c87" />
          <circle cx="44" cy="67" r="3.5" fill="#4c1d95" />
          <circle cx="56" cy="67" r="5" fill="#581c87" />
          <circle cx="56" cy="67" r="3.5" fill="#4c1d95" />
          <circle cx="68" cy="67" r="5" fill="#581c87" />
          <circle cx="68" cy="67" r="3.5" fill="#4c1d95" />
          <rect x="28" y="45" width="44" height="20" rx="6" fill="url(#lilianoBody)" />
          <rect x="28" y="45" width="44" height="20" rx="6" stroke="#a21caf" strokeWidth="2.5" fill="none" />
          <rect x="30" y="47" width="8" height="16" rx="3" fill="url(#lilianoShine)" opacity="0.6" />
          <ellipse cx="50" cy="45" rx="17" ry="13" fill="#d946ef" />
          <ellipse cx="50" cy="45" rx="17" ry="13" stroke="#a21caf" strokeWidth="2.5" fill="none" />
          <ellipse cx="42" cy="40" rx="7" ry="5" fill="url(#lilianoShine)" opacity="0.5" />
          <rect x="63" y="42" width="20" height="6" rx="2" fill="#c026d3" />
          <rect x="63" y="42" width="20" height="6" rx="2" stroke="#a21caf" strokeWidth="2" fill="none" />
          <circle cx="88" cy="32" r="10" fill="url(#lightningGlow)" />
          <circle cx="90" cy="50" r="8" fill="url(#lightningGlow)" />
          <path d="M 83 20 L 89 28 L 85 30 L 92 40" stroke="#fbbf24" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M 83 20 L 89 28 L 85 30 L 92 40" stroke="#fef3c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M 85 42 L 89 48 L 87 49 L 91 56" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M 85 42 L 89 48 L 87 49 L 91 56" stroke="#fef3c7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case 'nour':
      // NourArchery — Nature/forest archery target
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <radialGradient id="nourGlow">
              <stop offset="0%" stopColor="#4ade80" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="nourArrow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#854d0e" />
              <stop offset="100%" stopColor="#a16207" />
            </linearGradient>
          </defs>
          {/* Forest bg hint */}
          <rect width="100" height="100" fill="#0f1b12" rx="8" />
          {/* Trees in background */}
          <polygon points="12,65 18,35 24,65" fill="#166534" opacity="0.3" />
          <polygon points="75,60 82,28 89,60" fill="#166534" opacity="0.25" />
          <polygon points="85,65 90,40 95,65" fill="#14532d" opacity="0.2" />
          {/* Target stand */}
          <rect x="47" y="65" width="6" height="20" fill="#854d0e" opacity="0.6" />
          <rect x="40" y="82" width="20" height="4" rx="2" fill="#713f12" opacity="0.5" />
          {/* Target */}
          <circle cx="50" cy="44" r="28" fill="url(#nourGlow)" />
          <circle cx="50" cy="44" r="26" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
          <circle cx="50" cy="44" r="20" fill="#3b82f6" stroke="#2563eb" strokeWidth="0.5" />
          <circle cx="50" cy="44" r="14" fill="#ef4444" stroke="#dc2626" strokeWidth="0.5" />
          <circle cx="50" cy="44" r="8" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.5" />
          <circle cx="50" cy="44" r="4" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" />
          <circle cx="50" cy="44" r="1.5" fill="#fef3c7" />
          {/* Arrow embedded */}
          <line x1="18" y1="68" x2="48" y2="44" stroke="url(#nourArrow)" strokeWidth="3" strokeLinecap="round" />
          <polygon points="48,44 52,40 50,43 54,46" fill="#4ade80" />
          {/* Fletching */}
          <path d="M18,68 L14,64 L20,66" fill="#4ade80" opacity="0.7" />
          <path d="M18,68 L14,72 L20,70" fill="#22c55e" opacity="0.6" />
          {/* Grass */}
          <path d="M0,90 Q10,85 20,90 T40,90 T60,90 T80,90 T100,90 L100,100 L0,100 Z" fill="#166534" opacity="0.4" />
        </svg>
      );

    default:
      return null;
  }
};
