import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { haptic } from '@zakisheriff/liquid-glass';

interface DatePickerPopoverProps {
  selectedDate: string; // YYYY-MM-DD
  todayDate: string; // YYYY-MM-DD
  onDateChange: (dateString: string) => void;
  savedDates?: string[]; // list of dates with grocery lists
  className?: string;
}

interface Coords {
  top: number;
  left: number;
  placement: 'bottom' | 'top';
}

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  selectedDate,
  todayDate,
  onDateChange,
  savedDates = [],
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<Coords>({ top: 0, left: 0, placement: 'bottom' });

  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse selected date or fallback to today
  const [currentViewDate, setCurrentViewDate] = useState(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, d || 1);
    } catch {
      return new Date();
    }
  });

  // Sync view when selectedDate changes externally
  useEffect(() => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      setCurrentViewDate(new Date(y, m - 1, d || 1));
    } catch {
      // ignore
    }
  }, [selectedDate]);

  // Compute collision-detection positioning
  const updatePosition = useCallback(() => {
    if (!triggerButtonRef.current) return;
    const rect = triggerButtonRef.current.getBoundingClientRect();
    const popoverWidth = 296; // w-74
    const popoverHeight = 350; // expected height of calendar popover

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Flip upwards if insufficient space below
    const placement: 'bottom' | 'top' =
      spaceBelow < popoverHeight + 12 && spaceAbove > spaceBelow ? 'top' : 'bottom';

    let top = placement === 'bottom' ? rect.bottom + 8 : rect.top - popoverHeight - 8;

    // Horizontal position: align with trigger's left edge
    let left = rect.left;

    // Clamp horizontally to stay within viewport with padding
    if (left + popoverWidth > viewportWidth - 12) {
      left = viewportWidth - popoverWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }

    // Clamp vertically to stay within viewport
    if (top < 12) {
      top = 12;
    } else if (top + popoverHeight > viewportHeight - 12) {
      top = viewportHeight - popoverHeight - 12;
    }

    setCoords({ top, left, placement });
  }, []);

  // Update position on open, scroll, or resize; handle outside click & Escape
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const handleScrollAndResize = () => {
      updatePosition();
    };

    window.addEventListener('resize', handleScrollAndResize, { passive: true });
    window.addEventListener('scroll', handleScrollAndResize, { capture: true, passive: true });

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerButtonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleScrollAndResize);
      window.removeEventListener('scroll', handleScrollAndResize, true);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  const monthName = currentViewDate.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const stepMonth = (delta: number) => {
    haptic();
    setCurrentViewDate(new Date(year, month + delta, 1));
  };

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 for Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      hasSession: boolean;
    }> = [];

    // Prev month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayDate,
        isSelected: dateStr === selectedDate,
        hasSession: savedDates.includes(dateStr),
      });
    }

    // Current month days
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayDate,
        isSelected: dateStr === selectedDate,
        hasSession: savedDates.includes(dateStr),
      });
    }

    // Next month padding to fill out 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateStr === todayDate,
        isSelected: dateStr === selectedDate,
        hasSession: savedDates.includes(dateStr),
      });
    }

    return days;
  }, [year, month, todayDate, selectedDate, savedDates]);

  const handleSelectDate = (dateStr: string) => {
    haptic();
    onDateChange(dateStr);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Calendar Trigger Button */}
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => {
          haptic();
          setIsOpen((prev) => !prev);
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Open Liquid Glass date picker"
        className="group inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-xl border transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 bg-white/80 dark:bg-stone-900/80 hover:bg-white dark:hover:bg-stone-900 border-stone-300/80 dark:border-white/15 text-stone-900 dark:text-stone-100 shadow-2xs backdrop-blur-md"
      >
        <CalendarIcon className="w-4 h-4 text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0" />
        <span className="font-mono text-[11px] tabular-nums font-bold">{selectedDate}</span>
      </button>

      {/* Hidden native input for keyboard/mobile native picker accessibility */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => {
          if (e.target.value) onDateChange(e.target.value);
        }}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Render Calendar Popover into React Portal to document.body (Never Clipped) */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Calendar date selector"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 99999,
            }}
            className="w-74 p-3.5 rounded-3xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-2xl border border-stone-200/90 dark:border-white/20 shadow-2xl space-y-3 animate-fadeIn text-stone-900 dark:text-stone-100"
          >
            {/* Month Header and Stepper */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {monthName}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => stepMonth(-1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => stepMonth(1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-stone-700 dark:text-stone-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                <span
                  key={d}
                  className="text-[11px] font-bold text-stone-500 dark:text-stone-400 py-1"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const isSelected = day.isSelected;
                const isToday = day.isToday;

                return (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => handleSelectDate(day.dateStr)}
                    className={`relative h-8 rounded-xl text-xs flex flex-col items-center justify-center transition-all cursor-pointer select-none focus:outline-none ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : !day.isCurrentMonth
                        ? 'text-stone-400 dark:text-stone-600 hover:bg-black/5 dark:hover:bg-white/5 font-normal'
                        : isToday
                        ? 'text-emerald-800 dark:text-emerald-300 font-bold bg-emerald-500/20 border border-emerald-500/35'
                        : 'text-stone-800 dark:text-stone-100 hover:bg-black/5 dark:hover:bg-white/10 font-semibold'
                    }`}
                  >
                    <span className="tabular-nums leading-none">{day.dayNumber}</span>

                    {/* Dot indicator for dates with grocery sessions */}
                    {day.hasSession && !isSelected && (
                      <span
                        className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400"
                        title="Grocery list saved for this date"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer Quick Actions */}
            <div className="pt-2 border-t border-stone-200/80 dark:border-white/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSelectDate(todayDate)}
                className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline px-1 py-0.5 rounded cursor-pointer"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 px-2 py-0.5 rounded cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
