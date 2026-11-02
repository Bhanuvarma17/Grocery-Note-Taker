// Speech recognition wrapper and parser for grocery entries

export interface ParsedVoiceResult {
  name: string;
  amount: string;
  note?: string;
  rawTranscript: string;
}

// Check browser support
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

// Smart parser for spoken grocery items
// e.g. "two kg tomatoes" -> amount: "2 kg", name: "Tomatoes"
// "1 dozen organic eggs" -> amount: "1 dozen", name: "Organic eggs"
// "bunch of coriander" -> amount: "1 bunch", name: "Coriander"
// "three packets of pasta" -> amount: "3 packets", name: "Pasta"
export function parseSpokenGrocery(transcript: string): ParsedVoiceResult {
  const clean = transcript.trim();
  if (!clean) {
    return { name: '', amount: '', rawTranscript: '' };
  }

  let text = clean;
  let detectedAmount = '';

  // Number words mapping
  const wordToNum: Record<string, string> = {
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10',
    half: '0.5',
    'a half': '0.5',
    a: '1',
    an: '1',
  };

  // Replace common spoken number words at beginning
  // Regex for quantity patterns: e.g. "2 kg", "2 kilograms", "500 grams", "1 bunch of", "3 packets of"
  const amountRegex =
    /^((\d+(\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|half|a|an)\s*(kg|kgs|kilograms?|g|grams?|lbs?|pounds?|liters?|litres?|l|ml|milliliters?|bunch(?:es)?|dozen|packets?|packs?|bags?|bottles?|cans?|boxes?|pieces?|pcs?|heads?|stalks?|cloves?))\s*(?:of\s+)?(.+)$/i;

  const match = text.match(amountRegex);
  if (match) {
    let rawQty = match[1].toLowerCase();
    const rest = match[4].trim();

    // Normalize number word
    for (const [word, digit] of Object.entries(wordToNum)) {
      if (rawQty.startsWith(word + ' ')) {
        rawQty = rawQty.replace(word, digit);
        break;
      }
    }

    detectedAmount = rawQty;
    text = rest;
  } else {
    // Check if starts with "a bunch of", "a dozen", etc.
    const bunchMatch = /^(a\s+bunch|a\s+dozen|a\s+packet|a\s+bag|a\s+box|a\s+bottle)\s*(?:of\s+)?(.+)$/i.exec(text);
    if (bunchMatch) {
      detectedAmount = bunchMatch[1].replace(/^a\s+/i, '1 ');
      text = bunchMatch[2].trim();
    }
  }

  // Capitalize first letter of item name
  const formattedName = text.charAt(0).toUpperCase() + text.slice(1);

  return {
    name: formattedName,
    amount: detectedAmount,
    rawTranscript: clean,
  };
}

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceListenerCallbacks {
  onInterim: (text: string) => void;
  onFinal: (result: ParsedVoiceResult) => void;
  onError: (error: string, code?: string) => void;
  onStatusChange: (status: VoiceStatus) => void;
}

export class VoiceRecognitionService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private recognition: any = null;
  private isListening = false;

  constructor() {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public startListening(callbacks: VoiceListenerCallbacks): void {
    if (!this.recognition) {
      callbacks.onError('Voice input is not supported in this browser.', 'not_supported');
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }

    let finalTranscript = '';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onstart = () => {
      this.isListening = true;
      callbacks.onStatusChange('listening');
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      callbacks.onInterim(interim || finalTranscript);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      callbacks.onStatusChange('error');
      let msg = 'Could not recognize speech. Please try again or type instead.';
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        msg = 'Microphone permission was denied. Please allow microphone access in your browser address bar.';
      } else if (event.error === 'no-speech') {
        msg = 'No speech was detected. Tap mic to try again.';
      } else if (event.error === 'audio-capture') {
        msg = 'No microphone was found on your device.';
      }
      callbacks.onError(msg, event.error);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.recognition.onend = () => {
      this.isListening = false;
      callbacks.onStatusChange('idle');
      if (finalTranscript.trim()) {
        const parsed = parseSpokenGrocery(finalTranscript);
        callbacks.onFinal(parsed);
      }
    };

    try {
      this.recognition.start();
    } catch (e) {
      this.isListening = false;
      callbacks.onStatusChange('error');
      callbacks.onError('Could not start speech recognition: ' + (e instanceof Error ? e.message : 'Unknown error'));
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
  }
}

export const voiceService = new VoiceRecognitionService();
