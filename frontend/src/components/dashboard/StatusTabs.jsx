import React from 'react';

export const StatusTabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="flex items-center space-x-1 border-b border-[var(--border-cream)] pb-1 overflow-x-auto select-none no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-sans font-medium rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-[var(--bg-primary)] text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-[var(--bg-cream-card)]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-200/80 text-stone-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
