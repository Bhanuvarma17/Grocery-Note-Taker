import React, { useState } from 'react';
import { Trash2, Edit3, Clock, Check } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, haptic } from '@zakisheriff/liquid-glass';
import { Item, ProduceCategory } from '../types';
import { CategoryPicker, CATEGORY_CONFIG } from './CategoryPicker';

interface ItemRowProps {
  item: Item;
  onToggleComplete: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<Item>) => void;
  onDeleteItem: (id: string) => void;
}

export const ItemRow: React.FC<ItemRowProps> = ({
  item,
  onToggleComplete,
  onUpdateItem,
  onDeleteItem,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [editAmount, setEditAmount] = useState(item.amount || '');
  const [editNote, setEditNote] = useState(item.note || '');
  const [editCategory, setEditCategory] = useState<ProduceCategory>(
    (item.category as ProduceCategory) || 'Vegetables'
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    haptic();
    onUpdateItem(item.id, {
      name: editName.trim(),
      amount: editAmount.trim() || undefined,
      note: editNote.trim() || undefined,
      category: editCategory,
      updatedAt: new Date().toISOString(),
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditName(item.name);
    setEditAmount(item.amount || '');
    setEditNote(item.note || '');
    setEditCategory((item.category as ProduceCategory) || 'Vegetables');
    setIsEditing(false);
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const categoryCfg = CATEGORY_CONFIG[(item.category as ProduceCategory) || 'Other'] || CATEGORY_CONFIG.Other;
  const CategoryIcon = categoryCfg.icon;

  if (isEditing) {
    return (
      <GlassCard padding="18px" radius="22px" className="w-full">
        <form onSubmit={handleSaveEdit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Item Name <span className="text-rose-500">*</span>
              </label>
              <GlassInput
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Item name..."
                tint="#15803d"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Amount / Quantity
              </label>
              <GlassInput
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder="e.g. 2 kg, 1 dozen"
                tint="#15803d"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Note
              </label>
              <GlassInput
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder="Optional notes..."
                tint="#15803d"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Category
              </label>
              <CategoryPicker
                value={editCategory}
                onChange={setEditCategory}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <GlassButton
              type="button"
              variant="clear"
              size="sm"
              onClick={handleCancelEdit}
            >
              <span className="text-stone-700 dark:text-stone-300">Cancel</span>
            </GlassButton>
            <GlassButton
              type="submit"
              variant="filled"
              tint="#15803d"
              size="sm"
              disabled={!editName.trim()}
            >
              <span className="text-white font-semibold">Save Changes</span>
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      padding="14px 18px"
      radius="20px"
      className={`group relative flex items-center justify-between gap-3 transition-all ${
        item.isCompleted ? 'opacity-75 dark:opacity-60' : 'hover:scale-[1.004]'
      }`}
    >
      {/* Left side: Checkbox + Name + Details */}
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        {/* Apple Style Glass Check / Toggle */}
        <button
          type="button"
          onClick={() => {
            haptic();
            onToggleComplete(item.id);
          }}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0 -m-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full cursor-pointer"
          aria-label={item.isCompleted ? `Mark ${item.name} as uncompleted` : `Mark ${item.name} as completed`}
        >
          <div
            className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
              item.isCompleted
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'border-stone-400 dark:border-white/30 bg-white/80 dark:bg-white/10 hover:border-emerald-600 dark:hover:border-emerald-400'
            }`}
          >
            {item.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </div>
        </button>

        {/* Content Details */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {/* Item Name */}
            <span
              className={`text-sm font-semibold truncate ${
                item.isCompleted
                  ? 'line-through text-stone-500 dark:text-stone-500 font-normal'
                  : 'text-stone-900 dark:text-stone-100'
              }`}
            >
              {item.name}
            </span>

            {/* Flexible Amount string */}
            {item.amount && (
              <span
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full ${
                  item.isCompleted
                    ? 'text-stone-500 dark:text-stone-500 bg-stone-200/60 dark:bg-white/5'
                    : 'text-emerald-900 dark:text-emerald-200 bg-emerald-500/20 border border-emerald-500/30'
                }`}
                title="Quantity / Amount"
              >
                {item.amount}
              </span>
            )}

            {/* Category tag */}
            {item.category && (
              <span className="inline-flex items-center gap-1 text-[11px] text-stone-600 dark:text-stone-400 font-medium">
                <CategoryIcon className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                <span>{item.category}</span>
              </span>
            )}
          </div>

          {/* Optional Note */}
          {item.note && (
            <p
              className={`text-xs mt-0.5 truncate ${
                item.isCompleted ? 'text-stone-500 dark:text-stone-500 line-through' : 'text-stone-700 dark:text-stone-300 font-normal'
              }`}
            >
              {item.note}
            </p>
          )}

          {/* Created / Updated timestamp */}
          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 dark:text-stone-400 mt-1">
            <Clock className="w-3 h-3 text-stone-400 dark:text-stone-500 shrink-0" />
            <span className="tabular-nums">
              Added {formatTime(item.createdAt)}
              {item.updatedAt !== item.createdAt && (
                <> · edited {formatTime(item.updatedAt)}</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Right side: Action controls with GlassButton */}
      <div className="flex items-center gap-1 shrink-0">
        <GlassButton
          variant="clear"
          size="sm"
          icon={<Edit3 className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />}
          onClick={() => {
            haptic();
            setIsEditing(true);
          }}
          title="Edit item"
          aria-label={`Edit ${item.name}`}
        />

        <GlassButton
          variant="clear"
          destructive
          size="sm"
          icon={<Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
          onClick={() => {
            haptic();
            onDeleteItem(item.id);
          }}
          title="Delete item"
          aria-label={`Delete ${item.name}`}
        />
      </div>
    </GlassCard>
  );
};
