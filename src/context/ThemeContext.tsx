import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'fintech' | 'dark' | 'light' | 'emerald' | 'sapphire' | 'amber';

export interface ThemeOption {
  id: Theme;
  name: string;
  subtitle: string;
  accentColor: string;
  badge: string;
  canvasColor: string;
  cardColor: string;
  isLight: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'fintech',
    name: 'Liquid Glass Navy',
    subtitle: 'Midnight Navy (#07111F), Ocean Blue, Electric Blue & Aqua Cyan',
    accentColor: '#4DA3FF',
    badge: 'Liquid Glass',
    canvasColor: '#07111F',
    cardColor: '#0D1B2A',
    isLight: false,
  },
  {
    id: 'dark',
    name: 'Midnight Onyx',
    subtitle: 'Classic obsidian slate & emerald accents',
    accentColor: '#10b981',
    badge: 'Classic Dark',
    canvasColor: '#020617',
    cardColor: '#0f172a',
    isLight: false,
  },
  {
    id: 'light',
    name: 'Porcelain Clean',
    subtitle: 'Crisp porcelain white & high-contrast slate',
    accentColor: '#059669',
    badge: 'Clean Light',
    canvasColor: '#f8fafc',
    cardColor: '#ffffff',
    isLight: true,
  },
  {
    id: 'emerald',
    name: 'Royal Pine & Gold',
    subtitle: 'Imperial forest pine & gold luxury finish',
    accentColor: '#10b981',
    badge: 'Royal Green',
    canvasColor: '#041c14',
    cardColor: '#072a1e',
    isLight: false,
  },
  {
    id: 'sapphire',
    name: 'Cyber Sapphire',
    subtitle: 'Deep marine navy & neon cyan tech aesthetic',
    accentColor: '#06b6d4',
    badge: 'Tech Blue',
    canvasColor: '#030c1d',
    cardColor: '#071733',
    isLight: false,
  },
  {
    id: 'amber',
    name: 'Sunset Espresso',
    subtitle: 'Rich dark espresso & glowing champagne bronze',
    accentColor: '#f59e0b',
    badge: 'Warm Luxury',
    canvasColor: '#170e08',
    cardColor: '#24160e',
    isLight: false,
  },
];

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  cycleTheme: () => void;
  isLight: boolean;
  activeThemeOption: ThemeOption;
  isThemePickerOpen: boolean;
  openThemePicker: () => void;
  closeThemePicker: () => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'ms_official_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY) as Theme;
      if (['fintech', 'dark', 'light', 'emerald', 'sapphire', 'amber'].includes(stored)) {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'fintech'; // default to official brand theme
  });

  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);

  const applyTheme = (currentTheme: Theme) => {
    const root = document.documentElement;
    // Remove previous theme classes
    root.classList.remove('light', 'dark', 'theme-fintech', 'theme-emerald', 'theme-sapphire', 'theme-amber');

    // Add current theme attributes
    root.setAttribute('data-theme', currentTheme);
    if (currentTheme === 'light') {
      root.classList.add('light');
      root.style.colorScheme = 'light';
    } else {
      root.classList.add('dark', `theme-${currentTheme}`);
      root.style.colorScheme = 'dark';
    }
  };

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const cycleTheme = () => {
    setThemeState((prev) => {
      const order: Theme[] = ['fintech', 'dark', 'light', 'emerald', 'sapphire', 'amber'];
      const currentIndex = order.indexOf(prev);
      const nextIndex = (currentIndex + 1) % order.length;
      return order[nextIndex];
    });
  };

  const toggleTheme = () => {
    // When toggle is called directly, switches between light and current or dark
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const activeThemeOption =
    THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        cycleTheme,
        toggleTheme,
        isLight: theme === 'light',
        activeThemeOption,
        isThemePickerOpen,
        openThemePicker: () => setIsThemePickerOpen(true),
        closeThemePicker: () => setIsThemePickerOpen(false),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
