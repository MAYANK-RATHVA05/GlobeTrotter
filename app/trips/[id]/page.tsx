'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  Compass,
  Layers,
  LayoutList,
  MapPin,
  Plus,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { useTrip } from '@/lib/useTrip';
import { categoryTone, currency, dayName, duration, eachDate, shortDate, stopForDate } from '@/lib/format';
import type { Trip, TripActivity } from '@/lib/types';
import { TripHeader } from '@/components/TripHeader';
import { Plate } from '@/components/Plate';
import { Button, Empty, Notice, Spinner } from '@/components/ui';
import { PrivateRoute } from '@/components/AuthGuard';

interface Day {
  date: string;
  stop: Trip['stops'][number] | null;
  activities: TripActivity[];
  spend: number;
}

function buildDays(trip: Trip): Day[] {
  return eachDate(trip.start_date, trip.end_date).map((date) => {
    const activities = trip.stops
      .flatMap((s) => s.activities)
      .filter((a) => a.scheduled_date === date)
      .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? '') || a.position - b.position);

    return {
      date,
      stop: stopForDate(trip.stops, date),
      activities,
      spend: activities.reduce((sum, a) => sum + Number(a.cost), 0) * trip.travellers,
    };
  });
}

function ItineraryViewContent() {
  const params = useParams();
  const id = params?.id as string;
  const { trip, setTrip, error } = useTrip(id);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'list'>('timeline');

  const days = useMemo(() => (trip ? buildDays(trip) : []), [trip]);

  if (error) return <Notice>{error}</Notice>;
  if (!trip) return <Spinner label="Loading the itinerary" />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <TripHeader trip={trip} onChange={setTrip} />

      {trip.stops.length === 0 ? (
        <Empty
          title="This trip has no destinations yet"
          body="Start by adding your first city stop in the Itinerary Builder, and your daily schedule will assemble here automatically."
          action={
            <Link href={`/trips/${trip.id}/build`}>
              <Button variant="primary">
                <Plus size={15} /> Launch Itinerary Builder
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* View Switcher Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rule pb-4">
            <div>
              <h2 className="text-[22px] font-bold text-ink">Day-by-Day Schedule</h2>
              <p className="text-[13.5px] text-slate">
                {trip.days} days across {trip.stops.length} {trip.stops.length === 1 ? 'city' : 'cities'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex rounded-xl border border-rule bg-surface p-1 shadow-2xs">
                {([
                  ['timeline', Layers, 'Timeline'],
                  ['calendar', CalendarDays, 'Calendar'],
                  ['list', LayoutList, 'List'],
                ] as const).map(([key, Icon, label]) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key)}
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-all cursor-pointer ${
                      viewMode === key
                        ? 'bg-brand text-white shadow-xs'
                        : 'text-slate hover:text-ink'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              <Link href={`/trips/${trip.id}/build`}>
                <Button size="sm" variant="quiet">
                  <Plus size={14} /> <span>Edit in Builder</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* TIMELINE VIEW (Signature Experience) */}
          {viewMode === 'timeline' && (
            <ol className="spine space-y-6 pt-2">
              {(() => {
                let stopNumber = 0;
                let lastStopId = -1;

                return days.map((day, index) => {
                  const newStop = day.stop && day.stop.id !== lastStopId;
                  if (newStop) {
                    stopNumber += 1;
                    lastStopId = day.stop!.id;
                  }

                  return (
                    <li key={day.date} className="relative">
                      {/* City Stop Anchor Header */}
                      {newStop && day.stop && (
                        <div className="relative mb-4 mt-6 first:mt-0">
                          <span className="spine-node" style={{ top: 8 }}>
                            {stopNumber}
                          </span>
                          <div className="flex items-center gap-3.5 card p-3.5 bg-surface/90 border-rule shadow-xs">
                            <div className="h-12 w-14 shrink-0 overflow-hidden rounded-lg">
                              <Plate name={day.stop.city_name} ratio="h-full w-full" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-[20px] font-bold text-ink leading-tight">
                                  {day.stop.city_name}
                                </h3>
                                <span className="rounded bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand uppercase">
                                  Stop {stopNumber}
                                </span>
                              </div>
                              <p className="num text-[12.5px] text-slate mt-0.5">
                                {day.stop.country} · {day.stop.nights} {day.stop.nights === 1 ? 'night' : 'nights'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Day Card */}
                      <div className="card-elevated overflow-hidden bg-surface rounded-xl border-rule">
                        {/* Day Title Bar */}
                        <div className="flex items-center justify-between border-b border-rule bg-canvas-subtle px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-[15px] text-ink">{dayName(day.date)}</span>
                            <span className="text-[12px] font-mono text-mist">({shortDate(day.date)})</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="eyebrow text-[11px] font-bold text-brand">
                              Day {index + 1} of {days.length}
                            </span>
                            {day.spend > 0 && (
                              <span className="num font-bold text-[13px] text-ink">
                                {currency(day.spend)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Activities List */}
                        {day.activities.length === 0 ? (
                          <div className="p-5 text-center text-[13.5px] text-mist flex items-center justify-between">
                            <span>No activities scheduled for this day yet.</span>
                            <Link href={`/trips/${trip.id}/build`}>
                              <Button size="sm" variant="ghost">
                                <Plus size={13} /> Add Activity
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <ul className="divide-y divide-rule-subtle">
                            {day.activities.map((act) => {
                              const tone = categoryTone[act.category] || categoryTone.sightseeing;
                              return (
                                <li
                                  key={act.id}
                                  className="flex items-start gap-4 p-4 hover:bg-canvas/50 transition-colors"
                                >
                                  {/* Time Badge */}
                                  <div className="w-14 shrink-0 pt-0.5">
                                    <span className="num text-[13px] font-bold text-brand">
                                      {act.start_time ? act.start_time.slice(0, 5) : '—'}
                                    </span>
                                  </div>

                                  {/* Dot */}
                                  <span
                                    className="mt-2 h-2 w-2 shrink-0 rounded-full"
                                    style={{ background: tone.fg }}
                                  />

                                  {/* Details */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-bold text-[15px] text-ink">{act.title}</h4>
                                      <span
                                        className="rounded-full px-2 py-0.2 text-[10.5px] font-semibold uppercase tracking-wider"
                                        style={{ color: tone.fg, background: tone.bg }}
                                      >
                                        {act.category}
                                      </span>
                                    </div>

                                    {act.duration_minutes && (
                                      <p className="mt-1 flex items-center gap-1 text-[12px] text-slate">
                                        <Clock size={12} className="text-mist" />
                                        <span>{duration(act.duration_minutes)}</span>
                                      </p>
                                    )}
                                  </div>

                                  {/* Cost */}
                                  <div className="text-right shrink-0">
                                    <span className="num font-bold text-[14px] text-ink">
                                      {currency(Number(act.cost) * trip.travellers)}
                                    </span>
                                    {trip.travellers > 1 && (
                                      <p className="text-[11px] text-mist font-mono">
                                        {currency(act.cost)} ea
                                      </p>
                                    )}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                });
              })()}
            </ol>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div className="card overflow-hidden bg-surface divide-y divide-rule">
              {days.map((day, idx) => (
                <div key={day.date} className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[16px] text-ink">{dayName(day.date)}</span>
                      {day.stop && (
                        <span className="rounded bg-canvas px-2 py-0.5 text-[12px] font-semibold text-slate border border-rule">
                          {day.stop.city_name}
                        </span>
                      )}
                    </div>
                    <span className="num text-[13px] font-bold text-brand">
                      Day {idx + 1}
                    </span>
                  </div>

                  {day.activities.length === 0 ? (
                    <p className="text-[13px] text-mist italic">Free day — nothing scheduled</p>
                  ) : (
                    <div className="space-y-2">
                      {day.activities.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between rounded-lg bg-canvas-subtle px-3 py-2 text-[13.5px]"
                        >
                          <div className="flex items-center gap-3">
                            <span className="num font-bold text-[12px] text-slate w-12">
                              {a.start_time ? a.start_time.slice(0, 5) : '—'}
                            </span>
                            <span className="font-medium text-ink">{a.title}</span>
                          </div>
                          <span className="num font-semibold text-ink">
                            {currency(Number(a.cost) * trip.travellers)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CALENDAR VIEW */}
          {viewMode === 'calendar' && (
            <div className="card p-5 bg-surface space-y-4">
              <p className="eyebrow text-brand">Month Grid Distribution</p>
              <div className="grid grid-cols-7 gap-2 text-center text-[12px] font-mono text-mist border-b pb-2">
                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day, idx) => (
                  <div
                    key={day.date}
                    className="min-h-[90px] rounded-xl border border-rule p-2 flex flex-col justify-between bg-canvas-subtle hover:bg-canvas transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="num font-bold text-[12px] text-ink">{shortDate(day.date)}</span>
                      <span className="text-[10px] text-brand font-bold">D{idx + 1}</span>
                    </div>
                    <div className="space-y-1">
                      {day.activities.slice(0, 2).map((a) => (
                        <p key={a.id} className="text-[10px] font-medium truncate text-slate bg-surface px-1 py-0.5 rounded border border-rule">
                          {a.title}
                        </p>
                      ))}
                      {day.activities.length > 2 && (
                        <p className="text-[9.5px] text-mist font-bold">+{day.activities.length - 2} more</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ItineraryViewPage() {
  return (
    <PrivateRoute>
      <ItineraryViewContent />
    </PrivateRoute>
  );
}
