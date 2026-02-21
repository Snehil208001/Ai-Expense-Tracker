import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../theme/colors';
import { darkColors } from '../theme/darkColors';

const THEME_KEY = '@expense_tracker_theme';

type Theme = 'light' | 'dark';

type ThemeColors = typeof colors | typeof darkColors;

interface ThemeContextValue {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((s) => {
      if (s === 'dark' || s === 'light') setTheme(s);
    });
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    AsyncStorage.setItem(THEME_KEY, next);
  };

  const themeColors = theme === 'dark' ? darkColors : colors;

  return (
    <ThemeContext.Provider value={{ theme, colors: themeColors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  return ctx ?? { theme: 'light' as Theme, colors, toggleTheme: () => {} };
}
