import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeSelector = () => {
  const { theme, changeTheme, themes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentTheme = themes.find((t) => t.id === theme) || themes[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-xs text-stone-300 transition cursor-pointer"
        style={{ backgroundColor: 'var(--admin-bg-base)', borderColor: 'var(--admin-border)' }}
        title="Administrative Console Palette"
      >
        <span
          className="w-2.5 h-2.5 rounded-full border border-stone-600"
          style={{ backgroundColor: currentTheme.accent }}
        />
        <Palette className="w-3.5 h-3.5 text-stone-400" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-xl border shadow-2xl z-50 p-2 space-y-1 text-xs"
          style={{ backgroundColor: 'var(--admin-bg-card)', borderColor: 'var(--admin-border)' }}
        >
          <div
            className="px-2 py-1 text-[10px] font-mono text-stone-400 uppercase tracking-wider border-b"
            style={{ borderColor: 'var(--admin-border)' }}
          >
            Console Theme
          </div>
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                changeTheme(t.id);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer ${
                t.id === theme
                  ? 'text-white font-medium border'
                  : 'text-stone-300 hover:opacity-80'
              }`}
              style={{
                backgroundColor: t.id === theme ? `${t.accent}25` : 'transparent',
                borderColor: t.id === theme ? `${t.accent}60` : 'transparent',
              }}
            >
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full border border-stone-700" style={{ backgroundColor: t.accent }} />
                <span>{t.name}</span>
              </div>
              {t.id === theme && <Check className="w-3 h-3 text-amber-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
