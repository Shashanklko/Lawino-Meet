import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const LanguageSelector = ({ position = 'down', isCollapsed = false, className = '' }) => {
  const { language, setLanguage, languages, currentLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 transition cursor-pointer select-none ${
          isCollapsed
            ? 'w-10 h-10 mx-auto rounded-xl justify-center border border-[var(--border-cream)] bg-white/80 hover:bg-[var(--bg-cream-card)] text-stone-700'
            : 'px-2.5 py-1.5 rounded-xl border border-[var(--border-cream)] bg-white/80 hover:bg-[var(--bg-cream-card)] text-xs text-stone-800 shadow-2xs'
        }`}
        title={`Language: ${currentLanguage.nativeName} (${currentLanguage.name})`}
      >
        <Globe className="w-3.5 h-3.5 text-[var(--bg-primary)] shrink-0" />
        {!isCollapsed && (
          <>
            <span className="font-medium text-[11px] truncate max-w-[90px]">
              {currentLanguage.nativeName}
            </span>
            <ChevronDown className="w-3 h-3 text-stone-400 shrink-0" />
          </>
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            position === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          } right-0 w-64 rounded-2xl bg-white/95 backdrop-blur-2xl border border-stone-200 shadow-2xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95`}
        >
          <div className="px-3 py-1.5 border-b border-stone-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
            <span>Select Language / भाषा चुनें</span>
            <span className="text-[10px] text-stone-400">8 Indian Languages</span>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-stone-50">
            {languages.map((l) => {
              const isSelected = l.id === language;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => {
                    setLanguage(l.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between rounded-xl transition cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--bg-cream-card)] text-[var(--bg-primary)] font-bold'
                      : 'hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold leading-tight">{l.nativeName}</p>
                    <p className="text-[10px] text-stone-400 truncate">{l.name} • {l.region}</p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--bg-primary)] shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
