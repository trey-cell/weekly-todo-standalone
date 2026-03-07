import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, RefreshCw, Link2 } from 'lucide-react';
import { getAllCalendarEvents } from '../lib/googleCalendar';
import { initiateGoogleAuth } from '../lib/googleAuth';

interface CalendarEvent {
  eventId: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  calendarId?: string;
}

interface Props {
  googleConnected: boolean;
}

const START_HOUR = 5;
const END_HOUR = 15;
const SLOT_MINUTES = 30;
const SLOT_HEIGHT = 48;
const TOTAL_SLOTS = ((END_HOUR - START_HOUR) * 60) / SLOT_MINUTES;

function toRFC3339(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  const absOff = Math.abs(offset);
  const hh = pad(Math.floor(absOff / 60));
  const mm = pad(absOff % 60);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${hh}:${mm}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTimeLabel(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  if (minute === 0) return `${h} ${ampm}`;
  return `${h}:${String(minute).padStart(2, '0')}`;
}

function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function timeToY(iso: string): number {
  const d = new Date(iso);
  const minutesSinceStart = (d.getHours() - START_HOUR) * 60 + d.getMinutes();
  return (minutesSinceStart / SLOT_MINUTES) * SLOT_HEIGHT;
}

function clampY(y: number): number {
  return Math.max(0, Math.min(y, TOTAL_SLOTS * SLOT_HEIGHT));
}

const EVENT_COLORS = [
  { bg: 'bg-blue-500/20', border: 'border-l-blue-500', text: 'text-blue-200' },
  { bg: 'bg-emerald-500/20', border: 'border-l-emerald-500', text: 'text-emerald-200' },
  { bg: 'bg-purple-500/20', border: 'border-l-purple-500', text: 'text-purple-200' },
  { bg: 'bg-amber-500/20', border: 'border-l-amber-500', text: 'text-amber-200' },
  { bg: 'bg-rose-500/20', border: 'border-l-rose-500', text: 'text-rose-200' },
  { bg: 'bg-cyan-500/20', border: 'border-l-cyan-500', text: 'text-cyan-200' },
  { bg: 'bg-orange-500/20', border: 'border-l-orange-500', text: 'text-orange-200' },
];

const CalendarView: React.FC<Props> = ({ googleConnected }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const nowLineRef = useRef<HTMLDivElement>(null);

  const isMountedRef = useRef(true);
  useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; }; }, []);

  const fetchEvents = async (date: Date, isRefresh = false) => {
    if (!googleConnected) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
      const allEvents = await getAllCalendarEvents(toRFC3339(dayStart), toRFC3339(dayEnd));
      if (!isMountedRef.current) return;
      setEvents(allEvents);
    } catch (err: any) {
      if (!isMountedRef.current) return;
      console.error('Failed to fetch calendar events:', err);
      setError('Failed to load calendar events — tap refresh to retry');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchEvents(selectedDate);
  }, [selectedDate, googleConnected]);

  useEffect(() => {
    if (!loading && gridRef.current) {
      if (isToday && nowLineRef.current) {
        nowLineRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else {
        const offset8am = ((8 - START_HOUR) * 60 / SLOT_MINUTES) * SLOT_HEIGHT;
        gridRef.current.scrollTop = offset8am - 50;
      }
    }
  }, [loading, selectedDate]);

  const goDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
  };

  const now = new Date();
  const isToday = selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate();

  const slots: { hour: number; minute: number }[] = [];
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const totalMin = START_HOUR * 60 + i * SLOT_MINUTES;
    slots.push({ hour: Math.floor(totalMin / 60), minute: totalMin % 60 });
  }

  const nowY = isToday ? clampY(timeToY(now.toISOString())) : -1;
  const nowInBounds = isToday && nowY >= 0 && nowY <= TOTAL_SLOTS * SLOT_HEIGHT;

  const positioned = events
    .filter(e => {
      if (!e.start || !e.end) return false;
      // Skip all-day events (no time component)
      if (!e.start.includes('T')) return false;
      const eStart = new Date(e.start);
      const eEnd = new Date(e.end);
      const gridStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), START_HOUR, 0);
      const gridEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), END_HOUR, 0);
      return eStart < gridEnd && eEnd > gridStart;
    })
    .map((event, i) => {
      const top = clampY(timeToY(event.start));
      const bottom = clampY(timeToY(event.end));
      const height = Math.max(bottom - top, SLOT_HEIGHT * 0.8);
      const color = EVENT_COLORS[i % EVENT_COLORS.length];
      return { event, top, height, color };
    });

  const gridHeight = TOTAL_SLOTS * SLOT_HEIGHT;
  const TIME_COL_WIDTH = 60;

  // Not connected state
  if (!googleConnected) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{formatDate(selectedDate)}</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Calendar className="w-12 h-12 text-base-content/30" />
          <p className="text-base-content/50 text-center">Connect your Google account to see your calendar</p>
          <button className="btn btn-primary btn-sm gap-2" onClick={() => initiateGoogleAuth()}>
            <Link2 className="w-4 h-4" />
            Connect Google Calendar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm btn-square" onClick={() => goDay(-1)}>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-semibold">{formatDate(selectedDate)}</h2>
          <button className="btn btn-ghost btn-sm btn-square" onClick={() => goDay(1)}>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {!isToday && (
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(new Date())}>
              Today
            </button>
          )}
          <button
            className={`btn btn-ghost btn-sm btn-square ${refreshing ? 'animate-spin' : ''}`}
            onClick={() => fetchEvents(selectedDate, true)}
            disabled={refreshing}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Time Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <div
          ref={gridRef}
          className="overflow-y-auto rounded-lg border border-base-300 bg-base-100"
          style={{ maxHeight: '70vh' }}
        >
          <div className="relative" style={{ height: gridHeight }}>
            {/* Time labels + grid lines */}
            {slots.map((slot, i) => (
              <div
                key={i}
                className="absolute flex"
                style={{ top: i * SLOT_HEIGHT, width: '100%', height: SLOT_HEIGHT }}
              >
                <div
                  className="flex-shrink-0 text-xs text-base-content/40 text-right pr-2 pt-0.5 select-none"
                  style={{ width: TIME_COL_WIDTH }}
                >
                  {slot.minute === 0 ? formatTimeLabel(slot.hour, slot.minute) : (
                    <span className="text-base-content/20">{formatTimeLabel(slot.hour, slot.minute)}</span>
                  )}
                </div>
                <div className="flex-1 border-t border-base-300/50" style={slot.minute === 0 ? { borderTopColor: 'oklch(var(--bc) / 0.15)' } : {}} />
              </div>
            ))}

            {/* Events layer */}
            <div className="absolute top-0 bottom-0" style={{ left: TIME_COL_WIDTH, right: 8 }}>
              {positioned.map(({ event, top, height, color }, idx) => (
                <div
                  key={event.eventId || idx}
                  className={`absolute rounded-md border-l-4 ${color.bg} ${color.border} px-2.5 py-1.5 overflow-hidden cursor-default transition-opacity hover:opacity-90`}
                  style={{ top, height, left: 4, right: 4, zIndex: 10 }}
                >
                  <div className="font-semibold text-sm truncate">{event.title}</div>
                  <div className="text-xs text-base-content/60 mt-0.5">
                    {formatEventTime(event.start)} – {formatEventTime(event.end)}
                  </div>
                  {event.location && height > 60 && (
                    <div className="text-xs text-base-content/40 truncate mt-0.5">📍 {event.location}</div>
                  )}
                </div>
              ))}
            </div>

            {/* Now line */}
            {nowInBounds && (
              <div
                ref={nowLineRef}
                className="absolute pointer-events-none"
                style={{ top: nowY, left: TIME_COL_WIDTH - 6, right: 0, zIndex: 20 }}
              >
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 -ml-1.5" />
                  <div className="flex-1 border-t-2 border-red-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-center text-xs text-base-content/40">
        {events.length} event{events.length !== 1 ? 's' : ''} · Synced with Google Calendar
      </div>
    </div>
  );
};

export default CalendarView;
