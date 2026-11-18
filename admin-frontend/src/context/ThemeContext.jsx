import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = [
  { id: 'dark-onyx', name: 'Imperial Charcoal', primary: '#161210', accent: '#941B2B' },
  { id: 'navy', name: 'High Court Navy', primary: '#070F1E', accent: '#D4AF37' },
  { id: 'emerald', name: 'Chambers Emerald', primary: '#051812', accent: '#C2A649' },
  { id: 'classic-maroon', name: 'Bar Council Maroon', primary: '#1F0408', accent: '#C5A880' },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('lawino_admin_theme') || 'dark-onyx';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('lawino_admin_theme', theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
