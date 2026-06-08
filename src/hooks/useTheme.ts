import { useState, useCallback } from 'react';

export const THEME_OPTIONS = [
  { value: 'neon-arcade', label: 'Neon Arcade' },
  { value: 'classic', label: 'Classic Snake' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'high-contrast', label: 'High Contrast' },
] as const;

export type ThemeValue = typeof THEME_OPTIONS[number]['value'];

const THEME_KEY = 'snakeTheme';

function loadTheme(): ThemeValue {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored && THEME_OPTIONS.some(t => t.value === stored)) {
      return stored as ThemeValue;
    }
  } catch {
    // ignore
  }
  return 'neon-arcade';
}

function saveTheme(theme: ThemeValue): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export function useTheme(): [ThemeValue, (theme: ThemeValue) => void] {
  const [theme, setThemeState] = useState<ThemeValue>(() => loadTheme());

  const setTheme = useCallback((next: ThemeValue) => {
    setThemeState(next);
    saveTheme(next);
    document.documentElement.dataset.theme = next;
  }, []);

  return [theme, setTheme];
}
