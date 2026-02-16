import { createContext, useContext, useState, ReactNode } from 'react';

export type Theme = 'emerald' | 'blue' | 'purple' | 'pink';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  gradient: string;
}

const themeColors: Record<Theme, ThemeColors> = {
  emerald: {
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  },
  blue: {
    primary: '#3b82f6',
    primaryDark: '#1d4ed8',
    primaryLight: '#60a5fa',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  },
  purple: {
    primary: '#8b5cf6',
    primaryDark: '#6d28d9',
    primaryLight: '#a78bfa',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
  },
  pink: {
    primary: '#ec4899',
    primaryDark: '#be185d',
    primaryLight: '#f472b6',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
  },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('emerald');

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
