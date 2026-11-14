import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeSelector = () => {
  const { theme, setTheme, THEMES, currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-luxury-gold/40 bg-black/30 hover:bg-black/50 text-xs text-cream-100 transition shadow-sm"
        title="Custom Legal Themes"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-luxury-gold shadow-sm"
          style={{ backgroundColor: currentTheme.primary }}
        />
        <span className="hidden sm:inline font-serif font-medium text-[11px] tracking-wide text-luxury-gold-light">
          {currentTheme.name.split(' ')[0]}
        </span>
        <Palette className="w-3.5 h-3.5 text-luxury-gold" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-maroon-950/95 backdrop-blur-xl border border-luxury-gold/40 shadow-2xl z-50 p-3 space-y-2 text-white">
          <div className="px-2 py-1 flex items-center justify-between border-b border-luxury-gold/20 pb-2">
            <span className="text-[11px] font-serif uppercase tracking-widest text-luxury-gold font-bold flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chamber Palette</span>
            </span>
            <span className="text-[10px] text-cream-400">4 Bespoke Themes</span>
          </div>

          <div className="space-y-1">
            {THEMES.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition border ${
                    isSelected
                      ? 'border-luxury-gold bg-luxury-gold/20 text-white shadow-md'
                      : 'border-transparent hover:border-luxury-gold/30 hover:bg-white/5 text-cream-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex -space-x-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                        style={{ backgroundColor: t.primary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                        style={{ backgroundColor: t.cream }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                        style={{ backgroundColor: t.accent }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-serif font-bold text-cream-100">{t.name}</p>
                      <p className="text-[10px] text-cream-400 font-sans">{t.subtitle}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-luxury-gold" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
