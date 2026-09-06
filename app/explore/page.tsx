'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  Compass,
  MapPin,
  Plus,
  Search,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { api, errorText } from '@/lib/api';
import { CATEGORIES, categoryTone, currency, duration } from '@/lib/format';
import type { Activity, City, Trip } from '@/lib/types';
import { Plate } from '@/components/Plate';
import { Button, Empty, Fieldset, Modal, Notice, Select, Spinner } from '@/components/ui';
import { PrivateRoute } from '@/components/AuthGuard';

type Tab = 'cities' | 'activities';

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = (searchParams.get('tab') as Tab) || 'cities';
  const qParam = searchParams.get('q') ?? '';

  const [tab, setTab] = useState<Tab>(tabParam);
  const [query, setQuery] = useState(qParam);
  const [sort, setSort] = useState('popularity');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [maxCost, setMaxCost] = useState('');
  const [category, setCategory] = useState('');
  const [maxDuration, setMaxDuration] = useState('');

  const [cities, setCities] = useState<City[] | null>(null);
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [facets, setFacets] = useState<{ countries: any[]; regions: any[] } | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [error, setError] = useState('');
  const [adding, setAdding] = useState<{ city?: City; activity?: Activity } | null>(null);

  useEffect(() => {
    api
      .get('/cities/facets')
      .then(({ data }) => setFacets(data))
      .catch(() => setFacets(null));
    api
      .get('/cities/saved/mine')
      .then(({ data }) => setSaved(new Set(data.cities.map((c: City) => c.id))))
      .catch(() => setSaved(new Set()));
  }, []);

  useEffect(() => {
    const next = new URLSearchParams();
    if (query) next.set('q', query);
    if (tab !== 'cities') next.set('tab', tab);
    router.replace(`/explore${next.toString() ? `?${next.toString()}` : ''}`);
  }, [query, tab, router]);

  useEffect(() => {
    if (tab !== 'cities') return;
    setCities(null);
    api
      .get('/cities', {
        params: {
          q: query || undefined,
          country: country || undefined,
          region: region || undefined,
          maxCost: maxCost || undefined,
          sort,
          limit: 60,
        },
      })
      .then(({ data }) => setCities(data.cities))
      .catch((err) => {
        setError(errorText(err));
        setCities([]);
      });
  }, [tab, query, country, region, maxCost, sort]);

  useEffect(() => {
    if (tab !== 'activities') return;
    setActivities(null);
    api
      .get('/activities', {
        params: {
          q: query || undefined,
          category: category || undefined,
          maxCost: maxCost || undefined,
          maxDuration: maxDuration || undefined,
          sort,
          limit: 80,
        },
      })
      .then(({ data }) => setActivities(data.activities))
      .catch((err) => {
        setError(errorText(err));
        setActivities([]);
      });
  }, [tab, query, category, maxCost, maxDuration, sort]);

  async function toggleSave(city: City) {
    const isSaved = saved.has(city.id);
    setSaved((current) => {
      const next = new Set(current);
      if (isSaved) next.delete(city.id);
      else next.add(city.id);
      return next;
    });
    try {
      if (isSaved) await api.delete(`/cities/${city.id}/save`);
      else await api.post(`/cities/${city.id}/save`);
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ------------------------------------------------ Header */}
      <div className="border-b border-rule pb-6 space-y-2">
        <p className="eyebrow text-brand">Destination Discovery</p>
        <h1 className="text-[30px] sm:text-[36px] font-black tracking-tight text-ink">
          Where do you want to go?
        </h1>
        <p className="text-[15px] text-slate max-w-2xl">
          Search global travel capitals and curated activities, bookmark your favorites, or inject them straight into your itineraries.
        </p>
      </div>

      {/* ------------------------------------------------ Tabs (Cities vs Activities) */}
      <div className="flex items-center gap-2 border-b border-rule pb-1">
        {(['cities', 'activities'] as Tab[]).map((key) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              setMaxCost('');
            }}
            className={`px-4 py-2.5 rounded-xl text-[14px] font-bold transition-all cursor-pointer ${
              tab === key
                ? 'bg-brand text-white shadow-xs'
                : 'text-slate hover:bg-canvas hover:text-ink'
            }`}
          >
            {key === 'cities' ? 'Destinations & Cities' : 'Curated Activities'}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------ Search & Filter Bar */}
      <div className="card p-4 bg-surface space-y-3.5 border-rule">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === 'cities'
                ? 'Search cities by name, country, or region (e.g. Tokyo, France, Asia)...'
                : 'Search activities by keyword (e.g. food tour, museum, hike)...'
            }
            className="field pl-10 h-11 text-[14.5px]"
          />
        </div>

        {/* Quick Filter Chips */}
        {tab === 'activities' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setCategory('')}
              className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                category === '' ? 'bg-ink text-white' : 'bg-canvas text-slate hover:text-ink'
              }`}
            >
              All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? '' : cat)}
                className={`px-3 py-1 rounded-full text-[12px] font-semibold transition-all cursor-pointer capitalize whitespace-nowrap ${
                  category === cat ? 'bg-brand text-white' : 'bg-canvas text-slate hover:text-ink'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-rule-subtle text-[13px]">
          <div className="flex flex-wrap items-center gap-3">
            {tab === 'cities' ? (
              <>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="field h-8.5 text-[12.5px] w-auto"
                >
                  <option value="">All Regions</option>
                  {facets?.regions.map((r: any) => (
                    <option key={r.region} value={r.region}>
                      {r.region} ({r.n})
                    </option>
                  ))}
                </select>

                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="field h-8.5 text-[12.5px] w-auto"
                >
                  <option value="">All Countries</option>
                  {facets?.countries.map((c: any) => (
                    <option key={c.country} value={c.country}>
                      {c.country}
                    </option>
                  ))}
                </select>

                <select
                  value={maxCost}
                  onChange={(e) => setMaxCost(e.target.value)}
                  className="field h-8.5 text-[12.5px] w-auto"
                >
                  <option value="">Any Daily Cost</option>
                  <option value="60">Under $60 / day</option>
                  <option value="100">Under $100 / day</option>
                  <option value="150">Under $150 / day</option>
                </select>
              </>
            ) : (
              <>
                <select
                  value={maxCost}
                  onChange={(e) => setMaxCost(e.target.value)}
                  className="field h-8.5 text-[12.5px] w-auto"
                >
                  <option value="">Any Price</option>
                  <option value="0">Free Only</option>
                  <option value="30">Under $30</option>
                  <option value="60">Under $60</option>
                  <option value="120">Under $120</option>
                </select>

                <select
                  value={maxDuration}
                  onChange={(e) => setMaxDuration(e.target.value)}
                  className="field h-8.5 text-[12.5px] w-auto"
                >
                  <option value="">Any Duration</option>
                  <option value="60">Under 1 hour</option>
                  <option value="180">Under 3 hours</option>
                  <option value="360">Half day or more</option>
                </select>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-mist">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="field h-8.5 text-[12.5px] w-auto font-medium"
            >
              <option value="popularity">Most Popular</option>
              <option value="cost-low">Lowest Cost</option>
              <option value="cost-high">Highest Cost</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {error && <Notice>{error}</Notice>}

      {/* ------------------------------------------------ Results Grid */}
      {tab === 'cities' ? (
        cities === null ? (
          <Spinner label="Searching destinations" />
        ) : cities.length === 0 ? (
          <Empty
            title="No destinations found"
            body="Try loosening your filters or searching for another country or region."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => {
              const isSaved = saved.has(city.id);
              return (
                <div
                  key={city.id}
                  className="card group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-surface border-rule flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Plate name={city.name} ratio="h-full w-full" label={city.region} />
                    <button
                      onClick={() => toggleSave(city)}
                      className="absolute right-3 top-3 z-10 rounded-full bg-surface/90 p-2 text-slate shadow-sm hover:text-brand backdrop-blur-md cursor-pointer transition-colors"
                      aria-label={isSaved ? 'Remove bookmark' : 'Bookmark city'}
                    >
                      {isSaved ? <BookmarkCheck size={16} className="text-brand" /> : <Bookmark size={16} />}
                    </button>
                  </div>

                  <div className="p-5 flex flex-1 flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-[19px] font-bold text-ink group-hover:text-brand transition-colors truncate">
                          {city.name}
                        </h3>
                        <span className="num font-bold text-[14px] text-ink shrink-0">
                          {currency(city.cost_index)}
                          <span className="text-[11px] font-normal text-mist">/day</span>
                        </span>
                      </div>
                      <p className="text-[13px] text-slate font-medium">{city.country}</p>
                      {city.description && (
                        <p className="mt-2 line-clamp-2 text-[13px] text-slate leading-relaxed">
                          {city.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between border-t border-rule-subtle pt-3.5">
                      <span className="text-[12px] font-mono text-mist">
                        {city.activity_count ?? 0} activities
                      </span>
                      <Button size="sm" variant="primary" onClick={() => setAdding({ city })}>
                        <Plus size={13} /> Add to Trip
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : activities === null ? (
        <Spinner label="Searching activities" />
      ) : activities.length === 0 ? (
        <Empty
          title="No activities match"
          body="Try adjusting category filters or price constraints."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {activities.map((act) => {
            const tone = categoryTone[act.category] || categoryTone.sightseeing;
            return (
              <div
                key={act.id}
                className="card p-4 flex items-start justify-between gap-4 bg-surface hover:shadow-md transition-all rounded-xl border-rule"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2 py-0.2 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: tone.fg, background: tone.bg }}
                    >
                      {act.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11.5px] text-amber font-semibold">
                      <Star size={11} className="fill-amber" /> 4.8
                    </span>
                  </div>

                  <h4 className="text-[15.5px] font-bold text-ink truncate">{act.name}</h4>
                  {act.description && (
                    <p className="line-clamp-1 text-[13px] text-slate">{act.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-mist font-medium pt-1">
                    <span className="inline-flex items-center gap-1 text-slate">
                      <MapPin size={11} className="text-sunset" /> {act.city_name}, {act.country}
                    </span>
                    {act.duration_minutes && (
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} /> {duration(act.duration_minutes)}
                      </span>
                    )}
                    <span className="num font-bold text-ink">
                      {Number(act.cost) === 0 ? 'Free' : currency(act.cost)}
                    </span>
                  </div>
                </div>

                <Button size="sm" variant="quiet" onClick={() => setAdding({ activity: act })} className="shrink-0">
                  <Plus size={13} /> Add
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------ Add To Trip Modal */}
      <AddToTripModal target={adding} onClose={() => setAdding(null)} />
    </div>
  );
}

function AddToTripModal({
  target,
  onClose,
}: {
  target: { city?: City; activity?: Activity } | null;
  onClose: () => void;
}) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripId, setTripId] = useState('');
  const [stopId, setStopId] = useState('');
  const [detail, setDetail] = useState<Trip | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');

  useEffect(() => {
    if (!target) return;
    setError('');
    setDone('');
    setTripId('');
    setStopId('');
    setDetail(null);
    api
      .get('/trips')
      .then(({ data }) => setTrips(data.trips))
      .catch(() => setTrips([]));
  }, [target]);

  useEffect(() => {
    if (!tripId) {
      setDetail(null);
      return;
    }
    api
      .get(`/trips/${tripId}`)
      .then(({ data }) => {
        setDetail(data.trip);
        const match = target?.activity
          ? data.trip.stops.find((s: any) => s.city_id === target.activity!.city_id)
          : null;
        setStopId(match ? String(match.id) : '');
      })
      .catch(() => setDetail(null));
  }, [tripId, target]);

  async function addCity() {
    if (!tripId || !target?.city) return;
    setBusy(true);
    setError('');
    try {
      const city = target.city;
      const trip = trips.find((t) => String(t.id) === tripId)!;
      await api.post(`/trips/${tripId}/stops`, {
        cityId: city.id,
        startDate: trip.start_date,
        endDate: trip.end_date,
      });
      setDone(`Added ${city.name} to ${trip.name}.`);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function addActivity() {
    if (!tripId || !stopId || !target?.activity) return;
    setBusy(true);
    setError('');
    try {
      const a = target.activity;
      const stop = detail?.stops.find((s) => String(s.id) === stopId);
      await api.post(`/trips/${tripId}/stops/${stopId}/activities`, {
        title: a.name,
        category: a.category,
        cost: a.cost,
        scheduledDate: stop?.start_date,
        durationMinutes: a.duration_minutes || 120,
      });
      setDone(`Added "${a.name}" to ${stop?.city_name}.`);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  const title = target?.city
    ? `Add ${target.city.name} to a trip`
    : target?.activity
    ? `Add "${target.activity.name}" to a trip`
    : '';

  return (
    <Modal open={Boolean(target)} onClose={onClose} title={title}>
      <div className="space-y-4">
        {error && <Notice>{error}</Notice>}
        {done && <Notice tone="sea">{done}</Notice>}

        {trips.length === 0 ? (
          <p className="text-[13.5px] text-slate">
            You don&apos;t have any active trips yet. Create a trip first to add places to it.
          </p>
        ) : (
          <>
            <Fieldset label="Choose a trip">
              <Select value={tripId} onChange={(e) => setTripId(e.target.value)}>
                <option value="">Select trip...</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </Fieldset>

            {target?.activity && tripId && (
              <Fieldset label="Select stop in this trip">
                <Select value={stopId} onChange={(e) => setStopId(e.target.value)}>
                  <option value="">Choose stop...</option>
                  {(detail?.stops ?? []).map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.city_name}
                    </option>
                  ))}
                </Select>
              </Fieldset>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button onClick={onClose}>Cancel</Button>
              <Button
                variant="primary"
                busy={busy}
                disabled={!tripId || (target?.activity && !stopId)}
                onClick={target?.city ? addCity : addActivity}
              >
                Confirm & Add
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default function ExplorePage() {
  return (
    <PrivateRoute>
      <Suspense fallback={<div className="py-20"><Spinner label="Loading discovery catalog" /></div>}>
        <ExploreContent />
      </Suspense>
    </PrivateRoute>
  );
}
