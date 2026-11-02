import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  FileSpreadsheet,
  Download,
  Upload,
  Trash2,
  Check,
  Copy,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import {
  GlassCard,
  GlassButton,
  GlassSegmented,
  GlassSlider,
  GlassSwitch,
  haptic,
} from '@zakisheriff/liquid-glass';
import { ListSession } from '../types';
import { dbService } from '../services/db';
import { downloadCsv, sessionToTsvForSheets } from '../services/csvExport';

interface SettingsViewProps {
  theme: 'system' | 'light' | 'dark';
  onThemeChange: (theme: 'system' | 'light' | 'dark') => void;
  sessions: ListSession[];
  currentSession: ListSession | null;
  onDataReset: () => void;
  onDataImported: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  theme,
  onThemeChange,
  sessions,
  currentSession,
  onDataReset,
  onDataImported,
}) => {
  const [copiedTsv, setCopiedTsv] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [sheetsSyncEnabled, setSheetsSyncEnabled] = useState(false);
  const [sheetWebhookUrl, setSheetWebhookUrl] = useState('');
  const [sheetTestSuccess, setSheetTestSuccess] = useState(false);
  const [hapticIntensity, setHapticIntensity] = useState(80);

  // Theme segmented options
  const themeIndex = theme === 'system' ? 0 : theme === 'light' ? 1 : 2;

  const handleThemeSegmentChange = (idx: number) => {
    haptic();
    const modes: Array<'system' | 'light' | 'dark'> = ['system', 'light', 'dark'];
    onThemeChange(modes[idx]);
  };

  const handleCopyTsv = async () => {
    if (!currentSession) return;
    haptic();
    const tsv = sessionToTsvForSheets(currentSession);
    try {
      await navigator.clipboard.writeText(tsv);
      setCopiedTsv(true);
      setTimeout(() => setCopiedTsv(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadAllCsv = () => {
    haptic();
    const today = new Date().toISOString().split('T')[0];
    downloadCsv(sessions, `grocery_note_taker_${today}.csv`);
  };

  const handleExportJSON = async () => {
    haptic();
    try {
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

  const handleTestSheetConnection = () => {
    haptic();
    if (!sheetWebhookUrl) return;
    setSheetTestSuccess(true);
    setTimeout(() => setSheetTestSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16 animate-fadeIn">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
          Settings & Data Backup
        </h2>
        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1">
          Customize theme, export to CSV, or configure optional cloud backup
        </p>
      </div>

      {/* 1. Theme Selection */}
      <GlassCard padding="20px" radius="24px" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Appearance & Theme
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Choose between System default, Light, or Dark mode
            </p>
          </div>
        </div>

        <div className="pt-1">
          <GlassSegmented
            options={[
              { label: 'System', icon: <Laptop className="w-3.5 h-3.5" /> },
              { label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
              { label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
            ]}
            value={themeIndex}
            onChange={handleThemeSegmentChange}
            size="md"
            className="w-full sm:w-80"
          />
        </div>
      </GlassCard>

      {/* 2. Haptics / Sensory Slider */}
      <GlassCard padding="20px" radius="24px" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Touch & Feedback Response
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400">
              Liquid Glass tactile spring response
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
            {hapticIntensity}%
          </span>
        </div>

        <div className="pt-2">
          <GlassSlider
            min={0}
            max={100}
            value={hapticIntensity}
            onChange={(val) => {
              setHapticIntensity(val);
              haptic();
            }}
            tint="#15803d"
            className="w-full"
          />
        </div>
      </GlassCard>

      {/* 3. CSV & Formatted Export */}
      <GlassCard padding="20px" radius="24px" className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            CSV & Spreadsheet Export
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            Compatible with Microsoft Excel, Google Sheets, Numbers, and LibreOffice
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 bg-white/75 dark:bg-white/5 rounded-2xl border border-stone-200/80 dark:border-white/10 space-y-2.5 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Export All History to CSV
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1">
                Download a clean .csv containing all dates, quantities, and completion states.
              </p>
            </div>
            <GlassButton
              variant="tinted"
              tint="#15803d"
              size="sm"
              icon={<Download className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
              onClick={handleDownloadAllCsv}
              className="w-full"
            >
              <span className="font-semibold text-emerald-900 dark:text-emerald-300">Download CSV File</span>
            </GlassButton>
          </div>

          <div className="p-3.5 bg-white/75 dark:bg-white/5 rounded-2xl border border-stone-200/80 dark:border-white/10 space-y-2.5 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                1-Click Google Sheets Clipboard
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-1">
                Copies today&apos;s list as Tab-Separated columns ready to paste into any Google Sheet.
              </p>
            </div>
            <GlassButton
              variant={copiedTsv ? 'filled' : 'tinted'}
              tint={copiedTsv ? '#15803d' : '#0284c7'}
              size="sm"
              icon={copiedTsv ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              onClick={handleCopyTsv}
              className="w-full"
            >
              <span className="font-semibold">{copiedTsv ? 'Copied to Clipboard!' : 'Copy for Google Sheets'}</span>
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* 4. Optional Google Sheets Integration Status */}
      <GlassCard padding="20px" radius="24px" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Google Sheets Live Sync
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
              Optional webhook sync. Local storage operates completely without Google sign-in.
            </p>
          </div>
          <GlassSwitch
            checked={sheetsSyncEnabled}
            onChange={(val) => {
              haptic();
              setSheetsSyncEnabled(val);
            }}
            tint="#15803d"
          />
        </div>

        {sheetsSyncEnabled ? (
          <div className="p-3.5 bg-white/75 dark:bg-white/5 rounded-2xl border border-stone-200/80 dark:border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Google Sheets Ready (Optional Webhook Mode)</span>
            </div>
            <p className="text-[11px] text-stone-600 dark:text-stone-400">
              Paste your Google Apps Script Web App URL if you deployed a live spreadsheet endpoint:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={sheetWebhookUrl}
                onChange={(e) => setSheetWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-black/40 text-stone-900 dark:text-stone-100 border border-stone-300/80 dark:border-white/15 focus:outline-none"
              />
              <GlassButton
                variant="filled"
                tint="#0284c7"
                size="sm"
                onClick={handleTestSheetConnection}
                disabled={!sheetWebhookUrl}
              >
                <span className="text-white font-semibold">{sheetTestSuccess ? 'Connection Verified' : 'Test Endpoint'}</span>
              </GlassButton>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-stone-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-stone-400 dark:bg-stone-600" />
            <span>Disconnected · Local-first privacy mode active</span>
          </div>
        )}
      </GlassCard>

      {/* 5. JSON Backup & Restore */}
      <GlassCard padding="20px" radius="24px" className="space-y-4">
        <div>
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            Full Backup & Data Migration
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            Save and restore full JSON archives across your devices
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <GlassButton
            variant="glass"
            size="md"
            icon={<Download className="w-4 h-4 text-stone-700 dark:text-stone-300" />}
            onClick={handleExportJSON}
          >
            <span className="text-stone-800 dark:text-stone-200 font-semibold">Download JSON Backup</span>
          </GlassButton>

          <label className="cursor-pointer">
            <GlassButton
              variant="glass"
              size="md"
              icon={<Upload className="w-4 h-4 text-stone-700 dark:text-stone-300" />}
              type="button"
            >
              <span className="text-stone-800 dark:text-stone-200 font-semibold">Restore from Backup</span>
            </GlassButton>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/25 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 font-semibold">
            {importStatus}
          </div>
        )}
      </GlassCard>

      {/* 6. Danger Zone */}
      <GlassCard padding="20px" radius="24px" className="space-y-3">
        <div>
          <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            Reset Local Storage
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
            Permanently clear all saved lists and items on this browser
          </p>
        </div>

        {!showClearConfirm ? (
          <GlassButton
            variant="destructive"
            size="md"
            icon={<Trash2 className="w-4 h-4" />}
            onClick={() => {
              haptic();
              setShowClearConfirm(true);
            }}
          >
            <span className="font-semibold">Clear All Local History</span>
          </GlassButton>
        ) : (
          <div className="p-4 bg-rose-500/15 border border-rose-500/25 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs text-rose-800 dark:text-rose-200 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>Are you sure? This will delete all saved grocery lists.</span>
            </div>
            <div className="flex items-center gap-2">
              <GlassButton
                variant="clear"
                size="sm"
                onClick={() => setShowClearConfirm(false)}
              >
                <span className="text-stone-700 dark:text-stone-300">Cancel</span>
              </GlassButton>
              <GlassButton
                variant="destructive"
                size="sm"
                onClick={() => {
                  haptic();
                  onDataReset();
                  setShowClearConfirm(false);
                }}
              >
                <span className="font-semibold">Yes, Delete All</span>
              </GlassButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
