import React, { useState } from 'react';
import { Copy, Check, Download, Upload, FileText, Database, X } from 'lucide-react';
import { GlassSheet, haptic } from '@zakisheriff/liquid-glass';
import { ListSession } from '../types';
import { dbService } from '../services/db';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: ListSession | null;
  onDataImported: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentSession,
  onDataImported,
}) => {
  const [copiedText, setCopiedText] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [activeTabIdx, setActiveTabIdx] = useState<number>(0);

  if (!isOpen) return null;

  // Generate clean formatted text for the grocery list
  const generateFormattedText = () => {
    if (!currentSession || currentSession.items.length === 0) {
      return 'No items in this list.';
    }

    const dateHeader = `🛒 Grocery List - ${currentSession.listDate}${
      currentSession.title ? ` (${currentSession.title})` : ''
    }\n`;

    const pendingItems = currentSession.items.filter((i) => !i.isCompleted);
    const completedItems = currentSession.items.filter((i) => i.isCompleted);

    let result = dateHeader;

    if (pendingItems.length > 0) {
      result += '\nNeed to buy:\n';
      pendingItems.forEach((item) => {
        const qty = item.amount ? ` [${item.amount}]` : '';
        const note = item.note ? ` - ${item.note}` : '';
        result += `• ${item.name}${qty}${note}\n`;
      });
    }

    if (completedItems.length > 0) {
      result += '\nPurchased:\n';
      completedItems.forEach((item) => {
        const qty = item.amount ? ` [${item.amount}]` : '';
        result += `✓ ${item.name}${qty}\n`;
      });
    }

    return result.trim();
  };

  const textContent = generateFormattedText();

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(textContent);
      setCopiedText(true);
      haptic();
      setTimeout(() => setCopiedText(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleDownloadTxt = () => {
    haptic();
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `groceries_${currentSession?.listDate || 'list'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = async () => {
    try {
      haptic();
      const jsonStr = await dbService.exportBackupJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `grocery_note_taker_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    haptic();
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const res = await dbService.importBackupJSON(content);
        setImportStatus(`Successfully restored ${res.count} list sessions!`);
        onDataImported();
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err) {
        setImportStatus(`Import failed: ${err instanceof Error ? err.message : 'Invalid JSON file'}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <GlassSheet open={isOpen} onClose={onClose} aria-label="Export & Share Grocery List">
      <div className="p-4 sm:p-6 space-y-5 max-w-lg mx-auto text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100">
              Share & Archive List
            </h2>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              Copy formatted items or manage complete JSON backups
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-stone-200/80 dark:border-white/10 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* Tab Controls: Bulletproof Liquid Glass Segmented Bar */}
        <div className="flex justify-center">
          <div className="w-full max-w-xs p-1 rounded-2xl bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                haptic();
                setActiveTabIdx(0);
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTabIdx === 0
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Shareable Text</span>
            </button>

            <button
              type="button"
              onClick={() => {
                haptic();
                setActiveTabIdx(1);
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTabIdx === 1
                  ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 shadow-sm'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Backup & JSON</span>
            </button>
          </div>
        </div>

        {/* Tab 0: Shareable Text */}
        {activeTabIdx === 0 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/15 shadow-sm space-y-2">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Formatted for SMS, WhatsApp & Notes
              </label>
              <textarea
                readOnly
                value={textContent}
                rows={8}
                className="w-full p-3 font-mono text-xs rounded-xl bg-black/5 dark:bg-black/40 border border-stone-300/80 dark:border-white/15 text-stone-900 dark:text-stone-100 focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-stone-800 dark:text-stone-200 bg-white/85 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-stone-300/80 dark:border-white/15 transition-all shadow-2xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-stone-600 dark:text-stone-300" />
                <span>Download .txt</span>
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Backup & JSON */}
        {activeTabIdx === 1 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Card 1: Export JSON */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/15 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Download Full JSON Backup
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Complete offline archive of all your saved dates and grocery sessions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>

            {/* Card 2: Restore JSON */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border border-stone-200/80 dark:border-white/15 shadow-sm">
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Restore From Backup File
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    Select a previously downloaded JSON file to merge or restore your lists.
                  </p>
                </div>

                <label className="inline-block cursor-pointer">
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white/85 dark:bg-stone-800/90 text-stone-800 dark:text-stone-100 border border-stone-300/80 dark:border-white/15 hover:bg-white dark:hover:bg-stone-800 transition-colors shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
                    Select JSON File
                  </span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Import Status Message */}
            {importStatus && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/25 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-semibold text-center animate-fadeIn">
                {importStatus}
              </div>
            )}
          </div>
        )}
      </div>
    </GlassSheet>
  );
};
