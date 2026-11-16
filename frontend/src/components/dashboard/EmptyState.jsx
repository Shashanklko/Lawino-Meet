import React from 'react';
import { Scale } from 'lucide-react';

export const EmptyState = ({
  icon: Icon = Scale,
  title = 'No records found',
  description = 'There are no active entries matching your current view or filters.',
  action,
}) => {
  return (
    <div className="py-12 px-4 rounded-xl border border-dashed border-[var(--border-cream)] bg-white/40 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-xl bg-[var(--bg-cream-card)] flex items-center justify-center text-stone-500 mb-3">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h3 className="text-sm font-serif font-bold text-stone-900 mb-1">
        {title}
      </h3>
      <p className="text-xs text-stone-500 max-w-sm mb-4 leading-relaxed font-sans">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};
