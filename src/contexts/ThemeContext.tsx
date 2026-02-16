import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '../utils/client';

// 4 thèmes de couleurs modernes
export type Theme = 'emerald' | 'blue' | 'purple' | 'pink';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  gradient: string;
  name: string;
}

const themeColors: Record<Theme, ThemeColors> = {
  emerald: {
    primary: '#10b981',
    primaryDark: '#059669',
    primaryLight: '#34d399',
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    name: 'Émeraude',
  },
  blue: {
    primary: '#3b82f6',
    primaryDark: '#1d4ed8',
    primaryLight: '#60a5fa',
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    name: 'Bleu',
  },
  purple: {
    primary: '#8b5cf6',
    primaryDark: '#6d28d9',
    primaryLight: '#a78bfa',
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    name: 'Violet',
  },
  pink: {
    primary: '#ec4899',
    primaryDark: '#be185d',
    primaryLight: '#f472b6',
    gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
    name: 'Rose',
  },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colors: ThemeColors;
  userId: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children, userId }: { children: ReactNode; userId?: string | null }) {
  const [theme, setThemeState] = useState<Theme>('emerald');

  // Load theme from Supabase when userId is available
  useEffect(() => {
    if (!userId) {
      // Load from localStorage if not authenticated
      const saved = localStorage.getItem('kg_theme');
      if (saved) setThemeState(saved as Theme);
      return;
    }

    const loadTheme = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('user_theme')
        .eq('id', userId)
        .single();

      if (data && data.user_theme && !error) {
        setThemeState(data.user_theme as Theme);
      }
    };

    loadTheme();
  }, [userId]);

  useEffect(() => {
    // Update CSS custom properties
    const colors = themeColors[theme];
    document.documentElement.style.setProperty('--kg-theme-primary', colors.primary);
    document.documentElement.style.setProperty('--kg-theme-gradient', colors.gradient);
    
    // Save to localStorage
    localStorage.setItem('kg_theme', theme);
  }, [theme]);

  // Save theme to Supabase when changed
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);

    if (userId) {
      await supabase
        .from('users')
        .update({ user_theme: newTheme })
        .eq('id', userId);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors: themeColors[theme], userId: userId || null }}>
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

// Export all themes for selector
export const allThemes: Theme[] = ['emerald', 'blue', 'purple', 'pink'];
