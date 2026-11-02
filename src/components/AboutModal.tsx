import React, { useState } from 'react';
import { ShieldCheck, Info, Trash2, X, AlertTriangle, Check } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAllData: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  onClearAllData,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-50 border-b border-stone-200">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              About & Privacy
            </h2>
            <p className="text-xs text-stone-500">
              Local storage rules and speech recognition notice
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-stone-600 leading-relaxed max-h-[70vh] overflow-y-auto">
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <h3 className="text-xs font-bold text-stone-900">
              Account-Free & Local Storage
            </h3>
            <p>
              Grocery Note Taker saves all lists, items, and dates directly in your browser local IndexedDB and localStorage. No account creation is required, and your list entries are not stored on remote application servers.
            </p>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <h3 className="text-xs font-bold text-stone-900">
              Speech Recognition Notice
            </h3>
            <p>
              When using voice capture, speech is processed through your browser Web Speech API. Depending on your browser (such as Google Chrome or Apple Safari) and platform settings, the browser vendor may process voice recognition via their speech services. Microphone permission is requested only when you tap the mic button.
            </p>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5">
            <h3 className="text-xs font-bold text-stone-900">
              Data Retention & Clearing Notice
            </h3>
            <p>
              Because data is saved locally on your device, clearing your browser site data or history will wipe your lists. Use the <strong>Export & Backup</strong> option to download a JSON file if you wish to keep an archived copy.
            </p>
          </div>

          {/* Danger Zone */}
          <div className="pt-2 border-t border-stone-200">
            <h3 className="text-xs font-bold text-rose-700 mb-2">
              Data Management
            </h3>

            {!showClearConfirm ? (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="w-full px-4 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All Saved Lists & History</span>
              </button>
            ) : (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-900 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Are you sure? This will erase all past lists permanently.</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-3 py-1.5 text-xs bg-white text-stone-700 rounded-lg border border-stone-200 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearAllData();
                      setShowClearConfirm(false);
                      onClose();
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-2xs"
                  >
                    Yes, Erase Everything
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
