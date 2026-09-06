'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  Check,
  ChevronRight,
  Copy,
  MapPin,
  Share2,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react';
import type { Trip } from '../lib/types';
import { api, errorText } from '../lib/api';
import { currency, dateRange } from '../lib/format';
import { StatusPill } from './TripCard';
import { Button, Modal, Notice } from './ui';

const TABS = [
  { slug: '', label: 'Itinerary View' },
  { slug: 'build', label: 'Itinerary Builder' },
  { slug: 'budget', label: 'Budget Analytics' },
];

export function TripHeader({ trip, onChange }: { trip: Trip; onChange: (trip: Trip) => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const shareUrl = typeof window !== 'undefined' && trip.share_slug ? `${window.location.origin}/s/${trip.share_slug}` : '';

  async function toggleShare(isPublic: boolean) {
    try {
      const { data } = await api.post(`/trips/${trip.id}/share`, { isPublic });
      onChange({ ...trip, is_public: isPublic ? 1 : 0, share_slug: data.slug });
    } catch (err) {
      setError(errorText(err));
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Copying failed. Please copy the URL manually.');
    }
  }

  async function remove() {
    try {
      await api.delete(`/trips/${trip.id}`);
      router.replace('/trips');
    } catch (err) {
      setError(errorText(err));
    }
  }

  const routeCities = trip.route ?? trip.stops?.map((s) => ({ id: s.id, city: s.city_name })) ?? [];

  return (
    <header className="mb-8 space-y-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-[13px] text-mist font-medium">
        <Link href="/trips" className="hover:text-brand hover:underline transition-colors">
          My Trips
        </Link>
        <ChevronRight size={13} />
        <span className="truncate text-ink font-semibold">{trip.name}</span>
      </nav>

      {/* Main Trip Card Banner */}
      <div className="card-elevated p-6 sm:p-8 bg-surface rounded-2xl border-rule space-y-5">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusPill status={trip.status} />
              {trip.is_public === 1 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-0.5 text-[11px] font-bold text-brand uppercase tracking-wider">
                  <Share2 size={11} /> Publicly Shared
                </span>
              )}
            </div>

            <h1 className="text-[28px] sm:text-[36px] font-black tracking-tight text-ink leading-tight">
              {trip.name}
            </h1>

            {/* Route Sequence Pills */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {routeCities.map((stop, idx) => (
                <span key={stop.id} className="inline-flex items-center gap-1.5">
                  {idx > 0 && <span className="text-mist text-[13px]">→</span>}
                  <span className="inline-flex items-center gap-1 rounded-md bg-canvas px-2.5 py-0.5 text-[13px] font-semibold text-slate border border-rule">
                    <MapPin size={12} className="text-sunset" />
                    {stop.city}
                  </span>
                </span>
              ))}
            </div>

            {trip.description && (
              <p className="mt-2 text-[14.5px] text-slate leading-relaxed max-w-2xl">
                {trip.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start">
            <Button onClick={() => setShareOpen(true)} className="shadow-xs">
              <Share2 size={14} /> <span>Share Itinerary</span>
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)} aria-label="Delete trip">
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-rule-subtle pt-4 text-[13.5px] text-slate">
          <div className="flex items-center gap-2 font-medium">
            <Calendar size={15} className="text-brand" />
            <span className="text-ink font-semibold">{dateRange(trip.start_date, trip.end_date)}</span>
            <span className="text-mist">({trip.days} days)</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            <MapPin size={15} className="text-sunset" />
            <span>{trip.stops.length} {trip.stops.length === 1 ? 'Destination' : 'Destinations'}</span>
          </div>

          <div className="flex items-center gap-1.5 font-medium">
            <Users size={15} className="text-slate" />
            <span>{trip.travellers} {trip.travellers === 1 ? 'Traveller' : 'Travellers'}</span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto font-medium">
            <Wallet size={15} className="text-brand" />
            <span className="text-mist">Est. Budget:</span>
            <span className="num font-extrabold text-ink text-[16px]">{currency(trip.budget.total)}</span>
          </div>
        </div>
      </div>

      {error && <Notice>{error}</Notice>}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-rule pt-2">
        {TABS.map((tab) => {
          const tabHref = `/trips/${trip.id}${tab.slug ? `/${tab.slug}` : ''}`;
          const isActive = tab.slug === '' ? pathname === `/trips/${trip.id}` : pathname === tabHref;

          return (
            <Link
              key={tab.slug}
              href={tabHref}
              className={`-mb-px border-b-2 px-4 py-3 text-[14px] font-semibold transition-all ${
                isActive
                  ? 'border-brand text-brand font-bold'
                  : 'border-transparent text-slate hover:text-ink'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Share Modal */}
      <Modal open={shareOpen} onClose={() => setShareOpen(false)} title="Share this itinerary">
        <div className="space-y-4">
          <p className="text-[14px] text-slate">
            Shared itineraries are published as beautiful read-only travel guides. Anyone with the link can view your itinerary, explore activities, and copy it into their account.
          </p>

          <label className="flex items-center gap-3 rounded-xl border border-rule p-3.5 bg-canvas-subtle cursor-pointer">
            <input
              type="checkbox"
              checked={trip.is_public === 1}
              onChange={(e) => toggleShare(e.target.checked)}
              className="h-4 w-4 accent-[#0D7A5F]"
            />
            <span className="text-[14px] font-bold text-ink">Enable public share link</span>
          </label>

          {trip.is_public === 1 && shareUrl && (
            <div className="space-y-3 pt-1">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="field num text-[13px] bg-canvas"
                  onFocus={(e) => e.target.select()}
                />
                <Button onClick={copyLink} variant={copied ? 'quiet' : 'primary'}>
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                <span className="eyebrow text-[10px] mr-1">Share via</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${trip.name} — ${shareUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="sm">WhatsApp</Button>
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(trip.name)}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button size="sm">X / Twitter</Button>
                </a>
                <a
                  href={`mailto:?subject=${encodeURIComponent(trip.name)}&body=${encodeURIComponent(shareUrl)}`}
                >
                  <Button size="sm">Email</Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this trip">
        <p className="text-[14px] text-slate">
          Are you sure you want to delete <strong className="text-ink">{trip.name}</strong>? This will permanently remove all scheduled stops, activities, and budget expenses.
        </p>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={remove}>
            <Trash2 size={14} /> Delete Journey
          </Button>
        </div>
      </Modal>
    </header>
  );
}
