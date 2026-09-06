'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Compass,
  Heart,
  MapPin,
  MessageSquare,
  Plus,
  Route as RouteIcon,
  Search,
  Sparkles,
  User,
} from 'lucide-react';
import { api, errorText } from '@/lib/api';
import { useAuth } from '@/lib/client-auth';
import { longDate } from '@/lib/format';
import { getCityPhoto } from '@/lib/destination-photos';
import type { City, Post, Trip } from '@/lib/types';
import { Avatar } from '@/components/Plate';
import { Button, Empty, Fieldset, Input, Modal, Notice, Select, Spinner, Textarea } from '@/components/ui';
import { PrivateRoute } from '@/components/AuthGuard';

interface SharedTrip {
  id: number;
  name: string;
  description: string | null;
  share_slug: string;
  owner_name: string;
  stop_count: number;
  route: string | null;
  start_date: string;
  end_date: string;
}

function CommunityContent() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [shared, setShared] = useState<SharedTrip[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('newest');
  const [cityFilter, setCityFilter] = useState('');
  const [error, setError] = useState('');
  const [writing, setWriting] = useState(false);

  const load = () => {
    api
      .get('/community', { params: { q: query || undefined, sort } })
      .then(({ data }) => setPosts(data.posts))
      .catch((err) => {
        setError(errorText(err));
        setPosts([]);
      });
  };

  useEffect(load, [query, sort]);

  useEffect(() => {
    api
      .get('/public/trips', { params: { limit: 8 } })
      .then(({ data }) => setShared(data.trips))
      .catch(() => setShared([]));
  }, []);

  const cityOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const post of posts ?? []) {
      if (post.city_name) seen.set(post.city_name, post.city_name);
    }
    return [...seen.keys()].sort();
  }, [posts]);

  async function like(post: Post) {
    setPosts((current) =>
      (current ?? []).map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: p.liked_by_me ? 0 : 1, like_count: p.like_count + (p.liked_by_me ? -1 : 1) }
          : p
      )
    );
    try {
      await api.post(`/community/${post.id}/like`);
    } catch (err) {
      setError(errorText(err));
      load();
    }
  }

  return (
    <div className="pb-16">
      {/* Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-sand-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-terracotta-600">Traveler Dispatch</span>
            <span className="inline-flex items-center rounded-full bg-sand-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              Community Field Notes
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">Field Notes & Dispatch</h1>
          <p className="max-w-xl text-xs text-slate-600">
            Real insights, unvarnished advice, and memorable encounters documented by fellow travelers on the road.
          </p>
        </div>
        <Button variant="primary" onClick={() => setWriting(true)}>
          <Plus size={14} /> Write Field Note
        </Button>
      </header>

      {/* Featured Community Itineraries Carousel */}
      {shared.length > 0 && (
        <section className="mb-8">
          <div className="mb-3 flex items-baseline justify-between border-b border-sand-200 pb-2">
            <div>
              <span className="eyebrow text-brand-700">Shared Journeys</span>
              <h2 className="font-serif text-lg font-bold text-ink">Curated Routes to Clone</h2>
            </div>
            <span className="text-xs text-slate-500">Publicly shared itineraries</span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-2">
            {shared.map((trip) => {
              const firstCity = trip.route?.split(' → ')[0] ?? trip.name;
              const photo = getCityPhoto(firstCity);
              return (
                <Link
                  key={trip.id}
                  href={`/s/${trip.share_slug}`}
                  className="group w-[260px] shrink-0 overflow-hidden rounded-2xl border border-sand-200 bg-surface shadow-xs transition-all hover:border-sand-300 hover:shadow-md"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand-100">
                    <img
                      src={photo}
                      alt={trip.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                      {trip.stop_count} {trip.stop_count === 1 ? 'Stop' : 'Stops'}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <h3 className="truncate font-serif text-base font-bold text-ink">{trip.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{trip.route ?? 'Custom Route'}</p>
                    <p className="mt-2 text-[11px] font-medium text-slate-400">Curated by {trip.owner_name}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Filter and Search Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[260px] flex-1 items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search recommendations, dishes, tips..."
              className="h-9 w-full rounded-xl border border-sand-200 bg-surface pl-8.5 pr-3 text-xs text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none"
            />
          </div>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="h-9 rounded-xl border border-sand-200 bg-surface px-3 text-xs text-ink focus:border-brand-500 focus:outline-none"
          >
            <option value="">All Destinations</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-xl border border-sand-200 bg-surface px-3 text-xs font-medium text-ink focus:border-brand-500 focus:outline-none"
          >
            <option value="newest">Most Recent</option>
            <option value="liked">Most Helpful (Liked)</option>
            <option value="oldest">Earliest</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      )}

      {/* Posts List */}
      {posts === null ? (
        <div className="py-20">
          <Spinner label="Loading traveler field notes..." />
        </div>
      ) : posts.length === 0 ? (
        <Empty
          title="No Field Notes Dispatched Yet"
          body="Contribute the first dispatch. A concise insider tip about a train route, cafe, or neighborhood is invaluable to fellow explorers."
          action={
            <Button variant="primary" onClick={() => setWriting(true)}>
              <Plus size={14} /> Write the First Field Note
            </Button>
          }
        />
      ) : (
        <ul className="space-y-4">
          {posts
            .filter((p) => !cityFilter || p.city_name === cityFilter)
            .map((post) => (
              <li
                key={post.id}
                className="overflow-hidden rounded-2xl border border-sand-200 bg-surface p-5 shadow-xs transition-all hover:border-sand-300 hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 overflow-hidden rounded-xl border border-sand-200">
                    <Avatar name={post.author_name} src={post.author_photo} size={44} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-ink">{post.author_name}</span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">{longDate(post.created_at.slice(0, 10))}</span>
                      </div>

                      {post.city_name && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          <MapPin size={11} className="text-terracotta-500" />
                          {post.city_name}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-2 font-serif text-lg font-bold text-ink">{post.title}</h3>
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {post.body}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-between border-t border-sand-100 pt-3 text-xs">
                      <button
                        onClick={() => like(post)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold transition-colors ${
                          post.liked_by_me
                            ? 'bg-rose-50 text-rose-600'
                            : 'text-slate-500 hover:bg-sand-100 hover:text-rose-600'
                        }`}
                        aria-pressed={Boolean(post.liked_by_me)}
                      >
                        <Heart size={14} fill={post.liked_by_me ? 'currentColor' : 'none'} />
                        <span>{post.like_count} found helpful</span>
                      </button>

                      {post.share_slug && (
                        <Link
                          href={`/s/${post.share_slug}`}
                          className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:underline"
                        >
                          <RouteIcon size={12} /> View Associated Itinerary →
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
        </ul>
      )}

      <WriteModal
        open={writing}
        onClose={() => {
          setWriting(false);
          load();
        }}
      />
    </div>
  );
}

function WriteModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [form, setForm] = useState({ title: '', body: '', tripId: '', cityId: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({ title: '', body: '', tripId: '', cityId: '' });
    setError('');
    api
      .get('/trips')
      .then(({ data }) => setTrips(data.trips))
      .catch(() => setTrips([]));
    api
      .get('/cities', { params: { limit: 60, sort: 'name' } })
      .then(({ data }) => setCities(data.cities))
      .catch(() => setCities([]));
  }, [open]);

  async function save() {
    setBusy(true);
    setError('');
    try {
      await api.post('/community', {
        title: form.title,
        body: form.body,
        tripId: form.tripId || null,
        cityId: form.cityId || null,
      });
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Dispatch a Travel Field Note">
      <div className="space-y-4">
        <Fieldset label="Note Title / Headline" hint="Focus on the most valuable insight">
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Reserve sunrise passage at the mountain gate ahead of time"
            className="text-xs"
          />
        </Fieldset>

        <Fieldset label="Your Insight / Field Report">
          <Textarea
            rows={5}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Describe what you discovered, costs, tips on queues, unexpected highlights..."
            className="text-xs"
          />
        </Fieldset>

        <div className="grid gap-3 sm:grid-cols-2">
          <Fieldset label="Destination" hint="Optional">
            <Select
              value={form.cityId}
              onChange={(e) => setForm({ ...form, cityId: e.target.value })}
              className="text-xs"
            >
              <option value="">Global / General Advice</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}, {city.country}
                </option>
              ))}
            </Select>
          </Fieldset>

          <Fieldset label="Attach Public Itinerary" hint="Optional">
            <Select
              value={form.tripId}
              onChange={(e) => setForm({ ...form, tripId: e.target.value })}
              className="text-xs"
            >
              <option value="">No itinerary linked</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.name}
                </option>
              ))}
            </Select>
          </Fieldset>
        </div>

        {error && <Notice>{error}</Notice>}

        <Button variant="primary" busy={busy} onClick={save} className="w-full">
          <Plus size={14} /> Publish Field Note
        </Button>
      </div>
    </Modal>
  );
}

export default function CommunityPage() {
  return (
    <PrivateRoute>
      <CommunityContent />
    </PrivateRoute>
  );
}
