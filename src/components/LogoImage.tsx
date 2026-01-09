// Component pour utiliser un logo PNG
// Mets ton fichier PNG dans: /public/logo.png

export function LogoImage({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <img 
      src="/logo.png" 
      alt="KennyGames Logo" 
      className={className}
      onError={(e) => {
        // Fallback vers le SVG si le PNG n'existe pas
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
