import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const PageHeader = ({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  actions,
  children,
}) => {
  const { t } = useLanguage();

  return (
    <div className="mb-6 select-none">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center space-x-1.5 text-[11px] font-sans text-stone-500 mb-1.5">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight className="w-3 h-3 text-stone-400 shrink-0" />}
              <span className={idx === breadcrumbs.length - 1 ? 'text-stone-800 font-semibold' : 'hover:text-stone-700'}>
                {t(crumb)}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Main Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[var(--text-primary)] tracking-tight">
              {t(title)}
            </h1>
            {badge && (
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border border-[var(--border-cream)] bg-[var(--bg-cream-card)] text-stone-700">
                {t(badge)}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-stone-500 mt-1 font-sans leading-relaxed max-w-2xl">
              {t(subtitle)}
            </p>
          )}
        </div>

        {/* Action Buttons or Context Dropdown */}
        {actions && <div className="flex items-center space-x-2 shrink-0">{actions}</div>}
      </div>

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};
