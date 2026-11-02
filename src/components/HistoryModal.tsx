import React, { useState } from 'react';
import { Calendar, Search, Trash2, Copy, ArrowRight, X, Clock, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { ListSession } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ListSession[];
  currentDate: string;
  onSelectSession: (dateString: string) => void;
  onDuplicateSession: (sourceSession: ListSession, targetDate: string, onlyUncompleted: boolean) => void;
  onDeleteSession: (sessionId: string, dateString: string) => void;
  onExportText: (session: ListSession) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  currentDate,
  onSelectSession,
  onDuplicateSession,
  onDeleteSession,
  onExportText,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [duplicateModalSession, setDuplicateModalSession] = useState<ListSession | null>(null);
  const [targetDuplicateDate, setTargetDuplicateDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [onlyUncompleted, setOnlyUncompleted] = useState(false);

  if (!isOpen) return null;

  // Format date helper
  const formatReadableDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Filter sessions by search query (item name or date string)
  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    if (session.listDate.includes(q)) return true;
    if (session.title?.toLowerCase().includes(q)) return true;
    const dateFormatted = formatReadableDate(session.listDate).toLowerCase();
    if (dateFormatted.includes(q)) return true;
    // Check if any item matches
    return session.items.some(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.amount?.toLowerCase().includes(q) ||
        item.note?.toLowerCase().includes(q)
    );
  });

  const handleConfirmDuplicate = () => {
    if (!duplicateModalSession) return;
    onDuplicateSession(duplicateModalSession, targetDuplicateDate, onlyUncompleted);
    setDuplicateModalSession(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-stone-900/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-modal-title"
    >
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-xl border border-stone-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
          <div>
            <h2 id="history-modal-title" className="text-base font-bold text-stone-900">
              List History
            </h2>
            <p className="text-xs text-stone-500">
              Review, restore, or export previous grocery sessions
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            aria-label="Close history modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-stone-100 bg-stone-50/60">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history by item name, note, or date..."
              className="w-full h-10 pl-9 pr-4 text-xs sm:text-sm bg-white rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-600 transition-all placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5">
          {filteredSessions.length === 0 ? (
            <div className="py-12 text-center text-stone-500 space-y-2">
              <Clock className="w-10 h-10 mx-auto text-stone-300 stroke-1" />
              <p className="text-sm font-medium text-stone-700">
                {searchQuery ? 'No matching lists found' : 'No saved lists yet'}
              </p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                {searchQuery
                  ? 'Try searching for a different item name or date.'
                  : 'Items you record will be automatically saved here grouped by date.'}
              </p>
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isCurrent = session.listDate === currentDate;
              const totalItems = session.items.length;
              const completedCount = session.items.filter((i) => i.isCompleted).length;

              return (
                <div
                  key={session.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-2xs'
                      : 'bg-white hover:bg-stone-50/80 border-stone-200 shadow-2xs'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Session title / date */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-stone-900">
                          {formatReadableDate(session.listDate)}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-semibold tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                            Currently Viewing
                          </span>
                        )}
                        {session.title && (
                          <span className="text-xs text-stone-500 font-medium">
                            · {session.title}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                        <span className="tabular-nums">
                          {totalItems} {totalItems === 1 ? 'item' : 'items'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1 text-emerald-700 tabular-nums">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {completedCount} checked
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Open session */}
                      <button
                        onClick={() => {
                          onSelectSession(session.listDate);
                          onClose();
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1"
                        title="Open this list"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {/* Duplicate / Restore to another date (P1 requirement) */}
                      <button
                        onClick={() => {
                          setDuplicateModalSession(session);
                          setTargetDuplicateDate(new Date().toISOString().split('T')[0]);
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-stone-700 hover:bg-stone-100 border border-stone-200 transition-colors flex items-center gap-1"
                        title="Duplicate or restore items to another date"
                      >
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                        <span className="hidden sm:inline">Restore / Copy</span>
                      </button>

                      {/* Export Text */}
                      <button
                        onClick={() => onExportText(session)}
                        className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Export as formatted text"
                        aria-label="Export list as text"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {/* Delete Session */}
                      <button
                        onClick={() => setConfirmDeleteId(session.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete this session"
                        aria-label="Delete session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Items Preview Chips */}
                  {totalItems > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-wrap gap-1.5 items-center">
                      {session.items.slice(0, 6).map((item) => (
                        <span
                          key={item.id}
                          className={`text-[11px] px-2 py-0.5 rounded-md ${
                            item.isCompleted
                              ? 'bg-stone-100 text-stone-400 line-through'
                              : 'bg-stone-100 text-stone-700 font-medium'
                          }`}
                        >
                          {item.name} {item.amount ? `(${item.amount})` : ''}
                        </span>
                      ))}
                      {totalItems > 6 && (
                        <span className="text-[11px] text-stone-400 font-medium">
                          +{totalItems - 6} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Confirmation for Delete Session */}
                  {confirmDeleteId === session.id && (
                    <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>
                          Are you sure you want to delete the list for{' '}
                          <strong>{formatReadableDate(session.listDate)}</strong>?
                        </span>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 rounded bg-white text-stone-700 border border-stone-200 font-medium hover:bg-stone-100"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onDeleteSession(session.id, session.listDate);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700"
                        >
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
          <span>{sessions.length} total saved sessions</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Duplicate / Restore Sub-Dialog */}
      {duplicateModalSession && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-stone-900">
                Restore / Duplicate List
              </h3>
              <button
                onClick={() => setDuplicateModalSession(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600">
              Copy items from{' '}
              <strong>{formatReadableDate(duplicateModalSession.listDate)}</strong> into a new date session. The original list will not be modified.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={targetDuplicateDate}
                  onChange={(e) => setTargetDuplicateDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-700">
                <input
                  type="checkbox"
                  checked={onlyUncompleted}
                  onChange={(e) => setOnlyUncompleted(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Only copy uncompleted items (skip checked off ones)</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDuplicateModalSession(null)}
                className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDuplicate}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs"
              >
                Restore to {targetDuplicateDate}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
