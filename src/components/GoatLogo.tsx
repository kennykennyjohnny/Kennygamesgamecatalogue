export function GoatLogo({ className = "w-8 h-8", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className}
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Forme simple et géométrique - tête triangulaire */}
      <path d="M 50 20 L 75 50 L 70 70 L 50 75 L 30 70 L 25 50 Z" opacity="0.9"/>
      
      {/* Corne gauche - trait simple */}
      <path d="M 30 30 L 20 15" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none"/>
      
      {/* Corne droite - trait simple */}
      <path d="M 55 25 L 50 10" stroke={color} strokeWidth="4" strokeLinecap="round" fill="none"/>
      
      {/* Oreille - forme simple */}
      <ellipse cx="28" cy="45" rx="8" ry="12" opacity="0.8"/>
      
      {/* Œil - point simple */}
      <circle cx="45" cy="50" r="4" fill={color === 'currentColor' ? 'white' : 'rgba(255,255,255,0.95)'}/>
      
      {/* Barbiche - forme triangulaire simple */}
      <path d="M 48 75 L 45 90 L 52 90 Z" opacity="0.85"/>
    </svg>
  );
}
