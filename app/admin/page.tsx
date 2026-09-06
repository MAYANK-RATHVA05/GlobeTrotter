'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Compass, MapPin, ShieldCheck, Trash2, TrendingUp, UserCog, Users } from 'lucide-react';
import { api, errorText } from '@/lib/api';
import { useAuth } from '@/lib/client-auth';
import { categoryTone, costTone, longDate } from '@/lib/format';
import { ControlStrip } from '@/components/ControlStrip';
import { Avatar } from '@/components/Plate';
import { Button, Empty, Modal, Notice, Spinner } from '@/components/ui';
import { AdminOnlyRoute } from '@/components/AuthGuard';

type Tab = 'users' | 'cities' | 'activities' | 'trends';

interface Stats {
  totals: { users: number; trips: number; stops: number; activities: number; shared_trips: number; posts: number };
  tripsByMonth: { month: string; trips: number }[];
  topCities: { id: number; name: string; country: string; visits: number }[];
  topActivities: { title: string; times_added: number; avg_cost: number }[];
  categoryMix: { category: keyof typeof categoryTone; n: number }[];
  avgTripDays: number;
}

interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  city: string | null;
  country: string | null;
  role: 'user' | 'admin';
  created_at: string;
  trip_count: number;
  last_trip_at: string | null;
}

const TABS: { key: Tab; label: string; blurb: string }[] = [
  { key: 'users', label: 'User Directory', blurb: 'Member accounts, verification status, and planned itineraries.' },
  { key: 'cities', label: 'Popular Destinations', blurb: 'High-frequency cities and stop volume across member trips.' },
  { key: 'activities', label: 'Curated Experiences', blurb: 'Most scheduled activities and budget distribution.' },
  { key: 'trends', label: 'Platform Growth', blurb: 'Longitudinal creation trends and multi-stop trip metrics.' },
];

