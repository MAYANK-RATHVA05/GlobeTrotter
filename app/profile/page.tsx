'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookmarkX,
  Calendar,
  Check,
  Compass,
  CreditCard,
  Globe,
  MapPin,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { api, errorText } from '@/lib/api';
import { useAuth } from '@/lib/client-auth';
import { currency, dateRange, shortDate } from '@/lib/format';
import { getCityPhoto } from '@/lib/destination-photos';
import type { City, Trip, User } from '@/lib/types';
import { Avatar, Plate } from '@/components/Plate';
import { StatusPill } from '@/components/TripCard';
import { Button, Empty, Fieldset, Input, Modal, Notice, Select, Spinner, Textarea } from '@/components/ui';
import { PrivateRoute } from '@/components/AuthGuard';

interface ProfileData {
  user: User;
  planned: Trip[];
  previous: Trip[];
  savedCities: City[];
}

const LANGUAGES = [
  { value: 'en', label: 'English (US/UK)' },
  { value: 'hi', label: 'हिन्दी — Hindi' },
  { value: 'gu', label: 'ગુજરાતી — Gujarati' },
  { value: 'es', label: 'Español — Spanish' },
  { value: 'fr', label: 'Français — French' },
  { value: 'ja', label: '日本語 — Japanese' },
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD', 'CHF'];

function ProfileContent() {
  const { setUser, logout } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = () =>
    api
      .get('/users/me')
      .then(({ data }) => setData(data))
      .catch((err) => setError(errorText(err)));

  useEffect(() => {
    load();
  }, []);

  async function unsave(city: City) {
    setData((current) =>
      current ? { ...current, savedCities: current.savedCities.filter((c) => c.id !== city.id) } : null
    );
    await api.delete(`/cities/${city.id}/save`).catch((err) => setError(errorText(err)));
  }

  async function deleteAccount() {
    try {
      await api.delete('/users/me');
      logout();
      router.replace('/login');
    } catch (err) {
      setError(errorText(err));
    }
  }

  if (error && !data) return <Notice>{error}</Notice>;
  if (!data) return <Spinner label="Loading your profile & passport" />;

  const { user } = data;
  const name = `${user.first_name} ${user.last_name}`.trim();
  const totalTrips = data.planned.length + data.previous.length;

  return (
    <div className="pb-16">
      {/* ------------------------------------------------------- Passport / Identity Hero */}
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-sand-200 bg-surface p-6 shadow-sm sm:p-8">
        {/* Subtle decorative background watermark */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-sand-100/60 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Avatar with Status Ring */}
          <div className="relative shrink-0 self-start sm:self-center">
            <div className="overflow-hidden rounded-2xl ring-4 ring-sand-200/80 shadow-md">
              <Avatar name={name} src={user.photo_url} size={96} />
            </div>
            <span
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                user.role === 'admin'
                  ? 'bg-ink text-sand-50'
                  : 'bg-brand-700 text-white'
              }`}
            >
              {user.role === 'admin' ? 'Administrator' : 'Global Explorer'}
            </span>
          </div>

          {/* User Details */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="font-serif text-2xl font-bold tracking-tight text-ink sm:text-3xl">{name}</h1>
                <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <MapPin size={12} className="text-terracotta-500" />
                  {[user.city, user.country].filter(Boolean).join(', ') || 'Home destination unlisted'}
                  {user.phone && <span className="text-slate-400">· {user.phone}</span>}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="quiet" size="sm" onClick={() => setEditing(true)}>
                  <Pencil size={13} /> Edit Profile & Preferences
                </Button>
              </div>
            </div>

            {user.bio ? (
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-600 sm:text-sm">{user.bio}</p>
            ) : (
              <p className="mt-3 text-xs italic text-slate-400">
                No traveler bio yet. Click &quot;Edit Profile&quot; to write about your wanderlust.
              </p>
            )}

            {/* Travel Stats Grid */}
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-sand-200 pt-4 sm:grid-cols-4">
              <Fact label="Total Expeditions" value={String(totalTrips)} />
              <Fact label="Upcoming Itineraries" value={String(data.planned.length)} />
              <Fact label="Saved Sanctuaries" value={String(data.savedCities.length)} />
              <Fact
                label="Home Currency"
                value={user.home_currency || 'USD'}
              />
            </dl>
          </div>
        </div>
      </section>

      {saved && (
        <div className="mb-5">
          <Notice tone="sea">{saved}</Notice>
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Notice>{error}</Notice>
        </div>
      )}

      {/* -------------------------------------------------- Planned Trips */}
      <TripSection
        title="Upcoming & Ongoing Expeditions"
        badge={`${data.planned.length} Planned`}
        trips={data.planned}
        emptyTitle="No Upcoming Journeys"
        emptyBody="Your calendar is open for new horizons. Design an itinerary to start counting down."
        showNewButton
      />

      {/* -------------------------------------------------- Past Trips */}
      <TripSection
        title="Travel Archive & Completed Trips"
        badge={`${data.previous.length} Completed`}
        trips={data.previous}
        emptyTitle="No Completed Expeditions"
        emptyBody="Once a trip's departure dates conclude, your memories and logs will be catalogued here."
      />

      {/* ------------------------------------------------- Saved Cities */}
      <section className="mb-8">
        <div className="mb-4 flex items-baseline justify-between border-b border-sand-200 pb-2">
          <div>
            <span className="eyebrow text-terracotta-600">Wishlist & Bookmarks</span>
            <h2 className="font-serif text-xl font-bold text-ink">Saved Destinations</h2>
          </div>
          <span className="rounded-full bg-sand-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
            {data.savedCities.length} {data.savedCities.length === 1 ? 'City' : 'Cities'}
          </span>
        </div>

        {data.savedCities.length === 0 ? (
          <Empty
            title="No Bookmarked Destinations"
            body="Save cities while browsing the destination directory. When you are ready to assemble a new route, your bookmarks will be ready."
            action={
              <Link href="/explore">
                <Button variant="primary">
                  <Compass size={14} /> Explore Destinations
                </Button>
              </Link>
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data.savedCities.map((city) => {
              const photo = getCityPhoto(city.name);
              return (
                <li
                  key={city.id}
                  className="group relative overflow-hidden rounded-2xl border border-sand-200 bg-surface shadow-xs transition-all hover:border-sand-300 hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-sand-100">
                    <img
                      src={photo}
                      alt={city.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xs">
                      {city.region || city.country}
                    </span>
                    <button
                      onClick={() => unsave(city)}
                      className="absolute right-2 top-2 rounded-full bg-white/80 p-1.5 text-slate-600 backdrop-blur-xs transition-colors hover:bg-flag-soft hover:text-flag"
                      aria-label={`Remove ${city.name} from saved`}
                    >
                      <BookmarkX size={14} />
                    </button>
                  </div>

                  <div className="p-3.5">
                    <h3 className="font-serif text-base font-bold leading-tight text-ink">{city.name}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{city.country}</p>
                    <div className="mt-2 flex items-center justify-between border-t border-sand-100 pt-2 text-xs">
                      <span className="text-slate-500">Typical Spend:</span>
                      <span className="font-serif font-bold text-ink">{currency(city.cost_index)}/day</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------ Security & Danger Zone */}
      <section className="rounded-2xl border border-sand-200 bg-surface p-6 shadow-xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-serif text-lg font-bold text-ink">Account & Privacy</h3>
            <p className="mt-0.5 max-w-xl text-xs text-slate-500">
              Permanently delete your GlobeTrotter profile, trips, and associated itinerary items. This action is
              irreversible.
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={13} /> Delete Account
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------ Edit Profile Modal */}
      <EditModal
        open={editing}
        user={user}
        onClose={() => setEditing(false)}
        onSaved={(updated) => {
          setUser(updated);
          setData((current) => (current ? { ...current, user: updated } : null));
          setSaved('Your personal traveler details have been synchronized.');
          setTimeout(() => setSaved(''), 3000);
        }}
      />

      {/* ------------------------------------------------ Confirm Delete Modal */}
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Permanently Delete Account">
        <div className="space-y-3">
          <p className="text-xs leading-relaxed text-slate-600">
            This will irrevocably delete the traveler record for{' '}
            <strong className="text-ink">{user.email}</strong>, purging all itineraries, stops, activities, and community
            discussions.
          </p>
          <div className="rounded-xl border border-sand-200 bg-sand-50/60 p-3 text-xs text-slate-600">
            Are you completely confident you wish to proceed?
          </div>
          <div className="flex justify-end gap-2 border-t border-sand-200 pt-3">
            <Button size="sm" onClick={() => setConfirmDelete(false)}>
              Retain My Account
            </Button>
            <Button size="sm" variant="danger" onClick={deleteAccount}>
              <Trash2 size={13} /> Confirm Permanent Deletion
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-sand-100 bg-sand-50/50 p-2.5">
      <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="font-serif text-xl font-bold text-ink">{value}</dd>
    </div>
  );
}

function TripSection({
  title,
  badge,
  trips,
  emptyTitle,
  emptyBody,
  showNewButton = false,
}: {
  title: string;
  badge: string;
  trips: Trip[];
  emptyTitle: string;
  emptyBody: string;
  showNewButton?: boolean;
}) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-baseline justify-between border-b border-sand-200 pb-2">
        <div>
          <span className="eyebrow text-brand-700">Portfolio</span>
          <h2 className="font-serif text-xl font-bold text-ink">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-sand-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{badge}</span>
          {showNewButton && (
            <Link href="/trips/new">
              <Button size="sm" variant="primary" className="h-7 text-xs">
                <Plus size={12} /> New Trip
              </Button>
            </Link>
          )}
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand-300 bg-sand-50/40 p-6 text-center text-xs text-slate-500">
          <p className="font-semibold text-ink">{emptyTitle}</p>
          <p className="mt-1">{emptyBody}</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip) => {
            const firstCity = trip.route?.[0]?.city || trip.name;
            const photo = getCityPhoto(firstCity);
            return (
              <li
                key={trip.id}
                className="group overflow-hidden rounded-2xl border border-sand-200 bg-surface shadow-xs transition-all hover:border-sand-300 hover:shadow-md"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-sand-100">
                  <img
                    src={photo}
                    alt={trip.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute right-2 top-2">
                    <StatusPill status={trip.status} />
                  </div>
                  <div className="absolute bottom-2 left-3 right-3 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                      {trip.route?.length ? `${trip.route.length} stops` : 'Single destination'}
                    </p>
                    <h3 className="font-serif text-base font-bold leading-tight">{trip.name}</h3>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{dateRange(trip.start_date, trip.end_date)}</span>
                    <span className="font-serif font-bold text-ink">{currency(trip.budget.total)}</span>
                  </div>

                  {trip.route && trip.route.length > 0 && (
                    <p className="mt-2 truncate text-xs text-slate-600">
                      {trip.route.map((r) => r.city).join(' → ')}
                    </p>
                  )}

                  <div className="mt-3 flex gap-2">
                    <Link href={`/trips/${trip.id}`} className="flex-1">
                      <Button size="sm" variant="quiet" className="w-full text-xs">
                        View Itinerary
                      </Button>
                    </Link>
                    <Link href={`/trips/${trip.id}/build`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-ink">
                        <Pencil size={13} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function EditModal({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean;
  user: User;
  onClose: () => void;
  onSaved: (user: User) => void;
}) {
  const [form, setForm] = useState({
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone ?? '',
    city: user.city ?? '',
    country: user.country ?? '',
    bio: user.bio ?? '',
    photoUrl: user.photo_url ?? '',
    language: user.language,
    homeCurrency: user.home_currency,
  });
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phone: user.phone ?? '',
      city: user.city ?? '',
      country: user.country ?? '',
      bio: user.bio ?? '',
      photoUrl: user.photo_url ?? '',
      language: user.language,
      homeCurrency: user.home_currency,
    });
    setPassword('');
    setError('');
  }, [open, user]);

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value });

  async function save() {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.patch('/users/me', form);
      if (password) await api.post('/users/me/password', { password });
      onSaved(data.user);
      onClose();
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Traveler Dossier & Preferences" wide>
      <div className="space-y-4">
        {/* Photo URL Preview */}
        <div className="flex items-center gap-4 rounded-xl border border-sand-200 bg-sand-50/50 p-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-sand-300">
            <Avatar name={`${form.firstName} ${form.lastName}`} src={form.photoUrl || null} size={56} />
          </div>
          <label className="min-w-0 flex-1">
            <span className="mb-1 block text-xs font-semibold text-ink">Avatar Image URL</span>
            <Input
              value={form.photoUrl}
              onChange={set('photoUrl')}
              placeholder="https://images.unsplash.com/..."
              className="text-xs"
            />
          </label>
        </div>

        {/* Identity & Contact */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Fieldset label="First Name">
            <Input value={form.firstName} onChange={set('firstName')} className="text-xs" />
          </Fieldset>
          <Fieldset label="Last Name">
            <Input value={form.lastName} onChange={set('lastName')} className="text-xs" />
          </Fieldset>
          <Fieldset label="Email Address">
            <Input type="email" value={form.email} onChange={set('email')} className="text-xs" />
          </Fieldset>
          <Fieldset label="Contact Phone" hint="Optional">
            <Input value={form.phone} onChange={set('phone')} className="text-xs" />
          </Fieldset>
          <Fieldset label="Home City">
            <Input value={form.city} onChange={set('city')} placeholder="e.g. San Francisco" className="text-xs" />
          </Fieldset>
          <Fieldset label="Country">
            <Input value={form.country} onChange={set('country')} placeholder="e.g. United States" className="text-xs" />
          </Fieldset>
          <Fieldset label="Language">
            <Select value={form.language} onChange={set('language')} className="text-xs">
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </Select>
          </Fieldset>
          <Fieldset label="Home Currency" hint="Display Default">
            <Select value={form.homeCurrency} onChange={set('homeCurrency')} className="text-xs">
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Fieldset>
        </div>

        <Fieldset label="Traveler Bio" hint="Visible on community contributions">
          <Textarea
            rows={3}
            value={form.bio}
            onChange={set('bio')}
            placeholder="Tell fellow travelers about your favorite destinations, style, and culinary obsessions..."
            className="text-xs"
          />
        </Fieldset>

        <Fieldset label="Update Password" hint="Leave blank to retain existing password">
          <Input
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            className="text-xs"
          />
        </Fieldset>

        {error && <Notice>{error}</Notice>}

        <div className="flex justify-end gap-2 border-t border-sand-200 pt-4">
          <Button onClick={onClose} size="sm">
            Cancel
          </Button>
          <Button variant="primary" size="sm" busy={busy} onClick={save}>
            <Check size={14} /> Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default function ProfilePage() {
  return (
    <PrivateRoute>
      <ProfileContent />
    </PrivateRoute>
  );
}
