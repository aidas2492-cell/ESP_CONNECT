import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const THEMES = {
  primary: 'bg-primary-600',
  emerald: 'bg-emerald-600',
  slate: 'bg-slate-800',
};

export default function Sidebar({ items, active, onSelect, theme = 'primary' }) {
  const { t } = useLanguage();
  const activeBg = THEMES[theme] || THEMES.primary;
  return (
    <aside className="w-full lg:w-64 shrink-0">
      <nav className="card p-2 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onSelect(item.key)}
            className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium whitespace-nowrap transition ${
              active === item.key
                ? `${activeBg} text-white shadow-sm`
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span>{item.icon}</span>
            <span>{t(item.labelKey)}</span>
            {item.badge > 0 && (
              <span className={`ml-auto rounded-full px-2 text-xs font-bold ${active === item.key ? 'bg-white/20' : 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'}`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
