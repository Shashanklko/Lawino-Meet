import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'maroon',
    name: 'Imperial Maroon & Cream',
    subtitle: 'Signature Luxury Heritage',
    primary: '#4A0E17',
    cream: '#FFFDF7',
    accent: '#C5A880',
    headerBg: 'bg-maroon-900',
    cardBg: 'bg-cream-100',
    badge: 'border-maroon-800 text-maroon-800',
  },
  {
    id: 'navy',
    name: 'High Court Navy & Gold',
    subtitle: 'Judicial Authority',
    primary: '#0B192C',
    cream: '#F8F9FA',
    accent: '#D4AF37',
    headerBg: 'bg-navy-900',
    cardBg: 'bg-slate-50',
    badge: 'border-navy-800 text-navy-800',
  },
  {
    id: 'emerald',
    name: 'Prestige Barrister Emerald',
    subtitle: 'Distinguished Equity',
    primary: '#0A261D',
    cream: '#F7F9F8',
    accent: '#C2A649',
    headerBg: 'bg-emeraldLegal-900',
    cardBg: 'bg-emerald-50/50',
    badge: 'border-emerald-800 text-emerald-800',
  },
  {
    id: 'onyx',
    name: 'Executive Obsidian & Bronze',
    subtitle: 'Modern Precision',
    primary: '#141414',
    cream: '#F7F7F7',
    accent: '#C59B27',
    headerBg: 'bg-onyx-900',
    cardBg: 'bg-neutral-100',
    badge: 'border-neutral-800 text-neutral-800',
  },
];

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('lawino_theme') || 'maroon';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lawino_theme', theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
