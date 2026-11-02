import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Check, AlertCircle } from 'lucide-react';
import { GlassSheet, GlassButton, GlassInput, haptic } from '@zakisheriff/liquid-glass';
import { voiceService, isSpeechRecognitionSupported, parseSpokenGrocery, ParsedVoiceResult } from '../services/voiceRecognition';
import { ProduceCategory } from '../types';
import { CategoryPicker } from './CategoryPicker';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: { name: string; amount?: string; note?: string; category?: string }) => void;
}

export const VoiceModal: React.FC<VoiceModalProps> = ({ isOpen, onClose, onSaveItem }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<ProduceCategory>('Vegetables');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const supported = isSpeechRecognitionSupported();
      setIsSupported(supported);
      setTranscript('');
      setName('');
      setAmount('');
      setNote('');
      setErrorMessage(null);

      if (supported) {
        startVoiceCapture();
      } else {
        setErrorMessage('Voice input is not available in this browser. You can type your item instead.');
      }
    } else {
      voiceService.stopListening();
      setIsListening(false);
    }

    return () => {
      voiceService.stopListening();
    };
  }, [isOpen]);

  const startVoiceCapture = () => {
    setErrorMessage(null);
    setTranscript('');
    voiceService.startListening({
      onInterim: (text) => {
        setTranscript(text);
      },
      onFinal: (result: ParsedVoiceResult) => {
        haptic();
        setTranscript(result.rawTranscript);
        setName(result.name);
        setAmount(result.amount);
        if (result.note) setNote(result.note);

        // Auto categorize based on spoken produce
        const lower = result.name.toLowerCase();
        if (lower.match(/apple|banana|mango|berry|orange|lemon|lime|grape|peach|melon/)) {
          setCategory('Fruits');
        } else if (lower.match(/milk|cheese|butter|egg|yogurt|curd|cream/)) {
          setCategory('Dairy & Eggs');
        } else if (lower.match(/bread|croissant|bagel|bun|loaf|tortilla/)) {
          setCategory('Bakery & Bread');
        } else if (lower.match(/soap|detergent|paper|cleaner|sponge|trash/)) {
          setCategory('Household & Cleaning');
        } else if (lower.match(/rice|pasta|oil|salt|sugar|flour|spice|sauce|can/)) {
          setCategory('Pantry & Spices');
        } else if (lower.match(/water|juice|coffee|tea|soda/)) {
          setCategory('Beverages');
        } else {
          setCategory('Vegetables');
        }
      },
      onError: (msg) => {
        setErrorMessage(msg);
        setIsListening(false);
      },
      onStatusChange: (status) => {
        setIsListening(status === 'listening');
      },
    });
  };

  const handleStopListening = () => {
    haptic();
    voiceService.stopListening();
    setIsListening(false);
    if (transcript.trim() && !name.trim()) {
      const parsed = parseSpokenGrocery(transcript);
      setName(parsed.name);
      setAmount(parsed.amount);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please specify an item name before saving.');
      return;
    }
    haptic();
    onSaveItem({
      name: name.trim(),
      amount: amount.trim() || undefined,
      note: note.trim() || undefined,
      category,
    });
    onClose();
  };

  return (
    <GlassSheet open={isOpen} onClose={onClose} aria-label="Voice Capture Modal">
      <div className="p-6 max-w-lg mx-auto space-y-5 text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
            Voice Capture
          </h2>
          <p className="text-xs text-stone-600 dark:text-stone-400">
            Speak naturally (e.g. &ldquo;2 kg tomatoes&rdquo; or &ldquo;1 bunch fresh mint&rdquo;)
          </p>
        </div>

        {/* Dynamic Waveform Visualizer & Mic Button */}
        <div className="flex flex-col items-center justify-center py-6 px-4 bg-white/70 dark:bg-white/5 rounded-2xl border border-stone-200/80 dark:border-white/10 space-y-4">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring while listening */}
            {isListening && (
              <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
            )}
            <GlassButton
              type="button"
              variant={isListening ? 'destructive' : 'filled'}
              tint={isListening ? '#ef4444' : '#15803d'}
              size="lg"
              className="w-16 h-16 rounded-full flex items-center justify-center"
              onClick={isListening ? handleStopListening : startVoiceCapture}
              disabled={!isSupported}
              icon={
                isListening ? (
                  <MicOff className="w-7 h-7 text-white" />
                ) : (
                  <Mic className="w-7 h-7 text-white" />
                )
              }
              aria-label={isListening ? 'Stop listening' : 'Start listening'}
            />
          </div>

          {/* Audio Waveform visualization */}
          <div className="flex items-center gap-1.5 h-6">
            {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isListening
                    ? 'bg-emerald-500'
                    : 'bg-stone-300 dark:bg-stone-600'
                }`}
                style={{
                  height: isListening ? `${Math.max(6, (h * Math.sin(Date.now() / 200 + i)) % 24)}px` : '4px',
                }}
              />
            ))}
          </div>

          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            {isListening ? 'Listening... tap mic to stop' : 'Tap microphone to speak'}
          </p>

          {transcript && (
            <div className="w-full text-center p-2.5 bg-white/85 dark:bg-black/40 rounded-xl text-sm italic text-stone-900 dark:text-stone-100 border border-stone-200/80 dark:border-white/10 font-medium">
              &ldquo;{transcript}&rdquo;
            </div>
          )}
        </div>

        {/* Error / Fallback Banner */}
        {errorMessage && (
          <div className="p-3 bg-amber-500/15 border border-amber-500/25 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Review & Edit Fields */}
        <form onSubmit={handleSave} className="space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              Review Before Saving
            </span>
            <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Editable</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
              Item Name <span className="text-rose-500">*</span>
            </label>
            <GlassInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Heirloom Tomatoes"
              tint="#15803d"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                Amount / Quantity
              </label>
              <GlassInput
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 2 kg, 1 dozen"
                tint="#15803d"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
                Category
              </label>
              <CategoryPicker
                value={category}
                onChange={setCategory}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 dark:text-stone-200 mb-1">
              Optional Note
            </label>
            <GlassInput
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Organic, check expiry"
              tint="#15803d"
            />
          </div>

          {/* Privacy Notice */}
          <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed pt-1">
            <strong>Privacy:</strong> Voice recognition processes through your device browser. All grocery lists remain safely in local storage.
          </p>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <GlassButton
              type="button"
              variant="clear"
              size="md"
              onClick={onClose}
            >
              <span className="text-stone-800 dark:text-stone-200 font-medium">Cancel</span>
            </GlassButton>
            <GlassButton
              type="submit"
              variant="filled"
              tint="#15803d"
              size="md"
              disabled={!name.trim()}
              icon={<Check className="w-4 h-4 text-white" />}
            >
              <span className="font-semibold text-white">Save Item</span>
            </GlassButton>
          </div>
        </form>
      </div>
    </GlassSheet>
  );
};
