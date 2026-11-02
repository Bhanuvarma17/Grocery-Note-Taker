import React, { useState } from 'react';
import { Plus, Mic, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, haptic } from '@zakisheriff/liquid-glass';
import { ProduceCategory, QUICK_AMOUNTS } from '../types';
import { CategoryPicker } from './CategoryPicker';

interface AddProduceBarProps {
  onAddItem: (item: { name: string; amount?: string; note?: string; category?: string }) => void;
  onOpenVoice: () => void;
}

export const AddProduceBar: React.FC<AddProduceBarProps> = ({ onAddItem, onOpenVoice }) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<ProduceCategory>('Vegetables');
  const [showNoteField, setShowNoteField] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setValidationError('Please enter an item name (e.g. Tomatoes, Eggs, Milk).');
      return;
    }

    setValidationError(null);
    haptic();
    onAddItem({
      name: trimmedName,
      amount: amount.trim() || undefined,
      note: note.trim() || undefined,
      category,
    });

    // Reset input fields
    setName('');
    setAmount('');
    setNote('');
  };

  const handleQuickAmount = (chip: string) => {
    haptic();
    setAmount(chip);
  };

  return (
    <GlassCard padding="20px" radius="24px" className="w-full transition-all">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Main 1-Line Input Cluster */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Item Name Input with GlassInput */}
          <div className="flex-1 min-w-[200px]">
            <GlassInput
              placeholder="Add item (e.g., Heirloom Tomatoes, Oat Milk)..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (validationError && e.target.value.trim()) {
                  setValidationError(null);
                }
              }}
              onClear={() => setName('')}
              tint="#15803d"
              className="w-full"
            />
          </div>

          {/* Amount / Quantity Input with GlassInput */}
          <div className="w-full sm:w-44">
            <GlassInput
              placeholder="Qty (e.g. 2 kg, 1 bunch)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onClear={() => setAmount('')}
              tint="#15803d"
              trailing={
                <span title="Quantity or amount (not price)" className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-300 cursor-help pr-1">
                  <HelpCircle className="w-3.5 h-3.5" />
                </span>
              }
            />
          </div>

          {/* Action Buttons: Voice + Primary Add */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Voice Input Button */}
            <GlassButton
              type="button"
              variant="tinted"
              tint="#15803d"
              size="md"
              icon={<Mic className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />}
              onClick={() => {
                haptic();
                onOpenVoice();
              }}
              title="Speak item name and quantity"
              aria-label="Add item using microphone"
            >
              <span className="hidden sm:inline font-semibold text-emerald-900 dark:text-emerald-300">Voice</span>
            </GlassButton>

            {/* Primary Add Button */}
            <GlassButton
              type="submit"
              variant="filled"
              tint="#15803d"
              size="md"
              icon={<Plus className="w-4 h-4 text-white" />}
              aria-label="Add grocery item to list"
            >
              <span className="font-semibold text-white">Add</span>
            </GlassButton>
          </div>
        </div>

        {/* Inline Validation Feedback */}
        {validationError && (
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 pl-1">
            {validationError}
          </p>
        )}

        {/* Quick Amount Chips & Redesigned Category Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 text-xs">
          {/* Quick Amounts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-stone-600 dark:text-stone-400 font-semibold mr-0.5">Quick qty:</span>
            {QUICK_AMOUNTS.slice(0, 6).map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleQuickAmount(chip)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                  amount === chip
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : 'bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-stone-800 dark:text-stone-200 border border-stone-300/70 dark:border-white/15'
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Redesigned Category & Note Toggle */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Custom Apple Liquid Glass Category Picker */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-stone-600 dark:text-stone-400 font-semibold hidden sm:inline">Category:</span>
              <CategoryPicker value={category} onChange={setCategory} size="sm" />
            </div>

            <button
              type="button"
              onClick={() => {
                haptic();
                setShowNoteField(!showNoteField);
              }}
              className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 px-2.5 py-1.5 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/25 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>{showNoteField ? 'Hide Note' : '+ Note'}</span>
              {showNoteField ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Expandable Optional Note Field */}
        {showNoteField && (
          <div className="pt-1 animate-fadeIn">
            <GlassInput
              placeholder="Add optional note (e.g., ripe, organic only, 2% fat, for soup recipe)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onClear={() => setNote('')}
              tint="#15803d"
              className="w-full"
            />
          </div>
        )}
      </form>
    </GlassCard>
  );
};
