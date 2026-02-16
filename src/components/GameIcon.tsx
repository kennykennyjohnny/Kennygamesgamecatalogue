// REALISTIC, BEAUTIFUL & MODERN GAME ICONS

export const GameIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'sandy':
      // SandyPong - Verre à vin rosé ULTRA RÉALISTE
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            {/* Glass gradient - more transparent */}
            <radialGradient id="sandyGlassFill">
              <stop offset="0%" stopColor="#fda4af" stopOpacity="0.08" />
              <stop offset="70%" stopColor="#fda4af" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#fb7185" stopOpacity="0.25" />
            </radialGradient>
            
            {/* Wine liquid - rich gradient */}
            <linearGradient id="sandyWine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fda4af" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#fb7185" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.9" />
            </linearGradient>
            
            {/* Main shine */}
            <linearGradient id="sandyShine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.7" />
              <stop offset="50%" stopColor="white" stopOpacity="0.3" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            
            {/* Ball 3D effect */}
            <radialGradient id="ballGrad">
              <stop offset="0%" stopColor="white" />
              <stop offset="40%" stopColor="#f9fafb" />
              <stop offset="100%" stopColor="#d1d5db" />
            </radialGradient>
          </defs>
          
          {/* Shadow */}
          <ellipse 
            cx="50" 
            cy="93" 
            rx="17" 
            ry="2.5" 
            fill="black" 
            opacity="0.2"
          />
          
          {/* Glass base - elegant */}
          <ellipse 
            cx="50" 
            cy="89" 
            rx="16" 
            ry="4.5" 
            fill="#fb7185"
            opacity="0.25"
          />
          <ellipse 
            cx="50" 
            cy="88.5" 
            rx="16" 
            ry="3" 
            fill="white"
            opacity="0.3"
          />
          <ellipse 
            cx="50" 
            cy="88.5" 
            rx="13" 
            ry="2" 
            fill="white"
            opacity="0.5"
          />
          
          {/* Stem - refined */}
          <path
            d="M 49 71 Q 48 80 47 88 L 53 88 Q 52 80 51 71 Z"
            fill="#fda4af"
            opacity="0.3"
          />
          <line x1="49.5" y1="71" x2="47.5" y2="88" stroke="#fb7185" strokeWidth="1.5" opacity="0.4" />
          <line x1="50.5" y1="71" x2="52.5" y2="88" stroke="#fb7185" strokeWidth="1" opacity="0.3" />
          
          {/* Glass bowl outline - beautiful curve */}
          <path
            d="M 26 30 Q 23 38 23 48 Q 23 61 34 68 L 39 71 L 61 71 L 66 68 Q 77 61 77 48 Q 77 38 74 30"
            fill="url(#sandyGlassFill)"
            stroke="#fb7185"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />
          
          {/* Glass rim - top ellipse */}
          <ellipse 
            cx="50" 
            cy="30" 
            rx="24" 
            ry="4" 
            fill="none"
            stroke="#fb7185"
            strokeWidth="2.5"
            opacity="0.85"
          />
          
          {/* Glass rim inner shine */}
          <ellipse 
            cx="50" 
            cy="30" 
            rx="22" 
            ry="3" 
            fill="white"
            opacity="0.35"
          />
          
          {/* Wine liquid - surface */}
          <ellipse 
            cx="50" 
            cy="54" 
            rx="25" 
            ry="4" 
            fill="#fda4af"
            opacity="0.5"
          />
          
          {/* Wine volume - filled area */}
          <path
            d="M 25 54 Q 25 62 34 68 L 39 71 L 61 71 L 66 68 Q 75 62 75 54 Z"
            fill="url(#sandyWine)"
          />
          
          {/* Wine surface reflection */}
          <ellipse 
            cx="50" 
            cy="54" 
            rx="20" 
            ry="2.5" 
            fill="white"
            opacity="0.25"
          />
          
          {/* Wine highlight on edge */}
          <ellipse 
            cx="72" 
            cy="60" 
            rx="3" 
            ry="8" 
            fill="white"
            opacity="0.15"
          />
          
          {/* Main glass shine - large */}
          <ellipse 
            cx="33" 
            cy="42" 
            rx="9" 
            ry="24" 
            fill="url(#sandyShine)"
            opacity="0.7"
          />
          
          {/* Secondary shine */}
          <ellipse 
            cx="69" 
            cy="38" 
            rx="5" 
            ry="16" 
            fill="white"
            opacity="0.25"
          />
          
          {/* Small accent shine */}
          <ellipse 
            cx="40" 
            cy="62" 
            rx="3" 
            ry="6" 
            fill="white"
            opacity="0.2"
          />
          
          {/* Ping pong ball - 3D sphere */}
          <circle 
            cx="50" 
            cy="58" 
            r="11.5" 
            fill="url(#ballGrad)"
          />
          
          {/* Ball shadow on wine */}
          <ellipse 
            cx="52" 
            cy="63" 
            rx="9" 
            ry="6" 
            fill="#fb7185"
            opacity="0.2"
          />
          
          {/* Ball main highlight */}
          <ellipse 
            cx="44" 
            cy="53" 
            rx="5" 
            ry="5" 
            fill="white"
            opacity="0.95"
          />
          
          {/* Ball secondary highlight */}
          <circle 
            cx="46" 
            cy="55" 
            r="2.5" 
            fill="white"
            opacity="0.75"
          />
          
          {/* Ball subtle rim light */}
          <path
            d="M 39 58 Q 39 52 44 48"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
            opacity="0.4"
            strokeLinecap="round"
          />
        </svg>
      );
      
    case 'lea':
      // LéaNaval - Bouteille de vin ULTRA RÉALISTE qui flotte
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            {/* Bottle glass - deep red gradient */}
            <linearGradient id="leaBottle" x1="30%" y1="0%" x2="70%" y2="0%">
              <stop offset="0%" stopColor="#450a0a" stopOpacity="0.98" />
              <stop offset="30%" stopColor="#7f1d1d" stopOpacity="0.85" />
              <stop offset="70%" stopColor="#991b1b" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#450a0a" stopOpacity="0.98" />
            </linearGradient>
            
            {/* Bottle highlight */}
            <linearGradient id="leaHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="40%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            
            {/* Elegant label */}
            <linearGradient id="leaLabel" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="50%" stopColor="#fef3c7" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
            
            {/* Water gradient */}
            <linearGradient id="leaWater" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#2563eb" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          
          {/* Water with depth */}
          <path
            d="M 0 66 Q 15 63 30 66 T 60 66 T 90 66 T 100 66 L 100 100 L 0 100 Z"
            fill="url(#leaWater)"
          />
          
          {/* Wave 1 */}
          <path
            d="M 0 68 Q 12 65 24 68 T 48 68 T 72 68 T 96 68"
            stroke="#60a5fa"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            opacity="0.7"
          />
          
          {/* Wave 2 */}
          <path
            d="M 0 74 Q 18 71 36 74 T 72 74 T 100 74"
            stroke="#3b82f6"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
            opacity="0.5"
          />
          
          {/* Bottle reflection in water */}
          <ellipse 
            cx="50" 
            cy="70" 
            rx="13" 
            ry="2.5" 
            fill="black"
            opacity="0.25"
          />
          
          {/* Bottle body - elegant Bordeaux shape */}
          <path
            d="M 39 44 L 37 66 Q 37 70 39 72 Q 42 74 50 74 Q 58 74 61 72 Q 63 70 63 66 L 61 44 Q 61 42 59 41 L 50 40 L 41 41 Q 39 42 39 44 Z"
            fill="url(#leaBottle)"
          />
          
          {/* Bottle outline - edges */}
          <path
            d="M 39 44 L 37 66 Q 37 70 39 72 Q 42 74 50 74 Q 58 74 61 72 Q 63 70 63 66 L 61 44"
            stroke="#450a0a"
            strokeWidth="2"
            fill="none"
            opacity="0.9"
          />
          
          {/* Bottle shoulders - realistic curve */}
          <path
            d="M 41 41 Q 41 36 45 33 L 55 33 Q 59 36 59 41"
            fill="#7f1d1d"
            opacity="0.95"
          />
          <path
            d="M 41 41 Q 41 36 45 33 L 55 33 Q 59 36 59 41"
            stroke="#450a0a"
            strokeWidth="1"
            fill="none"
            opacity="0.6"
          />
          
          {/* Bottle neck - elegant taper */}
          <rect 
            x="46" 
            y="18" 
            width="8" 
            height="15" 
            rx="1" 
            fill="#991b1b"
            opacity="0.95"
          />
          <rect 
            x="46" 
            y="18" 
            width="8" 
            height="15" 
            rx="1" 
            stroke="#450a0a"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />
          
          {/* Cork - natural texture */}
          <ellipse 
            cx="50" 
            cy="18" 
            rx="5" 
            ry="2" 
            fill="#92400e"
          />
          <rect 
            x="45" 
            y="13" 
            width="10" 
            height="5" 
            rx="1" 
            fill="#78350f"
          />
          <ellipse 
            cx="50" 
            cy="13" 
            rx="5" 
            ry="1.5" 
            fill="#92400e"
          />
          
          {/* Cork texture lines */}
          <g opacity="0.6">
            <line x1="47" y1="14" x2="47" y2="17" stroke="#451a03" strokeWidth="0.5" />
            <line x1="50" y1="14" x2="50" y2="17" stroke="#451a03" strokeWidth="0.5" />
            <line x1="53" y1="14" x2="53" y2="17" stroke="#451a03" strokeWidth="0.5" />
          </g>
          
          {/* Elegant label */}
          <rect 
            x="41" 
            y="48" 
            width="18" 
            height="16" 
            rx="2" 
            fill="url(#leaLabel)"
          />
          
          {/* Label ornate border */}
          <rect 
            x="41" 
            y="48" 
            width="18" 
            height="16" 
            rx="2" 
            stroke="#d97706"
            strokeWidth="0.8"
            fill="none"
          />
          <rect 
            x="42" 
            y="49" 
            width="16" 
            height="14" 
            rx="1.5" 
            stroke="#ca8a04"
            strokeWidth="0.5"
            fill="none"
            opacity="0.7"
          />
          
          {/* Label text - elegant script simulation */}
          <rect x="43" y="52" width="14" height="2" rx="0.5" fill="#991b1b" opacity="0.8" />
          <rect x="43" y="56" width="10" height="1.5" rx="0.5" fill="#7f1d1d" opacity="0.6" />
          <rect x="43" y="59" width="12" height="1.5" rx="0.5" fill="#7f1d1d" opacity="0.6" />
          
          {/* Main bottle shine - realistic light reflection */}
          <ellipse 
            cx="43" 
            cy="48" 
            rx="5" 
            ry="22" 
            fill="url(#leaHighlight)"
            opacity="0.7"
          />
          
          {/* Secondary shine on body */}
          <ellipse 
            cx="57" 
            cy="56" 
            rx="2.5" 
            ry="12" 
            fill="white"
            opacity="0.2"
          />
          
          {/* Neck shine */}
          <rect 
            x="47" 
            y="20" 
            width="2" 
            height="11" 
            rx="1" 
            fill="white"
            opacity="0.35"
          />
          
          {/* Small accent highlights */}
          <ellipse 
            cx="45" 
            cy="38" 
            rx="2" 
            ry="4" 
            fill="white"
            opacity="0.3"
          />
          
          {/* Bottom rim highlight */}
          <ellipse 
            cx="50" 
            cy="72" 
            rx="10" 
            ry="2" 
            fill="white"
            opacity="0.15"
          />
        </svg>
      );
      
    case 'liliano':
      // LilianoThunder - Tank simple avec éclair
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            {/* Tank body gradient */}
            <linearGradient id="lilianoBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a21caf" />
              <stop offset="50%" stopColor="#c026d3" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
            
            {/* Metal shine */}
            <linearGradient id="lilianoShine" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
            
            {/* Lightning glow */}
            <radialGradient id="lightningGlow">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Tank shadow */}
          <ellipse 
            cx="50" 
            cy="75" 
            rx="30" 
            ry="3" 
            fill="black"
            opacity="0.25"
          />
          
          {/* Tank track */}
          <rect 
            x="25" 
            y="62" 
            width="50" 
            height="10" 
            rx="5" 
            fill="#6b21a8"
          />
          
          {/* Track shine */}
          <rect 
            x="25" 
            y="63" 
            width="50" 
            height="4" 
            rx="2" 
            fill="#7e22ce"
          />
          
          {/* Tank wheels */}
          <circle cx="32" cy="67" r="5" fill="#581c87" />
          <circle cx="32" cy="67" r="3.5" fill="#4c1d95" />
          <circle cx="44" cy="67" r="5" fill="#581c87" />
          <circle cx="44" cy="67" r="3.5" fill="#4c1d95" />
          <circle cx="56" cy="67" r="5" fill="#581c87" />
          <circle cx="56" cy="67" r="3.5" fill="#4c1d95" />
          <circle cx="68" cy="67" r="5" fill="#581c87" />
          <circle cx="68" cy="67" r="3.5" fill="#4c1d95" />
          
          {/* Tank body */}
          <rect 
            x="28" 
            y="45" 
            width="44" 
            height="20" 
            rx="6" 
            fill="url(#lilianoBody)"
          />
          
          {/* Body outline */}
          <rect 
            x="28" 
            y="45" 
            width="44" 
            height="20" 
            rx="6" 
            stroke="#a21caf"
            strokeWidth="2.5"
            fill="none"
          />
          
          {/* Body panel lines */}
          <line x1="38" y1="47" x2="38" y2="63" stroke="#9333ea" strokeWidth="1.5" opacity="0.4" />
          <line x1="50" y1="47" x2="50" y2="63" stroke="#9333ea" strokeWidth="1.5" opacity="0.4" />
          <line x1="62" y1="47" x2="62" y2="63" stroke="#9333ea" strokeWidth="1.5" opacity="0.4" />
          
          {/* Body shine */}
          <rect 
            x="30" 
            y="47" 
            width="8" 
            height="16" 
            rx="3" 
            fill="url(#lilianoShine)"
            opacity="0.6"
          />
          
          {/* Tank turret */}
          <ellipse 
            cx="50" 
            cy="45" 
            rx="17" 
            ry="13" 
            fill="#d946ef"
          />
          <ellipse 
            cx="50" 
            cy="45" 
            rx="17" 
            ry="13" 
            stroke="#a21caf"
            strokeWidth="2.5"
            fill="none"
          />
          
          {/* Turret shine */}
          <ellipse 
            cx="42" 
            cy="40" 
            rx="7" 
            ry="5" 
            fill="url(#lilianoShine)"
            opacity="0.5"
          />
          
          {/* Cannon barrel */}
          <rect 
            x="63" 
            y="42" 
            width="20" 
            height="6" 
            rx="2" 
            fill="#c026d3"
          />
          <rect 
            x="63" 
            y="42" 
            width="20" 
            height="6" 
            rx="2" 
            stroke="#a21caf"
            strokeWidth="2"
            fill="none"
          />
          
          {/* Cannon details */}
          <line x1="68" y1="43" x2="68" y2="47" stroke="#9333ea" strokeWidth="1" opacity="0.5" />
          <line x1="74" y1="43" x2="74" y2="47" stroke="#9333ea" strokeWidth="1" opacity="0.5" />
          <line x1="80" y1="43" x2="80" y2="47" stroke="#9333ea" strokeWidth="1" opacity="0.5" />
          
          {/* Lightning bolt glow - bigger */}
          <circle cx="88" cy="32" r="10" fill="url(#lightningGlow)" />
          <circle cx="90" cy="50" r="8" fill="url(#lightningGlow)" />
          
          {/* Lightning bolt 1 - main */}
          <path
            d="M 83 20 L 89 28 L 85 30 L 92 40"
            stroke="#fbbf24"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Lightning inner glow 1 */}
          <path
            d="M 83 20 L 89 28 L 85 30 L 92 40"
            stroke="#fef3c7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Lightning bolt 2 - secondary */}
          <path
            d="M 85 42 L 89 48 L 87 49 L 91 56"
            stroke="#fbbf24"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Lightning inner glow 2 */}
          <path
            d="M 85 42 L 89 48 L 87 49 L 91 56"
            stroke="#fef3c7"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      );
      
    case 'nour':
      // NourArchery - Cible Matrix futuriste STYLÉE
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            {/* Matrix glow */}
            <radialGradient id="nourGlow">
              <stop offset="0%" stopColor="#00ff41" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
            </radialGradient>
            
            {/* Arrow gradient */}
            <linearGradient id="nourArrow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00ff41" />
              <stop offset="100%" stopColor="#00d9ff" />
            </linearGradient>
            
            {/* Scan line */}
            <linearGradient id="scanLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00ff41" stopOpacity="0" />
              <stop offset="50%" stopColor="#00ff41" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#00ff41" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Digital grid background */}
          <g stroke="#00ff41" strokeWidth="0.5" opacity="0.15">
            <line x1="0" y1="20" x2="100" y2="20" />
            <line x1="0" y1="40" x2="100" y2="40" />
            <line x1="0" y1="60" x2="100" y2="60" />
            <line x1="0" y1="80" x2="100" y2="80" />
            <line x1="20" y1="0" x2="20" y2="100" />
            <line x1="40" y1="0" x2="40" y2="100" />
            <line x1="60" y1="0" x2="60" y2="100" />
            <line x1="80" y1="0" x2="80" y2="100" />
          </g>
          
          {/* Tech frame corners */}
          <g stroke="#00d9ff" strokeWidth="3" strokeLinecap="square">
            <path d="M 10 22 L 10 10 L 22 10" opacity="0.8" />
            <line x1="10" y1="10" x2="12" y2="10" strokeWidth="2" opacity="0.5" />
            
            <path d="M 78 10 L 90 10 L 90 22" opacity="0.8" />
            <line x1="90" y1="10" x2="88" y2="10" strokeWidth="2" opacity="0.5" />
            
            <path d="M 90 78 L 90 90 L 78 90" opacity="0.8" />
            <line x1="90" y1="90" x2="88" y2="90" strokeWidth="2" opacity="0.5" />
            
            <path d="M 22 90 L 10 90 L 10 78" opacity="0.8" />
            <line x1="10" y1="90" x2="12" y2="90" strokeWidth="2" opacity="0.5" />
          </g>
          
          {/* Target center glow */}
          <circle 
            cx="50" 
            cy="40" 
            r="30" 
            fill="url(#nourGlow)"
          />
          
          {/* Outer hexagon */}
          <polygon
            points="50,18 70,28 70,52 50,62 30,52 30,28"
            fill="none"
            stroke="#00ff41"
            strokeWidth="2"
            opacity="0.3"
            strokeDasharray="6 3"
          />
          
          {/* Target rings */}
          <circle 
            cx="50" 
            cy="40" 
            r="26" 
            fill="none" 
            stroke="#00ff41" 
            strokeWidth="1.5" 
            strokeDasharray="8 4"
            opacity="0.3"
          />
          
          <circle 
            cx="50" 
            cy="40" 
            r="20" 
            fill="none" 
            stroke="#00d9ff" 
            strokeWidth="2"
            opacity="0.5"
          />
          
          <circle 
            cx="50" 
            cy="40" 
            r="14" 
            fill="none" 
            stroke="#00ff41" 
            strokeWidth="2.5"
            opacity="0.7"
          />
          
          <circle 
            cx="50" 
            cy="40" 
            r="8" 
            fill="rgba(0, 255, 65, 0.2)" 
            stroke="#00ff41" 
            strokeWidth="2"
          />
          
          {/* Center point - pulsing */}
          <circle 
            cx="50" 
            cy="40" 
            r="4" 
            fill="#00ff41"
          >
            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
          </circle>
          
          {/* Crosshair */}
          <g stroke="#00ff41" strokeWidth="2.5" strokeLinecap="square" opacity="0.8">
            {/* Top */}
            <line x1="50" y1="8" x2="50" y2="16" />
            <line x1="48" y1="10" x2="52" y2="10" strokeWidth="1" />
            
            {/* Bottom */}
            <line x1="50" y1="64" x2="50" y2="72" />
            <line x1="48" y1="70" x2="52" y2="70" strokeWidth="1" />
            
            {/* Left */}
            <line x1="18" y1="40" x2="26" y2="40" />
            <line x1="20" y1="38" x2="20" y2="42" strokeWidth="1" />
            
            {/* Right */}
            <line x1="74" y1="40" x2="82" y2="40" />
            <line x1="80" y1="38" x2="80" y2="42" strokeWidth="1" />
          </g>
          
          {/* Arrow shaft */}
          <line 
            x1="16" 
            y1="76" 
            x2="44" 
            y2="48" 
            stroke="url(#nourArrow)" 
            strokeWidth="3.5" 
            strokeLinecap="round"
          />
          
          {/* Arrow inner glow */}
          <line 
            x1="16" 
            y1="76" 
            x2="44" 
            y2="48" 
            stroke="#00ff41" 
            strokeWidth="1.5" 
            strokeLinecap="round"
            opacity="0.8"
          />
          
          {/* Arrow head - pointed */}
          <path
            d="M 44 48 L 50 42 L 46 46 L 50 50 Z"
            fill="#00ff41"
          />
          <path
            d="M 44 48 L 50 42 L 46 46 L 50 50 Z"
            stroke="#00d9ff"
            strokeWidth="1"
            fill="none"
          />
          
          {/* Arrow fletching */}
          <path
            d="M 16 72 L 16 80 L 22 76 Z"
            fill="#00d9ff"
          />
          <path
            d="M 16 72 L 16 80 L 22 76 Z"
            stroke="#00ff41"
            strokeWidth="1"
            fill="none"
          />
          
          {/* Scan line effect */}
          <rect 
            x="0" 
            y="39" 
            width="100" 
            height="2" 
            fill="url(#scanLine)"
          />
          
          {/* Digital particles */}
          <g fill="#00ff41">
            <circle cx="68" cy="22" r="1.5" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="32" cy="58" r="1.5" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="72" cy="52" r="1" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
            </circle>
          </g>
          
          {/* Cyan accent particles */}
          <g fill="#00d9ff">
            <circle cx="28" cy="24" r="1.5" opacity="0.7">
              <animate attributeName="opacity" values="0.7;0.2;0.7" dur="2.8s" repeatCount="indefinite" />
            </circle>
            <circle cx="70" cy="34" r="1" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3.2s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>
      );
      
    default:
      return null;
  }
};