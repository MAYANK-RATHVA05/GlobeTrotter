'use client';

import Link from 'next/link';
import { Calendar, ChevronRight, MapPin, Users, Wallet } from 'lucide-react';
import type { Trip, TripStatus } from '../lib/types';
import { currency, dateRange, relativeDays } from '../lib/format';
import { Plate } from './Plate';

const STATUS: Record<TripStatus, { label: string; fg: string; bg: string }> = {
  ongoing: { label: 'On the road', fg: '#0D7A5F', bg: '#E6F4F1' },
  upcoming: { label: 'Upcoming', fg: '#C2410C', bg: '#FFEDD5' },
  completed: { label: 'Completed', fg: '#4B5563', bg: '#F3F4F6' },
};

export function StatusPill({ status }: { status: TripStatus }) {
  const tone = STATUS[status] || STATUS.upcoming;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase"
      style={{ color: tone.fg, background: tone.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone.fg }} />
      {tone.label}
    </span>
  );
}

/** The route in miniature: clean route badges with subtle connectors */
export function RouteStrip({ route }: { route: { id: number; city: string }[] }) {
  if (route.length === 0) {
    return <span className="text-[13px] text-mist">No destinations added yet</span>;
  }
  return (
    <div className="flex min-w-0 items-center gap-1.5 overflow-hidden flex-wrap">
      {route.map((stop, i) => (
        <span key={stop.id} className="inline-flex items-center gap-1.5">
          {i > 0 && <span className="text-mist text-[12px]">→</span>}
          <span className="inline-flex items-center gap-1 rounded-md bg-canvas-subtle px-2 py-0.5 text-[12px] font-medium text-slate">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="truncate max-w-[120px]">{stop.city}</span>
          </span>
        </span>
      ))}
    </div>
  );
}

export function TripCard({
  trip,
  variant = 'row',
}: {
  trip: Trip;
  variant?: 'row' | 'grid';
}) {
  const route = trip.route ?? trip.stops?.map((s) => ({ id: s.id, city: s.city_name })) ?? [];
  const coverCity = route[0]?.city ?? trip.name;

  if (variant === 'grid') {
    return (
      <Link
        href={`/trips/${trip.id}`}
        className="card group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-rule"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <Plate name={coverCity} ratio="h-full w-full" label={route[0]?.city} />
          <div className="absolute top-3 left-3 z-10">
            <StatusPill status={trip.status} />
          </div>
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center rounded-md bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-md">
              {relativeDays(trip.start_date)}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-4">
          <div>
            <h3 className="truncate text-[17px] font-bold text-ink group-hover:text-brand transition-colors">
              {trip.name}
            </h3>
            {trip.description && (
              <p className="mt-1 line-clamp-1 text-[13px] text-slate">{trip.description}</p>
            )}
            <div className="mt-2.5">
              <RouteStrip route={route.slice(0, 3)} />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t pt-3 text-[12.5px] text-slate">
            <Meta icon={Calendar}>{dateRange(trip.start_date, trip.end_date)}</Meta>
            <span className="num font-bold text-ink text-[14px]">{currency(trip.budget.total)}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="card group flex flex-col sm:flex-row gap-4 p-3.5 transition-all duration-300 hover:shadow-md hover:border-gray-300 border-rule"
    >
      <div className="relative h-[160px] sm:h-[120px] w-full sm:w-[180px] shrink-0 overflow-hidden rounded-[10px]">
        <Plate name={coverCity} ratio="h-full w-full" label={route[0]?.city} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-2.5">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <StatusPill status={trip.status} />
            <span className="text-[12px] font-medium text-mist">{relativeDays(trip.start_date)}</span>
          </div>
          <h3 className="truncate text-[18px] font-bold text-ink group-hover:text-brand transition-colors">
            {trip.name}
          </h3>
          {trip.description && (
            <p className="mt-0.5 line-clamp-1 text-[13.5px] text-slate">{trip.description}</p>
          )}
        </div>

        <RouteStrip route={route} />

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-rule-subtle pt-2.5 text-[12.5px] text-slate">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Meta icon={Calendar}>{dateRange(trip.start_date, trip.end_date)}</Meta>
            <Meta icon={MapPin}>
              {route.length} {route.length === 1 ? 'city' : 'cities'} · {trip.days} days
            </Meta>
            {trip.travellers > 1 && <Meta icon={Users}>{trip.travellers} travellers</Meta>}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Meta icon={Wallet}>
              <span className="num font-bold text-ink text-[13.5px]">{currency(trip.budget.total)}</span>
            </Meta>
            <span className="text-slate group-hover:text-brand group-hover:translate-x-0.5 transition-all">
              <ChevronRight size={16} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function Meta({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={13} className="text-mist" />
      {children}
    </span>
  );
}
