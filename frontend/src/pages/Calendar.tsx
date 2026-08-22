import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, LayoutList, CalendarRange } from 'lucide-react';
import { api, errorText } from '../lib/api';
import { categoryTone, currency, dayName, shortDate } from '../lib/format';
import { ControlStrip } from '../components/ControlStrip';
import { Button, Empty, Notice, Spinner } from '../components/ui';

interface CalTrip { id: number; name: string; start_date: string; end_date: string; days: number }
interface CalActivity {
  id: number; trip_id: number; trip_name: string; city_name: string;
  title: string; category: keyof typeof categoryTone; cost: string;
  scheduled_date: string; start_time: string | null;
}

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TRIP_COLORS = [
  '#2647E8', '#0E8F87', '#C98A05', '#C93C24', '#8A2BE2', '#2E8B57', '#D2691E', '#1E90FF', '#FF1493'
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

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function Calendar() {
  const [anchor, setAnchor] = useState(() => new Date());
  const [trips, setTrips] = useState<CalTrip[]>([]);
  const [activities, setActivities] = useState<CalActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'month' | 'timeline'>('month');
  const [tripFilter, setTripFilter] = useState('');

  const window = useMemo(() => monthWindow(anchor), [anchor]);

  async function handleDrop(e: React.DragEvent, targetDate: string) {
    e.preventDefault();
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
      // Reload on failure to revert optimistic update
      api.get('/trips/calendar/range', { params: { from: iso(window.from), to: iso(window.to) } })
        .then(({ data }) => { setTrips(data.trips); setActivities(data.activities); });
    }
  }

  useEffect(() => {
    setLoading(true);
    api.get('/trips/calendar/range', { params: { from: iso(window.from), to: iso(window.to) } })
      .then(({ data }) => { setTrips(data.trips); setActivities(data.activities); setError(''); })
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, [window.from.getTime(), window.to.getTime()]);

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
    <div>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1.5">Everything on one grid</p>
          <h1 className="text-[30px]">Calendar</h1>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-[10px] border bg-surface p-0.5">
            <Button size="sm" variant="ghost" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1))} aria-label="Previous month">
              <ChevronLeft size={15} />
            </Button>
            <span className="num min-w-[128px] px-1 text-center text-[14px] font-semibold">
              {anchor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </span>
            <Button size="sm" variant="ghost" onClick={() => setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1))} aria-label="Next month">
              <ChevronRight size={15} />
            </Button>
          </div>
          <Button size="sm" onClick={() => setAnchor(new Date())}>Today</Button>

          <div className="flex rounded-[10px] border bg-surface p-0.5">
            {([['month', CalendarRange, 'Month'], ['timeline', LayoutList, 'Timeline']] as const).map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium ${
                  mode === key ? 'bg-route-soft text-route' : 'text-slate hover:text-ink'
                }`}
              >
                <Icon size={14} /> <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <ControlStrip
        query={query}
        onQuery={setQuery}
        placeholder="Search what is planned this month…"
        groupBy={tripFilter}
        onGroupBy={setTripFilter}
        groupOptions={[{ value: '', label: 'All trips' }, ...trips.map((t) => ({ value: String(t.id), label: t.name }))]}
      />

      {error && <Notice>{error}</Notice>}

      {/* The trips that overlap this month, drawn as bars across the top. */}
      {trips.length > 0 && (
        <div className="card mb-4 p-3">
          <p className="eyebrow mb-2">Trips this month</p>
          <ul className="flex flex-wrap gap-2">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Link
                  to={`/trips/${trip.id}`}
                  className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[13px] font-medium hover:opacity-80"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${getTripColor(trip.id)} 15%, transparent)`,
                    color: getTripColor(trip.id),
                    borderColor: `color-mix(in srgb, ${getTripColor(trip.id)} 25%, transparent)`,
                  }}
                >
                  {trip.name}
                  <span className="num text-[11px] opacity-75">{shortDate(trip.start_date)} – {shortDate(trip.end_date)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading ? (
        <Spinner label="Loading the month" />
      ) : mode === 'month' ? (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b bg-canvas/60">
            {WEEK.map((label) => <span key={label} className="eyebrow px-2 py-2 text-center">{label}</span>)}
          </div>
          <div className="flex flex-col border-x border-t rounded-b-[14px] overflow-hidden">
            {Array.from({ length: window.cells / 7 }, (_, weekIndex) => {
              const weekDays = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(window.from);
                date.setDate(date.getDate() + weekIndex * 7 + i);
                return { date, key: iso(date), outside: date.getMonth() !== anchor.getMonth() };
              });
              
              const weekStartKey = weekDays[0].key;
              const weekEndKey = weekDays[6].key;
              
              const weekTrips = trips.filter(t => t.start_date <= weekEndKey && t.end_date >= weekStartKey);

              return (
                <div key={weekIndex} className="relative grid grid-cols-7 border-b min-h-[112px]">
                  
                  {/* Absolute Trip Bars Layer */}
                  <div className="absolute top-7 left-0 right-0 z-10 flex flex-col gap-1 pointer-events-none">
                    {weekTrips.map(trip => {
                      const startIdx = weekDays.findIndex(d => d.key === trip.start_date);
                      const endIdx = weekDays.findIndex(d => d.key === trip.end_date);
                      
                      const spanStart = startIdx === -1 ? (trip.start_date < weekStartKey ? 0 : -1) : startIdx;
                      const spanEnd = endIdx === -1 ? (trip.end_date > weekEndKey ? 6 : -1) : endIdx;

                      if (spanStart === -1 || spanEnd === -1) return null;
                      const span = spanEnd - spanStart + 1;

                      return (
                         <div key={trip.id} className="grid grid-cols-7 px-1">
                            <div 
                               className="pointer-events-auto rounded-[3px] text-[10.5px] font-medium text-white px-2 py-0.5 truncate hover:opacity-90 shadow-sm"
                               style={{ 
                                  gridColumn: `${spanStart + 1} / span ${span}`,
                                  backgroundColor: getTripColor(trip.id),
                                  marginLeft: spanStart > 0 ? '4px' : '0px',
                                  marginRight: spanEnd < 6 ? '4px' : '0px'
                               }}
                            >
                               <Link to={`/trips/${trip.id}`} className="block w-full">{trip.name}</Link>
                            </div>
                         </div>
                      );
                    })}
                  </div>

                  {/* Day Columns */}
                  {weekDays.map(day => {
                    const list = byDate.get(day.key) ?? [];
                    const spend = list.reduce((sum, a) => sum + Number(a.cost), 0);
                    
                    return (
                      <div 
                        key={day.key}
                        className={`relative flex flex-col border-r last:border-r-0 p-1.5 ${day.outside ? 'bg-canvas/40' : ''} ${day.key === today ? 'bg-route-soft/40' : ''}`}
                        style={{ paddingTop: `${28 + weekTrips.length * 22}px` }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, day.key)}
                      >
                        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-baseline justify-between pointer-events-none">
                          <span className={`num text-[12px] ${day.key === today ? 'font-bold text-route' : day.outside ? 'text-mist' : 'font-semibold'}`}>
                            {day.date.getDate()}
                          </span>
                          {spend > 0 && <span className="num text-[10px] text-mist">{currency(spend)}</span>}
                        </div>
                        
                        <ul className="space-y-0.5 mt-auto relative z-10">
                          {list.slice(0, 3).map((activity) => {
                            const tone = categoryTone[activity.category];
                            return (
                              <li key={activity.id}>
                                <Link
                                  to={`/trips/${activity.trip_id}`}
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('activity_id', String(activity.id));
                                    e.dataTransfer.setData('trip_id', String(activity.trip_id));
                                  }}
                                  title={`${activity.title} — ${activity.city_name}`}
                                  className="block truncate rounded px-1.5 py-0.5 text-[10.5px] hover:opacity-80 cursor-move"
                                  style={{ background: tone.bg, color: tone.fg }}
                                >
                                  {activity.start_time && <span className="num mr-1">{activity.start_time.slice(0, 5)}</span>}
                                  {activity.title}
                                </Link>
                              </li>
                            );
                          })}
                          {list.length > 3 && <li className="num px-1.5 text-[10px] text-mist">+{list.length - 3} more</li>}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Empty title="Nothing planned this month" body="Move to another month, or open a trip and add activities to its days." />
      ) : (
        <ol className="spine space-y-3">
          {[...byDate.entries()].sort().map(([date, list], index) => (
            <li key={date} className="card relative p-4">
              <span className="spine-node" style={{ top: 16 }}>{index + 1}</span>
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[16px]">{dayName(date)}</h3>
                <span className="num text-[12.5px] text-mist">
                  {currency(list.reduce((sum, a) => sum + Number(a.cost), 0))}
                </span>
              </div>
              <ul className="day-rail space-y-1.5">
                {list.map((activity) => {
                  const tone = categoryTone[activity.category];
                  return (
                    <li key={activity.id} className="relative flex items-center gap-3">
                      <span className="day-tick" />
                      <span className="num w-11 shrink-0 text-[12px] text-mist">
                        {activity.start_time ? activity.start_time.slice(0, 5) : '—'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <Link to={`/trips/${activity.trip_id}`} className="block truncate text-[14px] font-medium hover:text-route">
                          {activity.title}
                        </Link>
                        <span className="text-[11.5px] text-mist">{activity.city_name} · {activity.trip_name}</span>
                      </span>
                      <span className="num shrink-0 rounded-full px-2 py-0.5 text-[11px]" style={{ color: tone.fg, background: tone.bg }}>
                        {activity.category}
                      </span>
                      <span className="num w-14 shrink-0 text-right text-[13px] font-semibold">{currency(activity.cost)}</span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
