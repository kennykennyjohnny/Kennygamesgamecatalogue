// GAME ICONS — richly illustrated, matching each game's actual theme

export const GameIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'sandy':
      // SandyPong — Rosé glasses on sunset beach table
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="sandySky" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#1a0525" />
              <stop offset="35%" stopColor="#6b1840" />
              <stop offset="60%" stopColor="#c45030" />
              <stop offset="85%" stopColor="#e8a040" />
              <stop offset="100%" stopColor="#f0d080" />
            </linearGradient>
            <linearGradient id="sandyWine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4b0c3" />
              <stop offset="100%" stopColor="#d4607a" />
            </linearGradient>
            <linearGradient id="sandyWood" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#5a3424" />
              <stop offset="100%" stopColor="#3a2016" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#sandySky)" rx="10" />
          {/* Sun */}
          <circle cx="50" cy="22" r="8" fill="rgba(255,200,100,0.3)" />
          <circle cx="50" cy="22" r="4" fill="rgba(255,220,150,0.5)" />
          <circle cx="50" cy="22" r="1.5" fill="rgba(255,240,200,0.7)" />
          {/* Palm silhouettes */}
          <line x1="12" y1="60" x2="14" y2="32" stroke="rgba(10,5,20,0.25)" strokeWidth="1.2" />
          <ellipse cx="10" cy="30" rx="7" ry="3" fill="rgba(10,5,20,0.2)" transform="rotate(-25,10,30)" />
          <ellipse cx="18" cy="31" rx="6" ry="2.5" fill="rgba(10,5,20,0.18)" transform="rotate(15,18,31)" />
          {/* Table */}
          <polygon points="8,58 92,58 100,100 0,100" fill="url(#sandyWood)" />
          <line x1="8" y1="58" x2="92" y2="58" stroke="rgba(255,180,120,0.12)" strokeWidth="0.6" />
          {/* Glass left */}
          <g transform="translate(30,60)">
            <rect x="-0.5" y="8" width="1" height="12" fill="rgba(255,255,255,0.12)" rx="0.3" />
            <ellipse cx="0" cy="20" rx="4" ry="1" fill="rgba(255,255,255,0.08)" />
            <path d="M-5,-6 Q-6,4 -1.2,8.5 L1.2,8.5 Q6,4 5,-6 Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
            <path d="M-4.5,-4 Q-5.5,3 -1.2,7.5 L1.2,7.5 Q5.5,3 4.5,-4 Z" fill="url(#sandyWine)" opacity="0.4" />
            <ellipse cx="0" cy="-5.5" rx="4.5" ry="0.8" fill="rgba(244,176,195,0.2)" />
            <path d="M-3.5,-5 Q-4.5,1 -1.5,6 L-0.8,5 Q-3.5,0 -2.8,-5 Z" fill="rgba(255,255,255,0.2)" />
          </g>
          {/* Glass center (larger) */}
          <g transform="translate(52,56)">
            <rect x="-0.6" y="10" width="1.2" height="14" fill="rgba(255,255,255,0.12)" rx="0.4" />
            <ellipse cx="0" cy="24" rx="5" ry="1.2" fill="rgba(255,255,255,0.08)" />
            <path d="M-6,-7 Q-7,5 -1.5,10.5 L1.5,10.5 Q7,5 6,-7 Z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.4" />
            <path d="M-5.5,-5 Q-6.5,4 -1.5,9.5 L1.5,9.5 Q6.5,4 5.5,-5 Z" fill="url(#sandyWine)" opacity="0.45" />
            <ellipse cx="0" cy="-6.5" rx="5.5" ry="0.9" fill="rgba(244,176,195,0.2)" />
            <path d="M-4,-6 Q-5,2 -1.8,7 L-1,6 Q-4,0 -3.2,-6 Z" fill="rgba(255,255,255,0.22)" />
          </g>
          {/* Glass right */}
          <g transform="translate(72,62)">
            <rect x="-0.5" y="7" width="1" height="10" fill="rgba(255,255,255,0.1)" rx="0.3" />
            <ellipse cx="0" cy="17" rx="3.5" ry="0.9" fill="rgba(255,255,255,0.06)" />
            <path d="M-4.5,-5 Q-5,3.5 -1,7.5 L1,7.5 Q5,3.5 4.5,-5 Z" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.4" />
            <path d="M-4,-3.5 Q-4.5,3 -1,6.5 L1,6.5 Q4.5,3 4,-3.5 Z" fill="url(#sandyWine)" opacity="0.35" />
            <path d="M-3,-4 Q-4,1 -1.2,5 L-0.6,4 Q-3,0.5 -2.3,-4 Z" fill="rgba(255,255,255,0.18)" />
          </g>
          {/* Ball with arc */}
          <path d="M22,52 Q28,28 42,42" stroke="rgba(255,255,255,0.2)" strokeWidth="0.6" fill="none" strokeDasharray="2,1.5" />
          <circle cx="22" cy="52" r="3.5" fill="white" opacity="0.9" />
          <circle cx="20.5" cy="50.5" r="1.2" fill="white" opacity="0.5" />
          {/* Title shimmer line */}
          <line x1="25" y1="95" x2="75" y2="95" stroke="rgba(244,176,195,0.15)" strokeWidth="0.3" />
        </svg>
      );

    case 'lea':
      // LéaNaval — Wine bottle battle on painted canvas
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="leaBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e100c" />
              <stop offset="50%" stopColor="#2a1810" />
              <stop offset="100%" stopColor="#181010" />
            </linearGradient>
            <linearGradient id="leaBottle" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#b01848" />
              <stop offset="50%" stopColor="#8b1030" />
              <stop offset="100%" stopColor="#5a0a20" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#leaBg)" rx="10" />
          {/* Golden frame */}
          <rect x="6" y="6" width="88" height="88" rx="4" fill="none" stroke="#c9a050" strokeWidth="2.5" opacity="0.3" />
          <rect x="9" y="9" width="82" height="82" rx="3" fill="none" stroke="#8b6920" strokeWidth="0.5" opacity="0.2" />
          {/* Canvas texture lines */}
          <g stroke="rgba(201,160,80,0.03)" strokeWidth="0.3">
            {[15,20,25,30,35,40,45,50,55,60,65,70,75,80,85].map(v => <line key={`h${v}`} x1="10" y1={v} x2="90" y2={v} />)}
            {[15,20,25,30,35,40,45,50,55,60,65,70,75,80,85].map(v => <line key={`v${v}`} x1={v} y1="10" x2={v} y2="90" />)}
          </g>
          {/* Grid lines — battleship grid */}
          <g stroke="rgba(139,32,56,0.08)" strokeWidth="0.3">
            {[22,34,46,58,70,82].map(v => <line key={`g${v}`} x1="14" y1={v} x2="86" y2={v} />)}
            {[22,34,46,58,70,82].map(v => <line key={`gv${v}`} x1={v} y1="14" x2={v} y2="86" />)}
          </g>
          {/* Wine bottle — horizontal, detailed */}
          <g transform="translate(20,42)">
            {/* Cork */}
            <rect x="-2" y="3" width="6" height="6" rx="2.5" fill="#c9a050" stroke="#a07830" strokeWidth="0.5" />
            {/* Neck */}
            <rect x="3" y="2.5" width="10" height="7" rx="3.5" fill="url(#leaBottle)" />
            {/* Body */}
            <rect x="10" y="0" width="38" height="12" rx="5" fill="url(#leaBottle)" />
            {/* Label */}
            <rect x="22" y="2" width="18" height="8" rx="1.5" fill="rgba(255,240,220,0.12)" stroke="rgba(201,160,80,0.1)" strokeWidth="0.3" />
            <text x="31" y="7.5" textAnchor="middle" fill="rgba(201,160,80,0.3)" fontSize="4" fontFamily="Georgia,serif" fontStyle="italic" fontWeight="700">Léa</text>
            {/* Shine */}
            <rect x="12" y="1.5" width="4" height="9" rx="2" fill="rgba(255,255,255,0.08)" />
          </g>
          {/* Hit markers — wine splashes */}
          <circle cx="28" cy="28" r="5" fill="rgba(180,20,50,0.35)" />
          <circle cx="28" cy="28" r="2.5" fill="rgba(200,30,60,0.4)" />
          <line x1="25.5" y1="25.5" x2="30.5" y2="30.5" stroke="rgba(255,200,210,0.5)" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="30.5" y1="25.5" x2="25.5" y2="30.5" stroke="rgba(255,200,210,0.5)" strokeWidth="1.2" strokeLinecap="round" />
          {/* Miss — golden brush stroke */}
          <ellipse cx="68" cy="30" rx="4" ry="2" fill="rgba(201,160,80,0.2)" transform="rotate(-20,68,30)" />
          <ellipse cx="70" cy="29" rx="2" ry="1" fill="rgba(201,160,80,0.12)" transform="rotate(10,70,29)" />
          {/* Hit bottom */}
          <circle cx="58" cy="72" r="4" fill="rgba(160,20,40,0.3)" />
          <line x1="56" y1="70" x2="60" y2="74" stroke="rgba(255,200,210,0.4)" strokeWidth="1" strokeLinecap="round" />
          <line x1="60" y1="70" x2="56" y2="74" stroke="rgba(255,200,210,0.4)" strokeWidth="1" strokeLinecap="round" />
          {/* Wine stain detail */}
          <circle cx="75" cy="65" r="2.5" fill="rgba(139,16,48,0.2)" />
          <circle cx="77" cy="64" r="1" fill="rgba(139,16,48,0.12)" />
          {/* Warm glow */}
          <circle cx="50" cy="50" r="30" fill="rgba(201,160,80,0.015)" />
        </svg>
      );

    case 'liliano':
      // LilianoThunder — Neon punk tank on battlefield
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="lilSky" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#05001a" />
              <stop offset="40%" stopColor="#150030" />
              <stop offset="70%" stopColor="#250040" />
              <stop offset="100%" stopColor="#0a0a1a" />
            </linearGradient>
            <linearGradient id="lilTank" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a21caf" />
              <stop offset="50%" stopColor="#d946ef" />
              <stop offset="100%" stopColor="#c026d3" />
            </linearGradient>
            <radialGradient id="lilBoom">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8" />
              <stop offset="40%" stopColor="#ff6600" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ff00ff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="lilTerrain" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#2a1a2a" />
              <stop offset="100%" stopColor="#0a0510" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#lilSky)" rx="10" />
          {/* Stars */}
          {[{x:8,y:8},{x:25,y:15},{x:42,y:6},{x:60,y:12},{x:78,y:8},{x:15,y:22},{x:88,y:18},{x:35,y:20},{x:55,y:22},{x:70,y:5}].map((s,i) =>
            <circle key={i} cx={s.x} cy={s.y} r={0.5 + (i%3)*0.2} fill="white" opacity={0.2 + (i%4)*0.08} />
          )}
          {/* Moon */}
          <circle cx="80" cy="18" r="5" fill="rgba(200,180,255,0.06)" />
          <circle cx="80" cy="18" r="2" fill="rgba(220,200,255,0.1)" />
          {/* Terrain */}
          <path d="M0,72 Q15,62 30,68 Q45,74 55,66 Q70,58 85,65 Q95,70 100,68 L100,100 L0,100 Z" fill="url(#lilTerrain)" />
          <path d="M0,72 Q15,62 30,68 Q45,74 55,66 Q70,58 85,65 Q95,70 100,68" fill="none" stroke="#ff00ff" strokeWidth="0.7" opacity="0.4" />
          {/* Explosion glow */}
          <circle cx="72" cy="42" r="14" fill="url(#lilBoom)" />
          <circle cx="72" cy="42" r="6" fill="rgba(255,200,50,0.3)" />
          <circle cx="72" cy="42" r="2" fill="rgba(255,255,200,0.5)" />
          {/* Explosion sparks */}
          {[0,45,90,135,180,225,270,315].map((a,i) => {
            const rad = (a * Math.PI) / 180;
            const d = 8 + (i%3)*3;
            return <circle key={i} cx={72+Math.cos(rad)*d} cy={42+Math.sin(rad)*d} r={0.6} fill={['#fbbf24','#ff6600','#ff00ff','#00ffff'][i%4]} opacity={0.6} />;
          })}
          {/* Tank */}
          <g transform="translate(22,58)">
            {/* Tracks */}
            <rect x="-2" y="7" width="30" height="5" rx="2.5" fill="#222" stroke="rgba(255,0,255,0.2)" strokeWidth="0.3" />
            {[0,5,10,15,20,25].map(tx => <circle key={tx} cx={tx} cy="9.5" r="1.8" fill="#1a1a1a" stroke="rgba(255,0,255,0.1)" strokeWidth="0.3" />)}
            {/* Body */}
            <rect x="1" y="-1" width="24" height="9" rx="3" fill="url(#lilTank)" />
            <rect x="3" y="0" width="3" height="7" rx="1.5" fill="rgba(255,255,255,0.08)" />
            {/* Turret */}
            <ellipse cx="14" cy="-1" rx="8" ry="5" fill="#d946ef" />
            <ellipse cx="14" cy="-2" rx="6" ry="3" fill="rgba(255,255,255,0.05)" />
            {/* Barrel */}
            <line x1="20" y1="-3" x2="38" y2="-12" stroke="#c026d3" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="20" y1="-3" x2="38" y2="-12" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeLinecap="round" />
            {/* Muzzle flash */}
            <circle cx="38" cy="-12" r="3" fill="rgba(255,200,50,0.5)" />
            <circle cx="38" cy="-12" r="1.5" fill="rgba(255,255,200,0.6)" />
            {/* Lightning emblem */}
            <path d="M12,-1 L15,-4 L13.5,-3.5 L16,-6" fill="none" stroke="#fbbf24" strokeWidth="0.8" strokeLinecap="round" />
          </g>
          {/* Projectile arc */}
          <path d="M42,45 Q55,20 70,42" stroke="rgba(255,255,0,0.25)" strokeWidth="0.8" fill="none" strokeDasharray="2,1.5" />
          {/* Neon glow line bottom */}
          <line x1="0" y1="98" x2="100" y2="98" stroke="#ff00ff" strokeWidth="0.5" opacity="0.15" />
        </svg>
      );

    case 'nour':
      // NourPigeon — Countryside clay pigeon shooting
      return (
        <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
          <defs>
            <linearGradient id="nourSky" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#3a70b8" />
              <stop offset="40%" stopColor="#6aaddb" />
              <stop offset="70%" stopColor="#98cceb" />
              <stop offset="90%" stopColor="#c0ddb0" />
              <stop offset="100%" stopColor="#6a9a40" />
            </linearGradient>
            <linearGradient id="nourGrass" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#4a8a34" />
              <stop offset="50%" stopColor="#2d5a1e" />
              <stop offset="100%" stopColor="#1a3a12" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#nourSky)" rx="10" />
          {/* Clouds */}
          <ellipse cx="20" cy="15" rx="12" ry="4" fill="rgba(255,255,255,0.5)" />
          <ellipse cx="16" cy="13.5" rx="7" ry="3" fill="rgba(255,255,255,0.35)" />
          <ellipse cx="72" cy="10" rx="14" ry="4.5" fill="rgba(255,255,255,0.45)" />
          <ellipse cx="68" cy="8.5" rx="8" ry="3" fill="rgba(255,255,255,0.3)" />
          <ellipse cx="45" cy="20" rx="8" ry="2.5" fill="rgba(255,255,255,0.3)" />
          {/* Trees on horizon */}
          {[10,22,35,48,58,70,82,92].map((tx,i) => (
            <ellipse key={i} cx={tx} cy="68" rx={2.5+(i%3)} ry={4+(i%4)*1.2} fill={`rgba(30,${70+i*6},25,0.5)`} />
          ))}
          {/* Ground */}
          <rect x="0" y="68" width="100" height="32" fill="url(#nourGrass)" rx="0" />
          {/* Grass tufts */}
          {[8,18,30,42,55,65,78,90].map((gx,i) => (
            <g key={i}>
              <line x1={gx} y1="70" x2={gx-1} y2="67" stroke="rgba(70,140,50,0.4)" strokeWidth="0.5" />
              <line x1={gx+1} y1="70" x2={gx+2} y2="66.5" stroke="rgba(60,130,40,0.3)" strokeWidth="0.4" />
            </g>
          ))}
          {/* Trap machine */}
          <rect x="43" y="72" width="10" height="4" rx="0.5" fill="#555" stroke="#444" strokeWidth="0.3" />
          <rect x="46" y="70" width="4" height="2.5" rx="0.3" fill="#666" />
          {/* Clay pigeon — flying */}
          <g transform="translate(35,32)">
            <ellipse cx="0" cy="0" rx="5" ry="2" fill="#c45a20" stroke="#8b3a10" strokeWidth="0.4" transform="rotate(-15,0,0)" />
            <ellipse cx="-1" cy="-0.5" rx="2.5" ry="0.7" fill="rgba(255,200,150,0.3)" transform="rotate(-15,0,0)" />
            <ellipse cx="0" cy="0" rx="2" ry="0.7" fill="none" stroke="#8b3a10" strokeWidth="0.2" opacity="0.5" transform="rotate(-15,0,0)" />
          </g>
          {/* Launch arc trail */}
          <path d="M48,72 Q38,40 32,32" stroke="rgba(196,90,32,0.2)" strokeWidth="0.6" fill="none" strokeDasharray="2,1.5" />
          {/* Crosshair on pigeon */}
          <circle cx="35" cy="32" r="6" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
          <circle cx="35" cy="32" r="2.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
          <line x1="29" y1="32" x2="33" y2="32" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
          <line x1="37" y1="32" x2="41" y2="32" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
          <line x1="35" y1="26" x2="35" y2="30" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
          <line x1="35" y1="34" x2="35" y2="38" stroke="rgba(255,255,255,0.4)" strokeWidth="0.3" />
          <circle cx="35" cy="32" r="0.6" fill="rgba(255,50,50,0.6)" />
          {/* Shotgun barrels — bottom */}
          <g transform="translate(40,82)">
            <rect x="0" y="0" width="18" height="3" rx="0.5" fill="#555" stroke="#444" strokeWidth="0.3" />
            <rect x="0" y="3.5" width="18" height="3" rx="0.5" fill="#4a4a4a" stroke="#444" strokeWidth="0.3" />
            {/* Barrel openings */}
            <ellipse cx="0" cy="1.5" rx="0.6" ry="1.2" fill="#222" />
            <ellipse cx="0" cy="5" rx="0.6" ry="1.2" fill="#222" />
            {/* Stock */}
            <path d="M18,0 Q24,-1 28,2 Q32,5 34,8 L30,9 Q27,6 22,5 Q19,4.5 18,6.5 Z" fill="#6b4226" stroke="#8b5e3c" strokeWidth="0.3" />
          </g>
          {/* Second pigeon (distant, smaller) */}
          <g transform="translate(65,25)" opacity="0.5">
            <ellipse cx="0" cy="0" rx="3" ry="1.2" fill="#c45a20" transform="rotate(10,0,0)" />
          </g>
          {/* Score badge */}
          <g transform="translate(82,78)">
            <rect x="-7" y="-5" width="14" height="10" rx="3" fill="rgba(232,118,42,0.15)" stroke="rgba(232,118,42,0.2)" strokeWidth="0.5" />
            <text x="0" y="2" textAnchor="middle" fill="#e8762a" fontSize="6" fontFamily="Georgia,serif" fontWeight="700">+10</text>
          </g>
        </svg>
      );

    default:
      return null;
  }
};
