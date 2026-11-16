import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeSelector = ({ position = 'up', isCollapsed = false, className = '' }) => {
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
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center transition shadow-xs cursor-pointer ${
          isCollapsed
            ? 'w-10 h-10 mx-auto rounded-xl justify-center border border-[var(--border-cream)] bg-white/80 hover:bg-[var(--bg-cream-card)] text-stone-700'
            : 'w-full justify-between px-3 py-2 rounded-xl border border-[var(--border-cream)] bg-white/80 hover:bg-[var(--bg-cream-card)] text-xs text-stone-800'
        }`}
        title={`Chamber Theme: ${currentTheme.name}`}
      >
        <div className="flex items-center space-x-2">
          <span
            className="w-3.5 h-3.5 rounded-full border border-stone-300 shadow-xs shrink-0"
            style={{ backgroundColor: currentTheme.primary }}
          />
          {!isCollapsed && (
            <span className="font-serif font-semibold text-[11px] tracking-wide text-stone-800 truncate">
              {currentTheme.name}
            </span>
          )}
        </div>
        <Palette className={`w-3.5 h-3.5 text-stone-500 shrink-0 ${isCollapsed ? '' : 'ml-2'}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            position === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          } ${
            isCollapsed ? 'left-0 sm:left-2' : 'left-0 right-0'
          } w-72 rounded-2xl bg-stone-900/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl z-50 p-3 space-y-2 text-white animate-in fade-in zoom-in-95`}
        >
          <div className="px-2 py-1 flex items-center justify-between border-b border-stone-800 pb-2">
            <span className="text-[11px] font-serif uppercase tracking-widest text-amber-400 font-bold flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Chamber Palette</span>
            </span>
            <span className="text-[10px] text-stone-400">4 Bespoke Themes</span>
          </div>

          <div className="space-y-1">
            {THEMES.map((t) => {
              const isSelected = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition border cursor-pointer ${
                    isSelected
                      ? 'border-amber-400/80 bg-amber-400/15 text-white shadow-xs'
                      : 'border-transparent hover:border-stone-700 hover:bg-white/5 text-stone-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex -space-x-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                        style={{ backgroundColor: t.primary }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                        style={{ backgroundColor: t.cream }}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-white/40 shadow-xs"
                        style={{ backgroundColor: t.accent }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-serif font-bold text-cream-50">{t.name}</p>
                      <p className="text-[10px] text-stone-400 font-sans">{t.subtitle}</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
