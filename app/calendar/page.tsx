'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Filter,
  LayoutList,
  MapPin,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { api, errorText } from '@/lib/api';
import { categoryTone, currency, dayName, shortDate } from '@/lib/format';
import { Button, Empty, Notice, Spinner } from '@/components/ui';
import { PrivateRoute } from '@/components/AuthGuard';

interface CalTrip {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  days: number;
}

interface CalActivity {
  id: number;
  trip_id: number;
  trip_name: string;
  city_name: string;
  title: string;
  category: keyof typeof categoryTone;
  cost: string;
  scheduled_date: string;
  start_time: string | null;
}

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TRIP_COLORS = [
  '#0D7A5F', // Emerald Pine
  '#C2410C', // Terracotta
  '#1D4ED8', // Royal Cobalt
  '#7C3AED', // Amethyst Violet
  '#B45309', // Amber Warm
  '#0F766E', // Deep Teal
  '#BE185D', // Magenta Rose
];

function getTripColor(id: number) {
  return TRIP_COLORS[id % TRIP_COLORS.length];
}

/** The first and last day the month grid has to show, Monday-first. */
function monthWindow(anchor: Date) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const lead = (first.getDay() + 6) % 7;
  const from = new Date(first);
  from.setDate(from.getDate() - lead);
  const cells = Math.ceil((lead + last.getDate()) / 7) * 7;
  const to = new Date(from);
  to.setDate(to.getDate() + cells - 1);
  return { first, last, from, to, cells };
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function CalendarContent() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [trips, setTrips] = useState<CalTrip[]>([]);
  const [activities, setActivities] = useState<CalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'month' | 'timeline'>('month');
  const [tripFilter, setTripFilter] = useState('');
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  const window = useMemo(() => monthWindow(anchor), [anchor]);

  async function handleDrop(e: React.DragEvent, targetDate: string) {
    e.preventDefault();
    setDragOverDay(null);
    const activityId = e.dataTransfer.getData('activity_id');
    const tripId = e.dataTransfer.getData('trip_id');
    if (!activityId || !tripId) return;

    setActivities((current) =>
      current.map((a) => (a.id === Number(activityId) ? { ...a, scheduled_date: targetDate } : a))
    );

    try {
      await api.patch(`/trips/${tripId}/activities/${activityId}`, { scheduledDate: targetDate });
    } catch (err) {
      setError(errorText(err));
      api
        .get('/trips/calendar/range', { params: { from: iso(window.from), to: iso(window.to) } })
        .then(({ data }) => {
          setTrips(data.trips);
          setActivities(data.activities);
        });
    }
  }

  useEffect(() => {
    setLoading(true);
    api
      .get('/trips/calendar/range', { params: { from: iso(window.from), to: iso(window.to) } })
      .then(({ data }) => {
        setTrips(data.trips);
        setActivities(data.activities);
        setError('');
      })
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, [window]);

  const filtered = useMemo(() => {
    let list = activities;
    if (tripFilter) list = list.filter((a) => String(a.trip_id) === tripFilter);
    if (query) {
      const needle = query.toLowerCase();
      list = list.filter((a) => `${a.title} ${a.city_name} ${a.trip_name}`.toLowerCase().includes(needle));
    }
    return list;
  }, [activities, query, tripFilter]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalActivity[]>();
    for (const activity of filtered) {
      if (!map.has(activity.scheduled_date)) map.set(activity.scheduled_date, []);
      map.get(activity.scheduled_date)!.push(activity);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
    }
    return map;
  }, [filtered]);

  const today = iso(new Date());

  return (
    <div className="pb-16">
      {/* Header Section */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-sand-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-brand-700">Chronological View</span>
            <span className="inline-flex items-center rounded-full bg-sand-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              {trips.length} {trips.length === 1 ? 'Trip Active' : 'Trips Active'}
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">Master Travel Calendar</h1>
          <p className="text-xs text-slate-600">
            View, cross-reference, and drag-and-drop schedule activities across all planned journeys.
          </p>
        </div>

        {/* View Controls & Month Navigation */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-xl border border-sand-200 bg-surface p-1 shadow-sm">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))}
              aria-label="Previous month"
              className="h-8 w-8 p-0"
            >
              <ChevronLeft size={15} />
            </Button>
            <span className="min-w-[140px] px-2 text-center font-serif text-sm font-bold text-ink">
              {anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))}
              aria-label="Next month"
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={15} />
            </Button>
          </div>

          <Button
            size="sm"
            variant="quiet"
            onClick={() => setAnchor(new Date())}
            className="h-9 px-3 text-xs font-semibold"
          >
            Today
          </Button>

          {/* Mode Switcher */}
          <div className="flex rounded-xl border border-sand-200 bg-surface p-1 shadow-sm">
            {(
              [
                ['month', CalendarRange, 'Month Grid'],
                ['timeline', LayoutList, 'Feed View'],
              ] as const
            ).map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-all ${
                  mode === key ? 'bg-sand-900 text-white shadow-xs' : 'text-slate-600 hover:text-ink'
                }`}
              >
                <Icon size={13} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Filter and Trips Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[260px] flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search planned activities..."
              className="h-9 w-full rounded-xl border border-sand-200 bg-surface pl-8.5 pr-3 text-xs text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
            />
          </div>

          {trips.length > 0 && (
            <select
              value={tripFilter}
              onChange={(e) => setTripFilter(e.target.value)}
              className="h-9 rounded-xl border border-sand-200 bg-surface px-3 text-xs text-ink focus:border-brand-500 focus:outline-none"
            >
              <option value="">All Trips ({trips.length})</option>
              {trips.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Trips Active Badges */}
        {trips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-xs transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: `color-mix(in srgb, ${getTripColor(trip.id)} 10%, transparent)`,
                  color: getTripColor(trip.id),
                  borderColor: `color-mix(in srgb, ${getTripColor(trip.id)} 25%, transparent)`,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getTripColor(trip.id) }}
                />
                <span>{trip.name}</span>
                <span className="text-[10px] opacity-75">
                  ({shortDate(trip.start_date)} – {shortDate(trip.end_date)})
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {error && <Notice>{error}</Notice>}

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20">
          <Spinner label="Loading monthly schedule..." />
        </div>
      ) : mode === 'month' ? (
        <div className="overflow-hidden rounded-2xl border border-sand-200 bg-surface shadow-sm">
          {/* Day of week labels */}
          <div className="grid grid-cols-7 border-b border-sand-200 bg-sand-50/70">
            {WEEK.map((label) => (
              <span
                key={label}
                className="py-2.5 text-center font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500"
              >
                {label}
              </span>
            ))}
          </div>

          {/* Month Grid Weeks */}
          <div className="flex flex-col divide-y divide-sand-200">
            {Array.from({ length: window.cells / 7 }, (_, weekIndex) => {
              const weekDays = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(window.from);
                date.setDate(date.getDate() + weekIndex * 7 + i);
                return { date, key: iso(date), outside: date.getMonth() !== anchor.getMonth() };
              });

              const weekStartKey = weekDays[0].key;
              const weekEndKey = weekDays[6].key;

              const weekTrips = trips.filter((t) => t.start_date <= weekEndKey && t.end_date >= weekStartKey);

              return (
                <div key={weekIndex} className="relative grid min-h-[120px] grid-cols-7 divide-x divide-sand-200">
                  {/* Absolute Trip Bars Layer */}
                  <div className="pointer-events-none absolute left-0 right-0 top-7 z-10 flex flex-col gap-1">
                    {weekTrips.map((trip) => {
                      const startIdx = weekDays.findIndex((d) => d.key === trip.start_date);
                      const endIdx = weekDays.findIndex((d) => d.key === trip.end_date);

                      const spanStart = startIdx === -1 ? (trip.start_date < weekStartKey ? 0 : -1) : startIdx;
                      const spanEnd = endIdx === -1 ? (trip.end_date > weekEndKey ? 6 : -1) : endIdx;

                      if (spanStart === -1 || spanEnd === -1) return null;
                      const span = spanEnd - spanStart + 1;

                      return (
                        <div key={trip.id} className="grid grid-cols-7 px-1">
                          <div
                            className="pointer-events-auto truncate rounded-md px-2 py-0.5 text-[10.5px] font-bold text-white shadow-xs transition-opacity hover:opacity-90"
                            style={{
                              gridColumn: `${spanStart + 1} / span ${span}`,
                              backgroundColor: getTripColor(trip.id),
                              marginLeft: spanStart > 0 ? '4px' : '0px',
                              marginRight: spanEnd < 6 ? '4px' : '0px',
                            }}
                          >
                            <Link href={`/trips/${trip.id}`} className="block w-full">
                              {trip.name}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map((day) => {
                    const list = byDate.get(day.key) ?? [];
                    const spend = list.reduce((sum, a) => sum + Number(a.cost), 0);
                    const isToday = day.key === today;
                    const isDragTarget = dragOverDay === day.key;

                    return (
                      <div
                        key={day.key}
                        className={`group relative flex flex-col p-2 transition-colors ${
                          day.outside ? 'bg-sand-50/40' : 'bg-surface'
                        } ${isToday ? 'bg-brand-50/30' : ''} ${
                          isDragTarget ? 'ring-2 ring-inset ring-brand-500 bg-brand-50/50' : ''
                        }`}
                        style={{ paddingTop: `${28 + weekTrips.length * 20}px` }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverDay !== day.key) setDragOverDay(day.key);
                        }}
                        onDragLeave={() => {
                          if (dragOverDay === day.key) setDragOverDay(null);
                        }}
                        onDrop={(e) => handleDrop(e, day.key)}
                      >
                        {/* Day Number and Daily Spend */}
                        <div className="pointer-events-none absolute left-2 right-2 top-2 flex items-baseline justify-between">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                              isToday
                                ? 'bg-brand-600 text-white shadow-xs'
                                : day.outside
                                ? 'text-slate-300'
                                : 'text-ink'
                            }`}
                          >
                            {day.date.getDate()}
                          </span>
                          {spend > 0 && (
                            <span className="font-serif text-[11px] font-bold text-slate-600">
                              {currency(spend)}
                            </span>
                          )}
                        </div>

                        {/* Activities Pill List */}
                        <ul className="relative z-10 mt-auto space-y-1">
                          {list.slice(0, 3).map((activity) => {
                            const tone = categoryTone[activity.category] || { fg: '#0D7A5F', bg: '#E6F4EF' };
                            return (
                              <li key={activity.id}>
                                <Link
                                  href={`/trips/${activity.trip_id}`}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('activity_id', String(activity.id));
                                    e.dataTransfer.setData('trip_id', String(activity.trip_id));
                                  }}
                                  title={`${activity.title} — ${activity.city_name} (Drag to move date)`}
                                  className="block cursor-grab truncate rounded-md px-1.5 py-0.5 text-[10.5px] font-medium transition-transform hover:scale-[1.02] active:cursor-grabbing"
                                  style={{ background: tone.bg, color: tone.fg }}
                                >
                                  {activity.start_time && (
                                    <span className="mr-1 font-mono font-bold opacity-80">
                                      {activity.start_time.slice(0, 5)}
                                    </span>
                                  )}
                                  {activity.title}
                                </Link>
                              </li>
                            );
                          })}
                          {list.length > 3 && (
                            <li className="px-1 text-[10px] font-semibold text-slate-500">
                              +{list.length - 3} more items
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Empty
          title="No activities found this month"
          body="Switch to another month or select an active trip from your portfolio to schedule activities."
        />
      ) : (
        /* Timeline Feed View */
        <ol className="space-y-4">
          {[...byDate.entries()].sort().map(([date, list], index) => {
            const daySpend = list.reduce((sum, a) => sum + Number(a.cost), 0);
            return (
              <li
                key={date}
                className="overflow-hidden rounded-2xl border border-sand-200 bg-surface p-4 shadow-sm sm:p-5"
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-sand-100 pb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-bold text-sand-50">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-serif text-lg font-bold text-ink">{dayName(date)}</h3>
                      <p className="text-xs text-slate-500">{shortDate(date)}</p>
                    </div>
                  </div>
                  {daySpend > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Spend</span>
                      <p className="font-serif text-base font-bold text-ink">{currency(daySpend)}</p>
                    </div>
                  )}
                </div>

                <ul className="space-y-2">
                  {list.map((activity) => {
                    const tone = categoryTone[activity.category] || { fg: '#0D7A5F', bg: '#E6F4EF' };
                    return (
                      <li
                        key={activity.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-sand-100 bg-sand-50/50 p-2.5 transition-colors hover:border-sand-200"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="font-mono text-xs font-semibold text-slate-500">
                            {activity.start_time ? activity.start_time.slice(0, 5) : 'Anytime'}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/trips/${activity.trip_id}`}
                              className="block truncate text-sm font-semibold text-ink hover:text-brand-700"
                            >
                              {activity.title}
                            </Link>
                            <span className="text-xs text-slate-500">
                              {activity.city_name} · {activity.trip_name}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ color: tone.fg, background: tone.bg }}
                          >
                            {activity.category}
                          </span>
                          <span className="font-serif font-bold text-ink">{currency(activity.cost)}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <PrivateRoute>
      <CalendarContent />
    </PrivateRoute>
  );
}
