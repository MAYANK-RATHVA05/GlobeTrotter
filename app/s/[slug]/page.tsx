'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Check,
  Clock,
  Compass,
  Copy,
  CopyPlus,
  Eye,
  MapPin,
  Share2,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { api, errorText, getToken } from '@/lib/api';
import { categoryTone, costLabel, costTone, currency, dateRange, dayName, duration, eachDate, stopForDate } from '@/lib/format';
import type { Trip, TripActivity } from '@/lib/types';
import { Brand } from '@/components/Brand';
import { Avatar, Plate } from '@/components/Plate';
import { Button, Notice, Spinner } from '@/components/ui';

export default function PublicTripPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState('');
  const [copying, setCopying] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.get(`/public/trips/${slug}`)
      .then(({ data }) => setTrip(data.trip))
      .catch((err) => setError(errorText(err)));
  }, [slug]);

  async function copyTrip() {
    if (!getToken()) {
      router.push(`/login?from=/s/${slug}`);
      return;
    }
    setCopying(true);
    try {
      const { data } = await api.post(`/public/trips/${slug}/copy`);
      router.push(`/trips/${data.trip.id}/build`);
    } catch (err) {
      setError(errorText(err));
      setCopying(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href).catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1800);
  }

  if (error) {
    return (
      <PublicFrame>
        <div className="mx-auto max-w-md py-24 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-flag-soft text-flag">
            <Compass size={28} />
          </div>
          <h1 className="text-[26px] font-bold text-ink">This itinerary is not available</h1>
          <p className="text-[14.5px] text-slate">{error}</p>
          <Link href="/">
            <Button variant="primary">Explore GlobeTrotter</Button>
          </Link>
        </div>
      </PublicFrame>
    );
  }

  if (!trip) {
    return (
      <PublicFrame>
        <div className="py-24">
          <Spinner label="Loading the travel guide" />
        </div>
      </PublicFrame>
    );
  }

  const days: { date: string; stop: Trip['stops'][number] | null; activities: TripActivity[] }[] =
    eachDate(trip.start_date, trip.end_date).map((date) => ({
      date,
      stop: stopForDate(trip.stops, date),
      activities: trip.stops.flatMap((s) => s.activities).filter((a) => a.scheduled_date === date),
    }));

  return (
    <PublicFrame>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* ------------------------------------------------ Hero Travel Guide Banner */}
        <section className="card-elevated overflow-hidden rounded-3xl bg-surface border-rule">
          <div className="relative aspect-[16/6] sm:aspect-[21/8] w-full overflow-hidden">
            <Plate
              name={trip.stops[0]?.city_name ?? trip.name}
              ratio="h-full w-full"
              label={trip.stops[0]?.region}
            />
            <div className="absolute top-4 left-4 z-10">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md uppercase tracking-wider">
                <Eye size={12} /> Verified Travel Guide
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div>
              <h1 className="text-[28px] sm:text-[38px] font-black text-ink tracking-tight leading-tight">
                {trip.name}
              </h1>

              {/* Route sequence */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {trip.stops.map((stop, idx) => (
                  <span key={stop.id} className="inline-flex items-center gap-1.5">
                    {idx > 0 && <span className="text-mist text-[13px]">→</span>}
                    <span className="inline-flex items-center gap-1 rounded-md bg-canvas px-2.5 py-1 text-[13px] font-semibold text-slate border border-rule">
                      <MapPin size={12} className="text-sunset" />
                      {stop.city_name}
                    </span>
                  </span>
                ))}
              </div>

              {trip.description && (
                <p className="mt-3 text-[15px] text-slate leading-relaxed">
                  {trip.description}
                </p>
              )}
            </div>

            {/* Author & Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-rule pt-5">
              <div className="flex items-center gap-3">
                <Avatar name={trip.owner_name ?? 'Traveller'} size={38} />
                <div>
                  <p className="text-[14px] font-bold text-ink">{trip.owner_name}</p>
                  <p className="text-[12px] text-mist font-medium">
                    {dateRange(trip.start_date, trip.end_date)} · {trip.days} Days · {trip.stops.length} Cities
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button onClick={copyLink}>
                  {linkCopied ? <><Check size={14} /> Copied Link</> : <><Copy size={14} /> Share</>}
                </Button>
                <Button variant="primary" busy={copying} onClick={copyTrip} className="shadow-md shadow-brand/15">
                  <CopyPlus size={15} />
                  <span>Copy This Trip</span>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ Cost Breakdown Summary */}
        <section className="card p-6 bg-surface space-y-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-3">
            <h2 className="flex items-center gap-2 text-[18px] font-bold text-ink">
              <Wallet size={16} className="text-brand" />
              <span>Estimated Cost Breakdown</span>
            </h2>
            <p className="num text-[22px] font-black text-ink">{currency(trip.budget.total)}</p>
          </div>

          <p className="text-[12.5px] text-slate font-medium">
            {currency(trip.budget.perTraveller)} per person · {currency(trip.budget.averagePerDay)} a day · {trip.travellers} {trip.travellers === 1 ? 'traveller' : 'travellers'}
          </p>

          <div className="flex h-2.5 overflow-hidden rounded-full border border-rule">
            {trip.budget.breakdown.map((line) => (
              <span
                key={line.category}
                className="border-r border-surface last:border-r-0"
                style={{
                  width: `${(line.amount / trip.budget.total) * 100}%`,
                  background: costTone[line.category] ?? '#0D7A5F',
                }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {trip.budget.breakdown.map((line) => (
              <div key={line.category} className="card p-2.5 bg-canvas-subtle text-[12px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: costTone[line.category] ?? '#0D7A5F' }}
                  />
                  <span className="text-slate font-medium truncate">{costLabel[line.category] ?? line.category}</span>
                </div>
                <p className="num font-bold text-[14px] text-ink">{currency(line.amount)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------ Day-by-Day Timeline */}
        <section className="space-y-4">
          <h2 className="text-[22px] font-bold text-ink">The Complete Itinerary</h2>
          <ol className="spine space-y-6">
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
                    {newStop && day.stop && (
                      <div className="relative mb-3 mt-6 first:mt-0">
                        <span className="spine-node" style={{ top: 6 }}>
                          {stopNumber}
                        </span>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-12 shrink-0 overflow-hidden rounded-md">
                            <Plate name={day.stop.city_name} ratio="h-full w-full" />
                          </div>
                          <div>
                            <h3 className="text-[19px] font-bold text-ink leading-tight">
                              {day.stop.city_name}
                            </h3>
                            <p className="num text-[12px] text-mist">
                              {day.stop.country} · {day.stop.nights} nights
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="card overflow-hidden bg-surface rounded-xl border-rule">
                      <div className="flex items-baseline justify-between border-b border-rule bg-canvas-subtle px-4 py-2.5">
                        <span className="text-[14.5px] font-bold text-ink">{dayName(day.date)}</span>
                        <span className="eyebrow text-[11px] font-semibold text-brand">
                          Day {index + 1}
                        </span>
                      </div>

                      {day.activities.length === 0 ? (
                        <p className="px-4 py-3 text-[13px] text-mist italic">Free day to explore.</p>
                      ) : (
                        <ul className="divide-y divide-rule-subtle">
                          {day.activities.map((act) => {
                            const tone = categoryTone[act.category] || categoryTone.sightseeing;
                            return (
                              <li key={act.id} className="flex items-start gap-3 px-4 py-3 text-[13.5px]">
                                <span className="num w-12 shrink-0 font-bold text-[12px] text-brand pt-0.5">
                                  {act.start_time ? act.start_time.slice(0, 5) : '—'}
                                </span>
                                <span
                                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                                  style={{ background: tone.fg }}
                                />
                                <div className="min-w-0 flex-1">
                                  <span className="block font-bold text-ink">{act.title}</span>
                                  <span className="text-[11.5px] text-slate">
                                    {act.category} {act.duration_minutes ? `· ${duration(act.duration_minutes)}` : ''}
                                  </span>
                                </div>
                                <span className="num font-bold text-ink">
                                  {currency(Number(act.cost) * trip.travellers)}
                                </span>
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
        </section>

        {/* ------------------------------------------------ Copy Callout Banner */}
        <div className="card p-8 bg-gradient-to-r from-brand-soft/60 to-surface text-center space-y-3 rounded-2xl border-brand/20">
          <Sparkles size={24} className="mx-auto text-brand" />
          <h3 className="text-[20px] font-bold text-ink">Want to customize this journey?</h3>
          <p className="text-[14px] text-slate max-w-md mx-auto">
            Copy this itinerary into your own account to adjust travel dates, swap activities, and calculate your personal budget.
          </p>
          <div className="pt-2">
            <Button size="lg" variant="primary" busy={copying} onClick={copyTrip}>
              <CopyPlus size={16} />
              <span>Copy This Trip to My Account</span>
            </Button>
          </div>
        </div>
      </div>
    </PublicFrame>
  );
}

function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-40 border-b border-rule bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <Brand />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/explore">
              <Button size="sm" variant="ghost">Explore Places</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" variant="primary">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6">{children}</main>
    </div>
  );
}
