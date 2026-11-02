import React, { useState } from 'react';
import {
  Calendar,
  Search,
  Trash2,
  Copy,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { GlassCard, GlassButton, GlassInput, GlassSheet, haptic } from '@zakisheriff/liquid-glass';
import { ListSession } from '../types';
import { downloadCsv } from '../services/csvExport';

interface HistoryViewProps {
  sessions: ListSession[];
  currentDate: string;
  todayDate: string;
  onSelectSession: (dateString: string) => void;
  onDuplicateSession: (sourceSession: ListSession, targetDate: string, onlyUncompleted: boolean) => void;
  onDeleteSession: (sessionId: string, dateString: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  sessions,
  currentDate,
  todayDate,
  onSelectSession,
  onDuplicateSession,
  onDeleteSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [duplicateModalSession, setDuplicateModalSession] = useState<ListSession | null>(null);
  const [targetDuplicateDate, setTargetDuplicateDate] = useState(todayDate);
  const [onlyUncompleted, setOnlyUncompleted] = useState(false);

  const formatReadableDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (session.listDate.includes(q)) return true;
    if (session.title?.toLowerCase().includes(q)) return true;
    const dateFormatted = formatReadableDate(session.listDate).toLowerCase();
    if (dateFormatted.includes(q)) return true;
    return session.items.some(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.amount?.toLowerCase().includes(q) ||
        item.note?.toLowerCase().includes(q)
    );
  });

  const handleConfirmDuplicate = () => {
    if (!duplicateModalSession) return;
    haptic();
    onDuplicateSession(duplicateModalSession, targetDuplicateDate, onlyUncompleted);
    setDuplicateModalSession(null);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16 animate-fadeIn">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            List History & Archive
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
            Review, restore, or export previous grocery sessions
          </p>
        </div>

        <GlassButton
          variant="tinted"
          tint="#15803d"
          size="sm"
          icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
          onClick={() => {
            haptic();
            downloadCsv(sessions);
          }}
        >
          <span className="font-semibold text-emerald-900 dark:text-emerald-300">Export History CSV</span>
        </GlassButton>
      </div>

      {/* Search Input with GlassInput */}
      <GlassCard padding="14px 18px" radius="20px">
        <GlassInput
          type="search"
          placeholder="Search history by item name, quantity, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery('')}
          icon={<Search className="w-4 h-4 text-stone-500 dark:text-stone-400" />}
          tint="#15803d"
          className="w-full"
        />
      </GlassCard>

      {/* History Cards */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <GlassCard padding="32px 24px" radius="24px" className="text-center space-y-2">
            <Clock className="w-8 h-8 mx-auto text-stone-400" />
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              {searchQuery ? 'No matching lists found' : 'No saved lists yet'}
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Try searching for a different item name or date.'
                : 'Every grocery session you record will be automatically archived here grouped by date.'}
            </p>
          </GlassCard>
        ) : (
          filteredSessions.map((session) => {
            const isSelected = session.listDate === currentDate;
            const isToday = session.listDate === todayDate;
            const totalItems = session.items.length;
            const completedCount = session.items.filter((i) => i.isCompleted).length;

            return (
              <GlassCard
                key={session.id}
                padding="20px"
                radius="24px"
                className={`space-y-3 transition-all ${
                  isSelected ? 'ring-2 ring-emerald-500/60' : 'hover:scale-[1.006]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base font-bold text-stone-900 dark:text-stone-100">
                        {formatReadableDate(session.listDate)}
                      </span>
                      {isToday && (
                        <span className="text-[10px] font-bold tracking-wider text-emerald-900 dark:text-emerald-200 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                          Today
                        </span>
                      )}
                      {isSelected && !isToday && (
                        <span className="text-[10px] font-bold tracking-wider text-amber-900 dark:text-amber-200 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full uppercase">
                          Active View
                        </span>
                      )}
                      {session.title && (
                        <span className="text-xs text-stone-600 dark:text-stone-400 font-semibold">
                          · {session.title}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-400 mt-1 font-medium">
                      <span className="tabular-nums font-semibold text-stone-800 dark:text-stone-200">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 tabular-nums font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {completedCount} purchased
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <GlassButton
                      variant="filled"
                      tint="#15803d"
                      size="sm"
                      onClick={() => {
                        haptic();
                        onSelectSession(session.listDate);
                      }}
                      icon={<ArrowRight className="w-3.5 h-3.5 text-white" />}
                    >
                      <span className="font-semibold text-white">Open List</span>
                    </GlassButton>

                    <GlassButton
                      variant="tinted"
                      size="sm"
                      onClick={() => {
                        haptic();
                        setDuplicateModalSession(session);
                        setTargetDuplicateDate(todayDate);
                      }}
                      icon={<Copy className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />}
                    >
                      <span className="text-stone-800 dark:text-stone-200 font-medium">Restore to Date</span>
                    </GlassButton>

                    <GlassButton
                      variant="clear"
                      destructive
                      size="sm"
                      onClick={() => {
                        haptic();
                        setConfirmDeleteId(session.id);
                      }}
                      icon={<Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                      aria-label="Delete list session"
                    />
                  </div>
                </div>

                {/* Items Preview Chips */}
                {totalItems > 0 && (
                  <div className="pt-2 border-t border-stone-200/70 dark:border-white/10 flex flex-wrap gap-1.5 items-center">
                    {session.items.slice(0, 7).map((item) => (
                      <span
                        key={item.id}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full ${
                          item.isCompleted
                            ? 'bg-stone-200/70 dark:bg-white/5 text-stone-500 dark:text-stone-400 line-through'
                            : 'bg-white/80 dark:bg-white/10 text-stone-800 dark:text-stone-200 font-medium border border-stone-300/60 dark:border-white/10'
                        }`}
                      >
                        {item.name} {item.amount ? `(${item.amount})` : ''}
                      </span>
                    ))}
                    {totalItems > 7 && (
                      <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                        +{totalItems - 7} more
                      </span>
                    )}
                  </div>
                )}

                {/* Confirm Delete Banner */}
                {confirmDeleteId === session.id && (
                  <div className="mt-3 p-3 bg-rose-500/15 border border-rose-500/25 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 animate-fadeIn">
                    <div className="flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200 font-medium">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>
                        Are you sure you want to delete the list for{' '}
                        <strong>{formatReadableDate(session.listDate)}</strong>?
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GlassButton
                        variant="clear"
                        size="sm"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        <span className="text-stone-700 dark:text-stone-300">Cancel</span>
                      </GlassButton>
                      <GlassButton
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          haptic();
                          onDeleteSession(session.id, session.listDate);
                          setConfirmDeleteId(null);
                        }}
                      >
                        Confirm Delete
                      </GlassButton>
                    </div>
                  </div>
                )}
              </GlassCard>
            );
          })
        )}
      </div>

      {/* Duplicate / Restore Dialog with GlassSheet */}
      {duplicateModalSession && (
        <GlassSheet
          open={!!duplicateModalSession}
          onClose={() => setDuplicateModalSession(null)}
          aria-label="Restore List Dialog"
        >
          <div className="p-6 max-w-md mx-auto space-y-4 text-stone-900 dark:text-stone-100">
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              Restore / Duplicate List
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Copy items from <strong>{formatReadableDate(duplicateModalSession.listDate)}</strong> into a new date session. The original list will not be mutated.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={targetDuplicateDate}
                  onChange={(e) => setTargetDuplicateDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-black/40 text-stone-900 dark:text-stone-100 border border-stone-300/70 dark:border-white/15 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-stone-800 dark:text-stone-200 font-medium cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyUncompleted}
                  onChange={(e) => setOnlyUncompleted(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Only copy uncompleted items (skip checked items)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <GlassButton
                variant="clear"
                size="md"
                onClick={() => setDuplicateModalSession(null)}
              >
                <span className="text-stone-700 dark:text-stone-300 font-medium">Cancel</span>
              </GlassButton>
              <GlassButton
                variant="filled"
                tint="#15803d"
                size="md"
                onClick={handleConfirmDuplicate}
              >
                <span className="font-semibold text-white">Restore to {targetDuplicateDate}</span>
              </GlassButton>
            </div>
          </div>
        </GlassSheet>
      )}
    </div>
  );
};
