import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

export const MetricCard = ({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
  badgeType = 'neutral', // 'neutral' | 'success' | 'warning' | 'accent'
  onClick,
}) => {
  const { t } = useLanguage();

  const getBadgeClass = () => {
    switch (badgeType) {
      case 'success':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'warning':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'accent':
        return 'text-[var(--bg-primary)] bg-[var(--bg-cream-card)] border-[var(--border-cream)]';
      default:
        return 'text-stone-600 bg-stone-100 border-stone-200';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border border-[var(--border-cream)] bg-white/85 backdrop-blur-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-stone-400 hover:shadow-xs' : ''
      }`}
    >
      <div className="flex items-center justify-between text-stone-500 mb-2">
        <span className="text-[11px] font-sans font-semibold uppercase tracking-wider text-stone-600">
          {t(label)}
        </span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-[var(--bg-cream-card)] flex items-center justify-center text-stone-700">
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-serif font-bold text-[var(--text-primary)] tracking-tight">
          {value}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-full border ${getBadgeClass()}`}
          >
            {t(badge)}
          </span>
        )}
      </div>

      {subtext && (
        <p className="text-[11px] text-stone-500 mt-1 font-sans truncate">
          {t(subtext)}
        </p>
      )}
    </div>
  );
};
