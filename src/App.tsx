import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Calendar,
  Settings as SettingsIcon,
  RotateCcw,
  SlidersHorizontal,
  Check,
  Share2,
  Mic,
  FolderOpen,
  CalendarDays,
  Sparkles,
  X,
} from 'lucide-react';
import {
  LiquidGlassFilter,
  GlassNav,
  GlassButton,
  GlassCard,
  GlassSegmented,
  GlassSwitch,
  haptic,
} from '@zakisheriff/liquid-glass';

import { Item, ListSession } from './types';
import { dbService } from './services/db';
import { Produce3DHero } from './components/Produce3DHero';
import { AddProduceBar } from './components/AddProduceBar';
import { ItemRow } from './components/ItemRow';
import { VoiceModal } from './components/VoiceModal';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { ExportModal } from './components/ExportModal';
import { DatePickerPopover } from './components/DatePickerPopover';

function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatFullDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

interface PendingDeletion {
  item: Item;
  sessionId: string;
  listDate: string;
  originalIndex: number;
}

export default function App() {
  const todayStr = useMemo(() => getLocalDateString(), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [sessions, setSessions] = useState<ListSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ListSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Navigation tab: 0 = List (Home), 1 = History, 2 = Settings
  const [currentTab, setCurrentTab] = useState<number>(0);

  // Theme state: 'system' | 'light' | 'dark'
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('grocery_app_theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    } catch {
      // ignore
    }
    return 'system';
  });

  // Modals state
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Filter & Grouping preferences
  const [filterMode, setFilterMode] = useState<number>(0); // 0: All, 1: Need to buy, 2: Purchased
  const [groupByCategory, setGroupByCategory] = useState(false);

  // 12-Second Temporary Undo Delete notification state and timer
  const [pendingUndo, setPendingUndo] = useState<PendingDeletion | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
    };
  }, []);

  // Sync theme to <html> tag
  useEffect(() => {
    try {
      localStorage.setItem('grocery_app_theme', theme);
    } catch {
      // ignore
    }

    const applyTheme = () => {
      let resolved = theme;
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolved = prefersDark ? 'dark' : 'light';
      }
      document.documentElement.setAttribute('data-theme', resolved);
    };

    applyTheme();

    if (theme === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme]);

  // Initial load
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const all = await dbService.getAllSessions();

      if (all.length === 0) {
        // Seed initial lists
        const now = new Date().toISOString();
        const initialTodaySession: ListSession = {
          id: 'seed-today-' + Date.now(),
          listDate: todayStr,
          title: 'Daily Essentials',
          createdAt: now,
          updatedAt: now,
          items: [
            {
              id: 'item-1',
              name: 'Heirloom Tomatoes',
              amount: '2 kg',
              note: 'Ripe & firm for fresh salad',
              category: 'Vegetables',
              isCompleted: false,
              createdAt: now,
              updatedAt: now,
            },
            {
              id: 'item-2',
              name: 'Crisp Carrots',
              amount: '1 bunch',
              note: 'With green tops attached',
              category: 'Vegetables',
              isCompleted: false,
              createdAt: now,
              updatedAt: now,
            },
            {
              id: 'item-3',
              name: 'Oat Milk Barista',
              amount: '2 cartons',
              note: 'Unsweetened',
              category: 'Dairy & Eggs',
              isCompleted: true,
              createdAt: now,
              updatedAt: now,
            },
            {
              id: 'item-4',
              name: 'Free-range Eggs',
              amount: '1 dozen',
              category: 'Dairy & Eggs',
              isCompleted: true,
              createdAt: now,
              updatedAt: now,
            },
          ],
        };

        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const pastDateStr = getLocalDateString(twoDaysAgo);
        const pastNow = twoDaysAgo.toISOString();

        const pastSession: ListSession = {
          id: 'seed-past-' + Date.now(),
          listDate: pastDateStr,
          title: 'Farmers Market Run',
          createdAt: pastNow,
          updatedAt: pastNow,
          items: [
            {
              id: 'past-item-1',
              name: 'Fresh Spinach',
              amount: '1 bunch',
              category: 'Vegetables',
              isCompleted: true,
              createdAt: pastNow,
              updatedAt: pastNow,
            },
            {
              id: 'past-item-2',
              name: 'Sweet Bell Peppers',
              amount: '3 pieces',
              category: 'Vegetables',
              isCompleted: true,
              createdAt: pastNow,
              updatedAt: pastNow,
            },
            {
              id: 'past-item-3',
              name: 'Artisan Sourdough',
              amount: '1 loaf',
              category: 'Bakery & Bread',
              isCompleted: true,
              createdAt: pastNow,
              updatedAt: pastNow,
            },
          ],
        };

        await dbService.saveSession(initialTodaySession);
        await dbService.saveSession(pastSession);

        setSessions([initialTodaySession, pastSession]);
        setCurrentSession(initialTodaySession);
      } else {
        setSessions(all);
        const found = all.find((s) => s.listDate === selectedDate);
        if (found) {
          setCurrentSession(found);
        } else {
          const now = new Date().toISOString();
          const newSession: ListSession = {
            id: 'session-' + Date.now(),
            listDate: selectedDate,
            createdAt: now,
            updatedAt: now,
            items: [],
          };
          setCurrentSession(newSession);
        }
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, todayStr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    const found = sessions.find((s) => s.listDate === newDate);
    if (found) {
      setCurrentSession(found);
    } else {
      const now = new Date().toISOString();
      const newSession: ListSession = {
        id: 'session-' + Date.now(),
        listDate: newDate,
        createdAt: now,
        updatedAt: now,
        items: [],
      };
      setCurrentSession(newSession);
    }
  };

  const stepDate = (days: number) => {
    haptic();
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    handleDateChange(getLocalDateString(date));
  };

  const persistSession = async (sessionToSave: ListSession) => {
    setSaveStatus('saving');
    try {
      await dbService.saveSession(sessionToSave);
      setSessions((prev) => {
        const index = prev.findIndex((s) => s.id === sessionToSave.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = sessionToSave;
          return updated;
        } else {
          return [sessionToSave, ...prev];
        }
      });
      setSaveStatus('saved');
    } catch (err) {
      console.error('Persistence failure:', err);
      setSaveStatus('error');
    }
  };

  const handleAddItem = (itemData: {
    name: string;
    amount?: string;
    note?: string;
    category?: string;
  }) => {
    const now = new Date().toISOString();
    const newItem: Item = {
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      name: itemData.name,
      amount: itemData.amount,
      note: itemData.note,
      category: itemData.category || 'Vegetables',
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };

    const updatedSession: ListSession = currentSession
      ? {
          ...currentSession,
          items: [newItem, ...currentSession.items],
          updatedAt: now,
        }
      : {
          id: 'session-' + Date.now(),
          listDate: selectedDate,
          createdAt: now,
          updatedAt: now,
          items: [newItem],
        };

    setCurrentSession(updatedSession);
    persistSession(updatedSession);
  };

  const handleToggleComplete = (itemId: string) => {
    if (!currentSession) return;
    const now = new Date().toISOString();
    const updatedItems = currentSession.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          isCompleted: !item.isCompleted,
          updatedAt: now,
        };
      }
      return item;
    });

    const updatedSession: ListSession = {
      ...currentSession,
      items: updatedItems,
      updatedAt: now,
    };

    setCurrentSession(updatedSession);
    persistSession(updatedSession);
  };

  const handleUpdateItem = (itemId: string, updates: Partial<Item>) => {
    if (!currentSession) return;
    const now = new Date().toISOString();
    const updatedItems = currentSession.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          ...updates,
          updatedAt: now,
        };
      }
      return item;
    });

    const updatedSession: ListSession = {
      ...currentSession,
      items: updatedItems,
      updatedAt: now,
    };

    setCurrentSession(updatedSession);
    persistSession(updatedSession);
  };

  // 12-Second Temporary Undo Delete Mechanism
  const handleDeleteItem = (itemId: string) => {
    if (!currentSession) return;
    const index = currentSession.items.findIndex((i) => i.id === itemId);
    if (index === -1) return;
    const itemToDelete = currentSession.items[index];

    // Clear any previous undo timeout safely
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    // Immediately remove from visible list and persist
    const now = new Date().toISOString();
    const updatedItems = currentSession.items.filter((i) => i.id !== itemId);
    const updatedSession: ListSession = {
      ...currentSession,
      items: updatedItems,
      updatedAt: now,
    };

    setCurrentSession(updatedSession);
    persistSession(updatedSession);

    // Save pending deletion state
    setPendingUndo({
      item: itemToDelete,
      sessionId: currentSession.id,
      listDate: currentSession.listDate,
      originalIndex: index,
    });

    // Start 12-second (12000 ms) timer to automatically dismiss
    undoTimerRef.current = setTimeout(() => {
      setPendingUndo(null);
      undoTimerRef.current = null;
    }, 12000);
  };

  const handleUndoDelete = () => {
    if (!pendingUndo) return;
    haptic();

    // Cancel timer immediately
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    const { item, sessionId, listDate, originalIndex } = pendingUndo;

    // Restore to sessions list
    setSessions((prevSessions) => {
      return prevSessions.map((s) => {
        if (s.id === sessionId || s.listDate === listDate) {
          const newItems = [...s.items];
          const insertPos = Math.min(originalIndex, newItems.length);
          newItems.splice(insertPos, 0, item);
          const restoredSession: ListSession = {
            ...s,
            items: newItems,
            updatedAt: new Date().toISOString(),
          };
          dbService.saveSession(restoredSession);
          return restoredSession;
        }
        return s;
      });
    });

    // If currently viewing that session, restore immediately in currentSession
    if (currentSession && (currentSession.id === sessionId || currentSession.listDate === listDate)) {
      const newItems = [...currentSession.items];
      const insertPos = Math.min(originalIndex, newItems.length);
      newItems.splice(insertPos, 0, item);
      const restoredSession: ListSession = {
        ...currentSession,
        items: newItems,
        updatedAt: new Date().toISOString(),
      };
      setCurrentSession(restoredSession);
      persistSession(restoredSession);
    }

    setPendingUndo(null);
  };

  const handleCheckAll = () => {
    if (!currentSession) return;
    haptic();
    const now = new Date().toISOString();
    const updatedItems = currentSession.items.map((i) => ({
      ...i,
      isCompleted: true,
      updatedAt: now,
    }));
    const updatedSession = { ...currentSession, items: updatedItems, updatedAt: now };
    setCurrentSession(updatedSession);
    persistSession(updatedSession);
  };

  const handleUncheckAll = () => {
    if (!currentSession) return;
    haptic();
    const now = new Date().toISOString();
    const updatedItems = currentSession.items.map((i) => ({
      ...i,
      isCompleted: false,
      updatedAt: now,
    }));
    const updatedSession = { ...currentSession, items: updatedItems, updatedAt: now };
    setCurrentSession(updatedSession);
    persistSession(updatedSession);
  };

  const handleClearCompleted = () => {
    if (!currentSession) return;
    haptic();
    const now = new Date().toISOString();
    const updatedItems = currentSession.items.filter((i) => !i.isCompleted);
    const updatedSession = { ...currentSession, items: updatedItems, updatedAt: now };
    setCurrentSession(updatedSession);
    persistSession(updatedSession);
  };

  const handleDuplicateSession = async (
    sourceSession: ListSession,
    targetDate: string,
    onlyUncompleted: boolean
  ) => {
    const itemsToCopy = onlyUncompleted
      ? sourceSession.items.filter((i) => !i.isCompleted)
      : sourceSession.items;

    const now = new Date().toISOString();
    const duplicatedItems: Item[] = itemsToCopy.map((item) => ({
      ...item,
      id: 'item-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    }));

    const existingTarget = sessions.find((s) => s.listDate === targetDate);
    const targetSession: ListSession = existingTarget
      ? {
          ...existingTarget,
          items: [...duplicatedItems, ...existingTarget.items],
          updatedAt: now,
        }
      : {
          id: 'session-' + Date.now(),
          listDate: targetDate,
          title: `Restored from ${sourceSession.listDate}`,
          createdAt: now,
          updatedAt: now,
          items: duplicatedItems,
        };

    await persistSession(targetSession);
    handleDateChange(targetDate);
    setCurrentTab(0);
  };

  const handleDeleteSession = async (sessionId: string, dateString: string) => {
    await dbService.deleteSession(sessionId);
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (selectedDate === dateString) {
      const now = new Date().toISOString();
      const empty: ListSession = {
        id: 'session-' + Date.now(),
        listDate: dateString,
        createdAt: now,
        updatedAt: now,
        items: [],
      };
      setCurrentSession(empty);
    }
  };

  const handleClearAllData = async () => {
    await dbService.clearAll();
    setSessions([]);
    const now = new Date().toISOString();
    const empty: ListSession = {
      id: 'session-' + Date.now(),
      listDate: todayStr,
      createdAt: now,
      updatedAt: now,
      items: [],
    };
    setSelectedDate(todayStr);
    setCurrentSession(empty);
  };

  const filteredItems = useMemo(() => {
    if (!currentSession) return [];
    if (filterMode === 1) {
      return currentSession.items.filter((i) => !i.isCompleted);
    }
    if (filterMode === 2) {
      return currentSession.items.filter((i) => i.isCompleted);
    }
    return currentSession.items;
  }, [currentSession, filterMode]);

  const groupedItems = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of filteredItems) {
      const cat = item.category || 'Other';
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(item);
    }
    return Array.from(map.entries());
  }, [filteredItems]);

  const totalItems = currentSession?.items.length || 0;
  const completedCount = currentSession?.items.filter((i) => i.isCompleted).length || 0;
  const pendingCount = totalItems - completedCount;
  const isViewingPast = selectedDate !== todayStr;

  return (
    <LiquidGlassFilter>
      <div className="relative min-h-screen text-stone-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-300">
        {/* Ambient Produce-Inspired Glow Mesh */}
        <div className="liquid-ambient-canvas" aria-hidden="true">
          <div className="ambient-orb-1" />
          <div className="ambient-orb-2" />
          <div className="ambient-orb-3" />
        </div>

        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 px-4 sm:px-6 py-3 transition-all backdrop-blur-md bg-white/40 dark:bg-black/30 border-b border-stone-200/50 dark:border-white/10">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            {/* Brand Logo & Wordmark */}
            <button
              onClick={() => {
                haptic();
                handleDateChange(todayStr);
                setCurrentTab(0);
              }}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
                <ShoppingCart className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-base sm:text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap">
                  Grocery Note Taker
                </span>
                <span className="hidden sm:inline-block text-[10px] text-emerald-900 dark:text-emerald-300 font-bold tracking-wider uppercase ml-2 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Liquid Glass
                </span>
              </div>
            </button>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <GlassButton
                variant="tinted"
                tint="#15803d"
                size="sm"
                icon={<Mic className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                onClick={() => {
                  haptic();
                  setIsVoiceOpen(true);
                }}
              >
                <span className="hidden sm:inline font-semibold text-emerald-900 dark:text-emerald-300">Voice Capture</span>
              </GlassButton>

              <GlassButton
                variant="clear"
                size="sm"
                icon={<Share2 className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />}
                onClick={() => {
                  haptic();
                  setIsExportOpen(true);
                }}
                title="Share & Export"
              />
            </div>
          </div>
        </header>

        {/* Historical List Notification Banner */}
        {isViewingPast && currentTab === 0 && (
          <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 pt-3 pb-1">
            <GlassCard padding="12px 18px" radius="18px" className="flex items-center justify-between gap-3 border border-amber-500/40 bg-amber-500/10">
              <div className="flex items-center gap-2 text-xs text-amber-950 dark:text-amber-200 font-medium">
                <CalendarDays className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  <strong>Historical Archive:</strong> Viewing list for {formatFullDate(selectedDate)}
                </span>
              </div>
              <GlassButton
                variant="tinted"
                tint="#d97706"
                size="sm"
                onClick={() => {
                  haptic();
                  handleDateChange(todayStr);
                }}
              >
                <span className="font-semibold text-amber-950 dark:text-amber-200">Jump to Today</span>
              </GlassButton>
            </GlassCard>
          </div>
        )}

        {/* Main Content Area based on Tab */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-6 relative z-10 space-y-6">
          {currentTab === 0 && (
            /* TAB 0: HOME / TODAY'S GROCERY LIST */
            <div className="space-y-6 animate-fadeIn pb-24">
              {/* Hero Glass Card: Greeting, 3D Produce & Date Navigation */}
              <GlassCard padding="24px" radius="28px" className="relative">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* Left: Greeting & Date Stepper */}
                  <div className="w-full md:w-auto space-y-2.5 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        {isViewingPast ? 'Archive View' : getGreeting()}
                      </span>
                      <span className="text-xs text-stone-400">·</span>
                      <span className="text-xs font-mono font-semibold text-stone-600 dark:text-stone-300">
                        {selectedDate}
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
                      {formatFullDate(selectedDate)}
                    </h1>

                    {/* Stepper buttons and DatePickerPopover */}
                    <div className="flex items-center justify-center md:justify-start gap-2 pt-1 flex-wrap">
                      <GlassButton
                        variant="clear"
                        size="sm"
                        icon={<ChevronLeft className="w-4 h-4 text-stone-800 dark:text-stone-200" />}
                        onClick={() => stepDate(-1)}
                        aria-label="Previous day"
                      />

                      {!isViewingPast ? (
                        <span className="px-3 py-1 text-xs font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                          Today
                        </span>
                      ) : (
                        <GlassButton
                          variant="filled"
                          tint="#15803d"
                          size="sm"
                          onClick={() => {
                            haptic();
                            handleDateChange(todayStr);
                          }}
                        >
                          <span className="text-white font-semibold">Today</span>
                        </GlassButton>
                      )}

                      <GlassButton
                        variant="clear"
                        size="sm"
                        icon={<ChevronRight className="w-4 h-4 text-stone-800 dark:text-stone-200" />}
                        onClick={() => stepDate(1)}
                        aria-label="Next day"
                      />

                      {/* Custom Apple Liquid Glass Calendar Popover with Dark/Light Support */}
                      <DatePickerPopover
                        selectedDate={selectedDate}
                        todayDate={todayStr}
                        onDateChange={handleDateChange}
                        savedDates={sessions.map((s) => s.listDate)}
                      />
                    </div>
                  </div>

                  {/* Right: Stylized 3D Produce Model Cluster */}
                  <div className="w-full md:w-80 shrink-0 flex flex-col items-center justify-center">
                    <Produce3DHero />
                  </div>
                </div>
              </GlassCard>

              {/* Fast Add Produce Input Bar with Redesigned Category Selector */}
              <AddProduceBar
                onAddItem={handleAddItem}
                onOpenVoice={() => setIsVoiceOpen(true)}
              />

              {/* List Summary & View Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                {/* Counter & Autosave status */}
                <div className="flex items-center gap-3 text-xs text-stone-700 dark:text-stone-300">
                  <span className="font-bold text-stone-900 dark:text-stone-100 tabular-nums">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                  <span>·</span>
                  <span className="text-emerald-800 dark:text-emerald-400 tabular-nums font-bold">
                    {completedCount} purchased
                  </span>
                  {pendingCount > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-amber-800 dark:text-amber-400 tabular-nums font-bold">
                        {pendingCount} remaining
                      </span>
                    </>
                  )}

                  {/* Autosave Indicator */}
                  <div className="ml-auto sm:ml-2 flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                    {saveStatus === 'saved' && (
                      <>
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Saved</span>
                      </>
                    )}
                    {saveStatus === 'saving' && <span>Saving...</span>}
                    {saveStatus === 'error' && (
                      <span className="text-rose-600 font-bold">Storage error</span>
                    )}
                  </div>
                </div>

                {/* Glass Segmented Filter and Category Toggle */}
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                  <GlassSegmented
                    options={['All', 'Need to Buy', 'Purchased']}
                    value={filterMode}
                    onChange={(idx) => {
                      haptic();
                      setFilterMode(idx);
                    }}
                    size="sm"
                  />

                  {/* Group By Category Switch */}
                  <div className="flex items-center gap-1.5 text-xs text-stone-800 dark:text-stone-200 font-semibold">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
                    <span className="text-[11px] hidden sm:inline">Group</span>
                    <GlassSwitch
                      checked={groupByCategory}
                      onChange={(checked) => {
                        haptic();
                        setGroupByCategory(checked);
                      }}
                      tint="#15803d"
                    />
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {totalItems > 0 && (
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                    style={{
                      width: `${(completedCount / totalItems) * 100}%`,
                    }}
                  />
                </div>
              )}

              {/* Grocery Items List */}
              <div className="space-y-2.5">
                {isLoading ? (
                  <div className="py-12 text-center text-xs text-stone-500 dark:text-stone-400">
                    Loading groceries...
                  </div>
                ) : totalItems === 0 ? (
                  /* Calm Apple-Style Empty State */
                  <GlassCard padding="40px 24px" radius="28px" className="text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      No groceries recorded for this date
                    </h3>
                    <p className="text-xs text-stone-600 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
                      Type an item name with quantity above or tap Voice Capture to speak what you need to buy.
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-2.5 flex-wrap">
                      <GlassButton
                        variant="filled"
                        tint="#15803d"
                        size="md"
                        icon={<Mic className="w-4 h-4 text-white" />}
                        onClick={() => {
                          haptic();
                          setIsVoiceOpen(true);
                        }}
                      >
                        <span className="font-semibold text-white">Record by Voice</span>
                      </GlassButton>
                      <GlassButton
                        variant="clear"
                        size="md"
                        icon={<FolderOpen className="w-4 h-4 text-stone-700 dark:text-stone-300" />}
                        onClick={() => {
                          haptic();
                          setCurrentTab(1);
                        }}
                      >
                        <span className="text-stone-800 dark:text-stone-200 font-semibold">Restore from History</span>
                      </GlassButton>
                    </div>
                  </GlassCard>
                ) : filteredItems.length === 0 ? (
                  <GlassCard padding="28px" radius="20px" className="text-center text-xs text-stone-600 dark:text-stone-400 font-medium">
                    No items matching current filter.
                  </GlassCard>
                ) : groupByCategory ? (
                  /* Grouped View */
                  <div className="space-y-6">
                    {groupedItems.map(([cat, items]) => (
                      <div key={cat} className="space-y-2">
                        <div className="flex items-center gap-2 px-1 text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                          <span>{cat}</span>
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 font-normal">
                            ({items.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <ItemRow
                              key={item.id}
                              item={item}
                              onToggleComplete={handleToggleComplete}
                              onUpdateItem={handleUpdateItem}
                              onDeleteItem={handleDeleteItem}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Flat Chronological View */
                  <div className="space-y-2">
                    {filteredItems.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onToggleComplete={handleToggleComplete}
                        onUpdateItem={handleUpdateItem}
                        onDeleteItem={handleDeleteItem}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Bulk Actions Toolbar */}
              {totalItems > 0 && (
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 dark:text-stone-400">
                  <div className="flex items-center gap-2 flex-wrap font-semibold">
                    <button
                      onClick={handleCheckAll}
                      className="text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      Check All
                    </button>
                    <span>·</span>
                    <button
                      onClick={handleUncheckAll}
                      className="text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      Uncheck All
                    </button>
                    {completedCount > 0 && (
                      <>
                        <span>·</span>
                        <button
                          onClick={handleClearCompleted}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          Clear Completed
                        </button>
                      </>
                    )}
                  </div>

                  <GlassButton
                    variant="clear"
                    size="sm"
                    icon={<Share2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />}
                    onClick={() => {
                      haptic();
                      setIsExportOpen(true);
                    }}
                  >
                    <span className="font-semibold text-stone-800 dark:text-stone-200">Share List</span>
                  </GlassButton>
                </div>
              )}
            </div>
          )}

          {currentTab === 1 && (
            /* TAB 1: DEDICATED HISTORY ARCHIVE */
            <HistoryView
              sessions={sessions}
              currentDate={selectedDate}
              todayDate={todayStr}
              onSelectSession={(date) => {
                handleDateChange(date);
                setCurrentTab(0);
              }}
              onDuplicateSession={handleDuplicateSession}
              onDeleteSession={handleDeleteSession}
            />
          )}

          {currentTab === 2 && (
            /* TAB 2: SETTINGS & BACKUP */
            <SettingsView
              theme={theme}
              onThemeChange={(newTheme) => setTheme(newTheme)}
              sessions={sessions}
              currentSession={currentSession}
              onDataReset={handleClearAllData}
              onDataImported={loadData}
            />
          )}
        </main>

        {/* Temporary 12-Second Liquid Glass Undo Notification */}
        {pendingUndo && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-32px)] max-w-md animate-fadeIn">
            <GlassCard
              padding="12px 16px"
              radius="20px"
              className="relative overflow-hidden flex items-center justify-between gap-3 text-xs bg-white/92 dark:bg-stone-900/92 backdrop-blur-2xl border border-stone-200/90 dark:border-white/20 shadow-2xl"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-1">
                <span className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-3.5 h-3.5" />
                </span>
                <span className="truncate font-semibold text-stone-900 dark:text-stone-100">
                  Deleted &ldquo;{pendingUndo.item.name}&rdquo;
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <GlassButton
                  variant="filled"
                  tint="#15803d"
                  size="sm"
                  icon={<RotateCcw className="w-3.5 h-3.5 text-white" />}
                  onClick={handleUndoDelete}
                >
                  <span className="font-semibold text-white">Undo</span>
                </GlassButton>

                <button
                  type="button"
                  onClick={() => {
                    if (undoTimerRef.current) {
                      clearTimeout(undoTimerRef.current);
                      undoTimerRef.current = null;
                    }
                    setPendingUndo(null);
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  aria-label="Dismiss undo notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 12-Second Visual Countdown Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black/5 dark:bg-white/10 overflow-hidden pointer-events-none">
                <div className="h-full bg-emerald-500 animate-undo-countdown" />
              </div>
            </GlassCard>
          </div>
        )}

        {/* Floating Liquid Glass Bottom Tab Bar (GlassNav) */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-sm w-full px-4 flex justify-center">
          <GlassNav
            items={[
              { label: 'Today', icon: <ShoppingCart className="w-5 h-5" /> },
              { label: 'History', icon: <Calendar className="w-5 h-5" /> },
              { label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
            ]}
            activeIndex={currentTab}
            onChange={(idx) => {
              haptic();
              setCurrentTab(idx);
            }}
            showLabels={true}
          />
        </div>

        {/* Voice Capture GlassSheet */}
        <VoiceModal
          isOpen={isVoiceOpen}
          onClose={() => setIsVoiceOpen(false)}
          onSaveItem={handleAddItem}
        />

        {/* Share & Text Export Modal */}
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          currentSession={currentSession}
          onDataImported={loadData}
        />
      </div>
    </LiquidGlassFilter>
  );
}