function AdminContent() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('users');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('trips');
  const [error, setError] = useState('');
  const [inspect, setInspect] = useState<AdminUser | null>(null);

  const load = () => {
    api
      .get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(errorText(err)));
    api
      .get('/admin/users')
      .then(({ data }) => setUsers(data.users))
      .catch((err) => setError(errorText(err)));
  };
  useEffect(load, []);

  const shownUsers = useMemo(() => {
    let list = users;
    if (query) {
      const needle = query.toLowerCase();
      list = list.filter((u) => `${u.first_name} ${u.last_name} ${u.email} ${u.city ?? ''}`.toLowerCase().includes(needle));
    }
    const order: Record<string, (a: AdminUser, b: AdminUser) => number> = {
      trips: (a, b) => b.trip_count - a.trip_count,
      newest: (a, b) => b.created_at.localeCompare(a.created_at),
      name: (a, b) => a.first_name.localeCompare(b.first_name),
    };
    return [...list].sort(order[sort] ?? order.trips);
  }, [users, query, sort]);

  async function setRole(target: AdminUser, role: 'user' | 'admin') {
    try {
      await api.patch(`/admin/users/${target.id}`, { role });
      setUsers((current) => current.map((u) => (u.id === target.id ? { ...u, role } : u)));
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function removeUser(target: AdminUser) {
    try {
      await api.delete(`/admin/users/${target.id}`);
      setUsers((current) => current.filter((u) => u.id !== target.id));
      setInspect(null);
    } catch (err) {
      setError(errorText(err));
    }
  }

  if (error && !stats) return <Notice>{error}</Notice>;
  if (!stats) return <Spinner label="Loading administrative platform analytics" />;

  const active = TABS.find((t) => t.key === tab)!;

  return (
    <div className="pb-16">
      {/* Admin Header */}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-sand-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-terracotta-600 inline-flex items-center gap-1">
              <ShieldCheck size={12} /> Executive Console
            </span>
            <span className="rounded-full bg-sand-200 px-2 py-0.5 text-[11px] font-medium text-slate-700">
              Admin: {user?.first_name}
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-ink">Administrative Dashboard</h1>
          <p className="max-w-xl text-xs text-slate-600">
            Real-time telemetry, database row tallies, user governance, and platform-wide trip activity.
          </p>
        </div>
      </header>

      {/* Metric Tiles Grid */}
      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Active Users" value={stats.totals.users} icon={Users} />
        <Tile label="Total Itineraries" value={stats.totals.trips} icon={Compass} />
        <Tile label="Destination Stops" value={stats.totals.stops} icon={MapPin} />
        <Tile label="Scheduled Activities" value={stats.totals.activities} icon={Activity} />
        <Tile label="Shared Guides" value={stats.totals.shared_trips} icon={TrendingUp} />
        <Tile label="Avg Duration" value={`${stats.avgTripDays} days`} />
      </section>

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-sand-200">
        {TABS.map((entry) => (
          <button
            key={entry.key}
            onClick={() => setTab(entry.key)}
            className={`-mb-px border-b-2 px-4 pb-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === entry.key
                ? 'border-brand-600 text-brand-800'
                : 'border-transparent text-slate-500 hover:text-ink'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-xs text-slate-500">{active.blurb}</p>
      {error && (
        <div className="mb-4">
          <Notice>{error}</Notice>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <>
          <ControlStrip
            query={query}
            onQuery={setQuery}
            placeholder="Filter travelers by name, email, or city..."
            sortBy={sort}
            onSortBy={setSort}
            sortOptions={[
              { value: 'trips', label: 'Most Trips' },
              { value: 'newest', label: 'Recently Registered' },
              { value: 'name', label: 'Alphabetical' },
            ]}
          />

          <div className="overflow-hidden rounded-2xl border border-sand-200 bg-surface shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="border-b border-sand-200 bg-sand-50/70 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3 text-left">Traveler</th>
                    <th className="px-3 py-3 text-left">Location</th>
                    <th className="px-3 py-3 text-right">Trips</th>
                    <th className="px-3 py-3 text-left">Joined</th>
                    <th className="px-3 py-3 text-left">Access Role</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200">
                  {shownUsers.map((row) => (
                    <tr key={row.id} className="transition-colors hover:bg-sand-50/40">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2.5">
                          <Avatar name={`${row.first_name} ${row.last_name}`} size={28} />
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-ink">
                              {row.first_name} {row.last_name}
                            </span>
                            <span className="block truncate text-[11px] text-slate-500">{row.email}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {[row.city, row.country].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="px-3 py-3 text-right font-serif font-bold text-ink">{row.trip_count}</td>
                      <td className="px-3 py-3 text-slate-500">{longDate(row.created_at.slice(0, 10))}</td>
                      <td className="px-3 py-3">
                        <select
                          value={row.role}
                          onChange={(e) => setRole(row, e.target.value as 'user' | 'admin')}
                          className="rounded-lg border border-sand-200 bg-surface px-2 py-1 text-xs font-semibold text-ink"
                          aria-label={`Role for ${row.first_name}`}
                        >
                          <option value="user">User</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setInspect(row)} className="h-7 text-xs">
                          <UserCog size={13} /> View Trips
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {shownUsers.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-slate-500">No member accounts match that filter query.</p>
            )}
          </div>
        </>
      )}

      {/* Cities Tab */}
      {tab === 'cities' &&
        (stats.topCities.length === 0 ? (
          <Empty
            title="No destination stops recorded"
            body="As travelers plan journeys and add cities, live destination rankings will populate automatically."
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-2xl border border-sand-200 bg-surface p-5 shadow-xs">
              <h2 className="font-serif text-lg font-bold text-ink">Most Visited Destinations</h2>
              <p className="mb-4 text-xs text-slate-500">Total times included in verified itinerary stops.</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topCities} layout="vertical" margin={{ left: 4, right: 28, top: 4, bottom: 4 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={100}
                      tick={{ fontSize: 12, fill: '#4B5563' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip cursor={{ fill: '#F5F5F0' }} content={<PlainTooltip suffix="stops" />} />
                    <Bar dataKey="visits" radius={[0, 6, 6, 0]} fill="#0D7A5F" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-sand-200 bg-surface shadow-xs">
              <div className="border-b border-sand-200 bg-sand-50/70 px-4 py-3">
                <h3 className="font-serif text-sm font-bold text-ink">Stop Tally Summary</h3>
              </div>
              <table className="w-full text-xs">
                <tbody className="divide-y divide-sand-200">
                  {stats.topCities.map((city, index) => (
                    <tr key={city.id} className="hover:bg-sand-50/30">
                      <td className="w-8 px-3 py-2.5 font-mono text-slate-400">{index + 1}</td>
                      <td className="px-1 py-2.5 font-bold text-ink">{city.name}</td>
                      <td className="px-3 py-2.5 text-slate-500">{city.country}</td>
                      <td className="px-4 py-2.5 text-right font-serif font-bold text-brand-700">{city.visits} stops</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {/* Activities Tab */}
      {tab === 'activities' && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="overflow-hidden rounded-2xl border border-sand-200 bg-surface shadow-xs">
            <div className="border-b border-sand-200 bg-sand-50/70 px-4 py-3">
              <h3 className="font-serif text-sm font-bold text-ink">Most Scheduled Experiences</h3>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-sand-200 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-2.5 text-left">Activity Title</th>
                  <th className="px-3 py-2.5 text-right">Scheduled</th>
                  <th className="px-4 py-2.5 text-right">Avg Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200">
                {stats.topActivities.map((row) => (
                  <tr key={row.title} className="hover:bg-sand-50/30">
                    <td className="px-4 py-2.5 font-semibold text-ink">{row.title}</td>
                    <td className="px-3 py-2.5 text-right font-serif font-bold text-ink">{row.times_added}</td>
                    <td className="px-4 py-2.5 text-right text-slate-600">${row.avg_cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.topActivities.length === 0 && (
              <p className="px-4 py-8 text-center text-xs text-slate-500">No scheduled activities logged.</p>
            )}
          </div>

          <div className="rounded-2xl border border-sand-200 bg-surface p-5 shadow-xs">
            <h3 className="font-serif text-base font-bold text-ink">Category Mix Distribution</h3>
            <p className="mb-4 text-xs text-slate-500">Scheduled activities categorized by intent.</p>
            <ul className="space-y-3">
              {stats.categoryMix.map((row) => {
                const tone = categoryTone[row.category] ?? categoryTone.sightseeing;
                const max = Math.max(...stats.categoryMix.map((c) => c.n), 1);
                return (
                  <li key={row.category}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-semibold capitalize text-slate-700">{row.category}</span>
                      <span className="font-serif font-bold text-ink">{row.n} items</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-sand-200">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(row.n / max) * 100}%`, backgroundColor: tone.fg }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {tab === 'trends' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-sand-200 bg-surface p-5 shadow-xs">
            <h3 className="font-serif text-base font-bold text-ink">Monthly Trip Creation Rate</h3>
            <p className="mb-4 text-xs text-slate-500">Measured from date of creation in the platform.</p>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.tripsByMonth} margin={{ top: 8, right: 12, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="#E5E5DE" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={{ stroke: '#E5E5DE' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip content={<PlainTooltip suffix="trips" />} />
                  <Line
                    type="monotone"
                    dataKey="trips"
                    stroke="#0D7A5F"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0D7A5F', stroke: '#FFFFFF', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Insight
              label="Itineraries per Traveler"
              value={(stats.totals.trips / Math.max(1, stats.totals.users)).toFixed(1)}
              note="Calculated across all member accounts"
            />
            <Insight
              label="Stops per Itinerary"
              value={(stats.totals.stops / Math.max(1, stats.totals.trips)).toFixed(1)}
              note="Multi-destination journey standard"
            />
            <Insight
              label="Public Sharing Ratio"
              value={`${Math.round((stats.totals.shared_trips / Math.max(1, stats.totals.trips)) * 100)}%`}
              note="Published as community travel guides"
            />
          </div>
        </div>
      )}

      {/* Inspect User Trips Modal */}
      <Modal
        open={Boolean(inspect)}
        onClose={() => setInspect(null)}
        title={inspect ? `${inspect.first_name} ${inspect.last_name} — Member Dossier` : ''}
      >
        {inspect && <UserTrips user={inspect} onDelete={removeUser} />}
      </Modal>
    </div>
  );
}

function UserTrips({ user, onDelete }: { user: AdminUser; onDelete: (user: AdminUser) => void }) {
  const [trips, setTrips] = useState<any[] | null>(null);

  useEffect(() => {
    api
      .get(`/admin/users/${user.id}/trips`)
      .then(({ data }) => setTrips(data.trips))
      .catch(() => setTrips([]));
  }, [user.id]);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">
        {user.email} · Member since {longDate(user.created_at.slice(0, 10))}
      </p>

      {trips === null ? (
        <Spinner label="Loading member trips..." />
      ) : trips.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sand-300 p-6 text-center text-xs text-slate-500">
          This traveler has not created any trips yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {trips.map((trip) => (
            <li
              key={trip.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-sand-200 bg-sand-50/50 p-3 text-xs"
            >
              <div className="min-w-0">
                <span className="block truncate font-bold text-ink">{trip.name}</span>
                <span className="text-[11px] text-slate-500">
                  {trip.start_date} → {trip.end_date} · {trip.stop_count} stops
                </span>
              </div>
              {trip.is_public === 1 && (
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">
                  Public
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {user.role !== 'admin' && (
        <div className="border-t border-sand-200 pt-3">
          <Button variant="danger" size="sm" onClick={() => onDelete(user)} className="w-full">
            <Trash2 size={13} /> Delete Member Account & Itineraries
          </Button>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value, icon: Icon }: { label: string; value: string | number; icon?: any }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-surface p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        {Icon && <Icon size={14} className="text-slate-400" />}
      </div>
      <p className="font-serif mt-1 text-2xl font-bold tracking-tight text-ink">{value}</p>
    </div>
  );
}

function Insight({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-surface p-4 shadow-xs">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="font-serif mt-1 text-3xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}

function PlainTooltip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-sand-200 bg-surface px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-ink">{payload[0].payload.name ?? label}</p>
      <p className="font-serif text-sm font-bold text-brand-700">
        {payload[0].value} <span className="font-sans text-xs font-normal text-slate-500">{suffix}</span>
      </p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminOnlyRoute>
      <AdminContent />
    </AdminOnlyRoute>
  );
}
