import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Thèmes basés sur les 4 jeux
export type Theme = 'sandy' | 'lea' | 'liliano' | 'nour';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  gradient: string;
  emoji: string;
  name: string;
}

const themeColors: Record<Theme, ThemeColors> = {
  sandy: {
    primary: '#ff1493',
    primaryDark: '#c71585',
    primaryLight: '#ffc0cb',
    gradient: 'linear-gradient(135deg, #ff1493 0%, #ffc0cb 100%)',
    emoji: '🍷',
    name: 'SandyPong',
  },
  lea: {
    primary: '#722f37',
    primaryDark: '#5a242c',
    primaryLight: '#d4af37',
    gradient: 'linear-gradient(135deg, #722f37 0%, #d4af37 100%)',
    emoji: '🍾',
    name: 'LéaNaval',
  },
  liliano: {
    primary: '#ff00ff',
    primaryDark: '#cc00cc',
    primaryLight: '#00ffff',
    gradient: 'linear-gradient(135deg, #ff00ff 0%, #00ffff 100%)',
    emoji: '⚡',
    name: 'LilianoThunder',
  },
  nour: {
    primary: '#00ff41',
    primaryDark: '#00cc33',
    primaryLight: '#00d9ff',
    gradient: 'linear-gradient(135deg, #00ff41 0%, #00d9ff 100%)',
    emoji: '💻',
    name: 'NourArchery',
  },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('kg_theme');
    return (saved as Theme) || 'sandy';
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('kg_theme', theme);
    
    // Update CSS custom properties
    const colors = themeColors[theme];
    document.documentElement.style.setProperty('--kg-theme-primary', colors.primary);
    document.documentElement.style.setProperty('--kg-theme-gradient', colors.gradient);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: themeColors[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Helper pour obtenir les couleurs d'un thème sans hook
export function getThemeColors(theme: Theme): ThemeColors {
  return themeColors[theme];
}
