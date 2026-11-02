import React, { useState, useRef, useEffect } from 'react';
import {
  Carrot,
  Apple,
  Egg,
  Utensils,
  Croissant,
  Sparkles,
  Coffee,
  ShoppingBag,
  Check,
  ChevronDown,
} from 'lucide-react';
import { ProduceCategory, COMMON_CATEGORIES } from '../types';
import { haptic } from '@zakisheriff/liquid-glass';

interface CategoryConfig {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  badgeBgLight: string;
  badgeBgDark: string;
}

export const CATEGORY_CONFIG: Record<ProduceCategory, CategoryConfig> = {
  Vegetables: {
    icon: Carrot,
    accentColor: '#16a34a',
    badgeBgLight: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
    badgeBgDark: 'dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  },
  Fruits: {
    icon: Apple,
    accentColor: '#e11d48',
    badgeBgLight: 'bg-rose-500/15 text-rose-800 border-rose-500/30',
    badgeBgDark: 'dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
  },
  'Dairy & Eggs': {
    icon: Egg,
    accentColor: '#d97706',
    badgeBgLight: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
    badgeBgDark: 'dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  },
  'Pantry & Spices': {
    icon: Utensils,
    accentColor: '#ea580c',
    badgeBgLight: 'bg-orange-500/15 text-orange-800 border-orange-500/30',
    badgeBgDark: 'dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
  },
  'Bakery & Bread': {
    icon: Croissant,
    accentColor: '#b45309',
    badgeBgLight: 'bg-yellow-600/15 text-yellow-900 border-yellow-600/30',
    badgeBgDark: 'dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30',
  },
  'Household & Cleaning': {
    icon: Sparkles,
    accentColor: '#7c3aed',
    badgeBgLight: 'bg-purple-500/15 text-purple-800 border-purple-500/30',
    badgeBgDark: 'dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
  },
  Beverages: {
    icon: Coffee,
    accentColor: '#0284c7',
    badgeBgLight: 'bg-sky-500/15 text-sky-800 border-sky-500/30',
    badgeBgDark: 'dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30',
  },
  Other: {
    icon: ShoppingBag,
    accentColor: '#64748b',
    badgeBgLight: 'bg-stone-500/15 text-stone-800 border-stone-500/30',
    badgeBgDark: 'dark:bg-stone-500/20 dark:text-stone-300 dark:border-stone-500/30',
  },
};

interface CategoryPickerProps {
  value: ProduceCategory;
  onChange: (category: ProduceCategory) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({
  value,
  onChange,
  className = '',
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeConfig = CATEGORY_CONFIG[value] || CATEGORY_CONFIG.Other;
  const ActiveIcon = activeConfig.icon;

  const handleSelect = (category: ProduceCategory) => {
    haptic();
    onChange(category);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Category Glass Pill Trigger */}
      <button
        type="button"
        onClick={() => {
          haptic();
          setIsOpen(!isOpen);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Category: ${value}. Click to change.`}
        className={`group inline-flex items-center gap-2 rounded-xl border transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
          size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        } bg-white/75 dark:bg-stone-900/70 hover:bg-white dark:hover:bg-stone-900 border-stone-200/80 dark:border-white/15 text-stone-800 dark:text-stone-100 shadow-2xs backdrop-blur-md`}
      >
        <span
          className="flex items-center justify-center w-5 h-5 rounded-lg shrink-0 transition-transform group-hover:scale-105"
          style={{ backgroundColor: `${activeConfig.accentColor}20` }}
        >
          <ActiveIcon className="w-3.5 h-3.5" style={{ color: activeConfig.accentColor }} />
        </span>
        <span className="font-semibold tracking-tight">{value}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-stone-400 dark:text-stone-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Liquid Glass Dropdown Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Produce Categories"
          className="absolute right-0 top-full mt-1.5 z-50 w-56 p-1.5 rounded-2xl bg-white/90 dark:bg-stone-900/90 backdrop-blur-2xl border border-stone-200/80 dark:border-white/15 shadow-xl space-y-0.5 animate-fadeIn"
        >
          <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Select Category
          </div>

          <div className="max-h-64 overflow-y-auto space-y-0.5 py-0.5 pr-0.5">
            {COMMON_CATEGORIES.map((cat) => {
              const isSelected = cat === value;
              const config = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.Other;
              const Icon = config.icon;

              return (
                <button
                  key={cat}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(cat)}
                  className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-colors text-left cursor-pointer focus:outline-none focus:bg-emerald-50 dark:focus:bg-emerald-950/40 ${
                    isSelected
                      ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-semibold'
                      : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100/80 dark:hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${config.accentColor}20` }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: config.accentColor }} />
                    </span>
                    <span className="truncate">{cat}</span>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
