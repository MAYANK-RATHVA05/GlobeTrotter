'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid, List, Plus, Search } from 'lucide-react';
import { api, errorText } from '@/lib/api';
import type { Trip, TripStatus } from '@/lib/types';
import { TripCard } from '@/components/TripCard';
import { Button, Empty, Notice, Spinner } from '@/components/ui';
import { PrivateRoute } from '@/components/AuthGuard';

const TABS: { key: 'all' | TripStatus; label: string }[] = [
  { key: 'all', label: 'All Journeys' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'completed', label: 'Completed' },
];

function MyTripsContent() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | TripStatus>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('soonest');
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');

  useEffect(() => {
    api
      .get('/trips')
      .then(({ data }) => setTrips(data.trips))
      .catch((err) => setError(errorText(err)));
  }, []);

  const filteredTrips = useMemo(() => {
    if (!trips) return [];

    let list = trips;

    // Filter by tab status
    if (activeTab !== 'all') {
      list = list.filter((t) => t.status === activeTab);
    }

    // Filter by search query
    if (query.trim()) {
      const needle = query.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(needle) ||
          (t.description ?? '').toLowerCase().includes(needle) ||
          (t.route ?? []).some((r) => r.city.toLowerCase().includes(needle))
      );
    }

    // Sort order
    const order: Record<string, (a: Trip, b: Trip) => number> = {
      soonest: (a, b) => a.start_date.localeCompare(b.start_date),
      latest: (a, b) => b.start_date.localeCompare(a.start_date),
      name: (a, b) => a.name.localeCompare(b.name),
      'cost-high': (a, b) => b.budget.total - a.budget.total,
      longest: (a, b) => b.days - a.days,
    };
    return [...list].sort(order[sort] ?? order.soonest);
  }, [trips, activeTab, query, sort]);

  if (error) return <Notice>{error}</Notice>;
  if (!trips) return <Spinner label="Loading your itineraries" />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ------------------------------------------------ Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <p className="eyebrow text-brand">Your Itineraries</p>
          <h1 className="text-[28px] sm:text-[34px] font-black tracking-tight text-ink">
            My Trips
          </h1>
          <p className="text-[14.5px] text-slate mt-1">
            Manage, schedule, and review all your past and upcoming adventures.
          </p>
        </div>

        <Button
          size="lg"
          variant="primary"
          onClick={() => router.push('/trips/new')}
          className="shadow-md shadow-brand/15 self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Plan New Trip</span>
        </Button>
      </div>

      {/* ------------------------------------------------ Controls Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b md:border-b-0 border-rule">
          {TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? trips.length
                : trips.filter((t) => t.status === tab.key).length;
            const active = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13.5px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-brand text-white shadow-xs'
                    : 'text-slate hover:bg-canvas hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[11px] font-mono ${
                    active ? 'bg-white/25 text-white' : 'bg-canvas text-mist'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Sort, View Toggle */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mist" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter trips..."
              className="field pl-8.5 h-9 text-[13.5px]"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="field h-9 w-36 text-[13px] font-medium"
          >
            <option value="soonest">Earliest Date</option>
            <option value="latest">Latest Date</option>
            <option value="name">Name (A-Z)</option>
            <option value="cost-high">Highest Budget</option>
            <option value="longest">Longest Duration</option>
          </select>

          {/* View Switcher */}
          <div className="flex items-center rounded-xl border border-rule bg-surface p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-canvas text-brand' : 'text-slate hover:text-ink'
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('row')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'row' ? 'bg-canvas text-brand' : 'text-slate hover:text-ink'
              }`}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ Trips Grid / List */}
      {filteredTrips.length === 0 ? (
        <Empty
          title="No journeys found"
          body={
            query
              ? `No itineraries match "${query}". Try clearing the search.`
              : 'You have no trips in this category yet. Ready to start planning?'
          }
          action={
            <Button variant="primary" onClick={() => router.push('/trips/new')}>
              <Plus size={15} /> Plan New Trip
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} variant="grid" />
          ))}
        </div>
      ) : (
        <div className="space-y-3.5 pt-2">
          {filteredTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} variant="row" />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyTripsPage() {
  return (
    <PrivateRoute>
      <MyTripsContent />
    </PrivateRoute>
  );
}
