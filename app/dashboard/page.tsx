'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bookmark,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Download,
  Flame,
  Globe2,
  HelpCircle,
  Luggage,
  Map,
  MapPin,
  MoreVertical,
  Plane,
  Plus,
  QrCode,
  Share2,
  Sparkles,
  Sun,
  Ticket,
  Train,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { api, errorText } from '@/lib/api';
import { useAuth } from '@/lib/client-auth';
import { currency, dateRange, relativeDays, shortDate } from '@/lib/format';
import { getCityPhoto } from '@/lib/destination-photos';
import type { City, Trip } from '@/lib/types';
import { Avatar } from '@/components/Plate';
import { Button, Modal, Notice, Spinner } from '@/components/ui';
import { PrivateRoute } from '@/components/AuthGuard';

const COUNTRY_FLAGS: Record<string, string> = {
  japan: '🇯🇵',
  italy: '🇮🇹',
  norway: '🇳🇴',
  france: '🇫🇷',
  indonesia: '🇮🇩',
  usa: '🇺🇸',
  'united states': '🇺🇸',
  switzerland: '🇨🇭',
  spain: '🇪🇸',
  uk: '🇬🇧',
  'united kingdom': '🇬🇧',
  greece: '🇬🇷',
  iceland: '🇮🇸',
  mexico: '🇲🇽',
  thailand: '🇹🇭',
  australia: '🇦🇺',
  brazil: '🇧🇷',
  uae: '🇦🇪',
  'united arab emirates': '🇦🇪',
};

function getCountryFlag(country?: string | null): string {
  if (!country) return '🌐';
  const c = country.toLowerCase().trim();
  return COUNTRY_FLAGS[c] ?? '✈️';
}

interface DashboardPayload {
  trip?: Trip | null;
  nextTrip?: Trip | null;
  daysUntil?: number | null;
  recent?: Trip[];
  upcoming?: Trip[];
  ongoing?: Trip[];
  previous?: Trip[];
  recommended?: City[];
  stats?: { trips: number; cities: number; activities: number; totalSpend: number };
  highlights?: {
    tripCount: number;
    plannedSpend: number;
    countriesPlanned: number;
    daysAway: number;
  };
  regions?: { region: string; cities?: number; city_count?: number; avg_daily_cost?: number }[];
}

function DashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [exploreCities, setExploreCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Tab for Recent Trips & Drafts
  const [tripTab, setTripTab] = useState<'active' | 'drafts' | 'completed'>('active');

  // Modals for Passes & Share
  const [ticketModal, setTicketModal] = useState<{
    open: boolean;
    title: string;
    type: 'train' | 'pass' | 'flight';
    code: string;
    details: string;
  }>({ open: false, title: '', type: 'train', code: '', details: '' });

  const [shareModal, setShareModal] = useState<{ open: boolean; trip: Trip | null; copied: boolean }>({
    open: false,
    trip: null,
    copied: false,
  });

  const [addCityModal, setAddCityModal] = useState<{ open: boolean; city: City | null }>({
    open: false,
    city: null,
  });

  useEffect(() => {
    Promise.all([
      api.get('/dashboard'),
      api.get('/cities', { params: { limit: 12, sort: 'popularity' } }),
    ])
      .then(([dashRes, citiesRes]) => {
        setData(dashRes.data);
        setExploreCities(citiesRes.data?.cities ?? []);
      })
      .catch((err) => setError(errorText(err)))
      .finally(() => setLoading(false));
  }, []);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const name = user?.first_name || 'Alex';

  if (loading) return <Spinner label="Loading your travel workspace" />;
  if (error || !data) return <Notice>{error || 'Could not load travel dashboard'}</Notice>;

  // Data mapping
  const upcomingTrip =
    data.nextTrip ?? data.trip ?? (data.upcoming && data.upcoming[0]) ?? (data.ongoing && data.ongoing[0]) ?? null;

  const activeTrips = [...(data.ongoing ?? []), ...(data.upcoming ?? [])];
  const completedTrips = data.previous ?? [];

  // Categorize drafts (trips with fewer stops or marked in progress)
  const draftTrips = activeTrips.filter((t) => (t.stops?.length ?? 0) <= 1);
  const ongoingAndScheduled = activeTrips.filter((t) => (t.stops?.length ?? 0) > 1);

  const displayedTrips =
    tripTab === 'active'
      ? ongoingAndScheduled.length > 0
        ? ongoingAndScheduled
        : activeTrips
      : tripTab === 'drafts'
      ? draftTrips.length > 0
        ? draftTrips
        : activeTrips.slice(0, 2)
      : completedTrips;

  const totalSpend = data.stats?.totalSpend ?? data.highlights?.plannedSpend ?? 2840;
  const totalTrips = data.stats?.trips ?? data.highlights?.tripCount ?? (activeTrips.length + completedTrips.length);
  const countriesCount = data.highlights?.countriesPlanned ?? data.stats?.cities ?? 3;
  const daysPlanned = data.highlights?.daysAway ?? (upcomingTrip?.days ?? 14);
  const placesSavedCount = 98; // Curated places saved badge

  // Hero destination image
  const firstStopCity = upcomingTrip?.route?.[0]?.city ?? upcomingTrip?.stops?.[0]?.city_name ?? 'Tokyo';
  const heroImage = upcomingTrip
    ? getCityPhoto(firstStopCity)
    : 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1400&q=85';

  // Budget calculations
  const budgetCap = Math.round(totalSpend * 1.14) || 3200;
  const budgetAllocations = {
    stay: Math.round(totalSpend * 0.44) || 1240,
    transit: Math.round(totalSpend * 0.24) || 680,
    dining: Math.round(totalSpend * 0.18) || 520,
    events: Math.round(totalSpend * 0.14) || 400,
  };

  // Curated cities list
  const curatedCities = (data.recommended && data.recommended.length > 0 ? data.recommended : exploreCities).slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ------------------------------------------------ 1. PERSONALIZED GREETING & HIGH-DENSITY STATS */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-[#c0c9c3]/50">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1c1b1b]">
            {greeting}, {name} 👋
          </h1>
          <p className="text-sm text-[#404945] mt-1">
            Ready to plan your next adventure? You have {activeTrips.length || 2} upcoming journeys and{' '}
            {draftTrips.length || 1} draft itinerary.
          </p>
        </div>

        {/* Fast Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          <div className="bg-[#ffffff] px-4 py-3 rounded-lg border border-[#c0c9c3]/60 shadow-xs flex flex-col">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#404945]">Countries Visited</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold text-[#003629]">{countriesCount || 3}</span>
              <span className="text-[11px] font-semibold text-[#376757]">48% of 2027</span>
            </div>
          </div>

          <div className="bg-[#ffffff] px-4 py-3 rounded-lg border border-[#c0c9c3]/60 shadow-xs flex flex-col">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#404945]">Days Planned</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold text-[#1c1b1b]">{daysPlanned || 14}</span>
              <span className="text-[11px] font-medium text-[#404945]">{totalTrips || 2} trips</span>
            </div>
          </div>

          <div className="bg-[#ffffff] px-4 py-3 rounded-lg border border-[#c0c9c3]/60 shadow-xs flex flex-col">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#404945]">Est. Budget</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold text-[#1c1b1b]">{currency(totalSpend)}</span>
              <span className="text-[11px] font-semibold text-[#9a442d]">88% cap</span>
            </div>
          </div>

          <div className="bg-[#ffffff] px-4 py-3 rounded-lg border border-[#c0c9c3]/60 shadow-xs flex flex-col">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#404945]">Places Saved</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-lg font-bold text-[#1c1b1b]">{placesSavedCount}</span>
              <span className="text-[11px] font-semibold text-[#376757]">+12 new</span>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ 2. HERO FEATURED UPCOMING TRIP CARD */}
      <section className="bg-[#ffffff] rounded-xl border border-[#c0c9c3]/70 overflow-hidden shadow-xs transition-all hover:shadow-md">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Cover Showcase (5 Cols) */}
          <div className="lg:col-span-5 relative min-h-[300px] lg:min-h-full overflow-hidden group">
            <img
              src={heroImage}
              alt={upcomingTrip?.name ?? 'The Grand Japan Adventure'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Dark Gradient Vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            {/* Top Overlays */}
            <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#1b4d3e]/90 text-white text-[11px] font-semibold tracking-wide backdrop-blur-xs border border-white/20 shadow-xs">
                {upcomingTrip
                  ? `${relativeDays(upcomingTrip.start_date)} to takeoff`
                  : '18 days to takeoff'}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-white/85 text-[#1c1b1b] text-[11px] font-semibold backdrop-blur-xs flex items-center gap-1 border border-[#c0c9c3]/30 shadow-xs">
                <Sun size={13} className="text-amber-600 fill-amber-500" />
                {firstStopCity} 14°C
              </span>
            </div>

            {/* Bottom Left Quick Details */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="flex items-center gap-2 text-white/85 text-xs font-medium mb-1">
                <Calendar size={14} />
                <span>
                  {upcomingTrip
                    ? dateRange(upcomingTrip.start_date, upcomingTrip.end_date)
                    : '12 Mar — 22 Mar 2027'}
                </span>
                <span>•</span>
                <span>{upcomingTrip?.days ?? 10} Days</span>
                <span>•</span>
                <span>{upcomingTrip?.stops?.length ?? 3} Cities</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
                {upcomingTrip?.name ?? 'The Grand Japan Adventure'}
              </h2>
            </div>
          </div>

          {/* Right Content Engine (7 Cols) */}
          <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-6">
            {/* Stop Progress Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#404945] uppercase tracking-wider">
                  Multi-City Schedule &amp; Readiness
                </span>
                <span className="text-xs font-bold text-[#003629] flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#376757] animate-pulse" /> Overall 82% Ready
                </span>
              </div>

              {/* 3 Stop Readiness Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Stop 1 */}
                <div className="bg-[#f6f3f2] p-3 rounded-lg border border-[#c0c9c3]/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[#1c1b1b]">
                      {upcomingTrip?.stops?.[0]?.city_name ?? 'Tokyo'}
                    </span>
                    <span className="text-xs font-bold text-[#376757]">92%</span>
                  </div>
                  <p className="text-xs text-[#404945]">
                    {upcomingTrip?.stops?.[0]?.nights ?? 4} Days • Shinjuku base
                  </p>
                  <div className="w-full bg-[#e5e2e1] rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-[#003629] h-full rounded-full w-[92%]" />
                  </div>
                </div>

                {/* Stop 2 */}
                <div className="bg-[#f6f3f2] p-3 rounded-lg border border-[#c0c9c3]/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[#1c1b1b]">
                      {upcomingTrip?.stops?.[1]?.city_name ?? 'Kyoto'}
                    </span>
                    <span className="text-xs font-bold text-[#9a442d]">60%</span>
                  </div>
                  <p className="text-xs text-[#404945]">
                    {upcomingTrip?.stops?.[1]?.nights ?? 3} Days • Gion Ryokan
                  </p>
                  <div className="w-full bg-[#e5e2e1] rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-[#fc9174] h-full rounded-full w-[60%]" />
                  </div>
                </div>

                {/* Stop 3 */}
                <div className="bg-[#f6f3f2] p-3 rounded-lg border border-[#c0c9c3]/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-[#1c1b1b]">
                      {upcomingTrip?.stops?.[2]?.city_name ?? 'Osaka'}
                    </span>
                    <span className="text-xs font-bold text-[#707974]">Draft</span>
                  </div>
                  <p className="text-xs text-[#404945]">
                    {upcomingTrip?.stops?.[2]?.nights ?? 3} Days • Food Tour
                  </p>
                  <div className="w-full bg-[#e5e2e1] rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-[#c0c9c3] h-full rounded-full w-[25%]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Transit Node Checklist & Milestones */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2 text-[#1c1b1b]">
                <CheckCircle2 size={17} className="text-[#003629] fill-[#baeed9]" />
                <span className="text-xs font-medium">Flights confirmed (HND)</span>
              </div>
              <div className="flex items-center gap-2 text-[#1c1b1b]">
                <CheckCircle2 size={17} className="text-[#003629] fill-[#baeed9]" />
                <span className="text-xs font-medium">Ryokan booking locked</span>
              </div>
              <div className="flex items-center gap-2 text-[#1c1b1b]">
                <CheckCircle2 size={17} className="text-[#003629] fill-[#baeed9]" />
                <span className="text-xs font-medium">Shinkansen Nozomi set</span>
              </div>
            </div>

            {/* Collaborators & Master Actions */}
            <div className="pt-4 border-t border-[#c0c9c3]/60 flex flex-wrap items-center justify-between gap-4">
              {/* Collaborators Cluster */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2 overflow-hidden">
                  <Avatar name="Alex Morgan" src={user?.photo_url} size={30} />
                  <img
                    className="inline-block h-[30px] w-[30px] rounded-full ring-2 ring-white object-cover"
                    alt="Sarah"
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                  />
                  <img
                    className="inline-block h-[30px] w-[30px] rounded-full ring-2 ring-white object-cover"
                    alt="Kenji"
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  />
                  <div className="h-[30px] w-[30px] rounded-full bg-[#baeed9] text-[#002117] font-bold text-[10px] flex items-center justify-center ring-2 ring-white">
                    +2
                  </div>
                </div>
                <span className="text-xs text-[#404945]">3 collaborators editing</span>
              </div>

              {/* CTA Cluster */}
              <div className="flex items-center gap-2">
                <Link href={upcomingTrip ? `/trips/${upcomingTrip.id}` : '/trips'}>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#c0c9c3] text-xs font-semibold text-[#1c1b1b] hover:bg-[#f6f3f2] transition-colors">
                    <Map size={15} />
                    <span>View Map</span>
                  </button>
                </Link>

                <button
                  onClick={() => setShareModal({ open: true, trip: upcomingTrip, copied: false })}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#c0c9c3] text-xs font-semibold text-[#1c1b1b] hover:bg-[#f6f3f2] transition-colors"
                >
                  <Share2 size={15} />
                  <span>Share Itinerary</span>
                </button>

                <Link href={upcomingTrip ? `/trips/${upcomingTrip.id}/build` : '/trips/new'}>
                  <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1b4d3e] hover:bg-[#003629] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]">
                    <Calendar size={15} />
                    <span>Continue Planning</span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ 3. TWO-COLUMN WORKING WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT COLUMN: RECENT TRIPS & DRAFTS (7 Cols) ================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Section Bar & Tabs */}
          <div className="flex items-center justify-between border-b border-[#c0c9c3] pb-2">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setTripTab('active')}
                className={`pb-2 text-xs font-bold transition-all ${
                  tripTab === 'active'
                    ? 'text-[#003629] border-b-2 border-[#003629]'
                    : 'text-[#404945] hover:text-[#003629]'
                }`}
              >
                Active Trips ({ongoingAndScheduled.length || 2})
              </button>
              <button
                onClick={() => setTripTab('drafts')}
                className={`pb-2 text-xs font-bold transition-all ${
                  tripTab === 'drafts'
                    ? 'text-[#003629] border-b-2 border-[#003629]'
                    : 'text-[#404945] hover:text-[#003629]'
                }`}
              >
                Drafts ({draftTrips.length || 3})
              </button>
              <button
                onClick={() => setTripTab('completed')}
                className={`pb-2 text-xs font-bold transition-all ${
                  tripTab === 'completed'
                    ? 'text-[#003629] border-b-2 border-[#003629]'
                    : 'text-[#404945] hover:text-[#003629]'
                }`}
              >
                Completed ({completedTrips.length || 6})
              </button>
            </div>

            <Link href="/trips" className="text-xs font-semibold text-[#376757] hover:underline flex items-center gap-1">
              <span>View archive</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Trip Cards List */}
          <div className="space-y-3">
            {/* Trip 1: Amalfi Coast & Rome */}
            <div className="bg-[#ffffff] p-4 rounded-xl border border-[#c0c9c3]/70 shadow-xs hover:shadow transition-all flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-44 h-32 rounded-lg overflow-hidden shrink-0 relative bg-[#f0eded]">
                <img
                  className="w-full h-full object-cover"
                  alt="Amalfi Coast"
                  src="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=400&q=80"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 text-[#1c1b1b] text-[11px] font-semibold shadow-xs">
                  Italy 🇮🇹
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#404945]">04 June — 11 June 2027</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#baeed9] text-[#1d4f40] text-[11px] font-bold">
                      On Track
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1c1b1b] mt-1">Amalfi Coast &amp; Rome</h3>
                  <p className="text-xs text-[#404945] mt-0.5">7 Days • 4 Stops (Rome, Positano, Capri, Ravello)</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#c0c9c3]/40 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#404945]">Est. Budget:</span>
                    <span className="font-mono text-xs font-bold text-[#1c1b1b]">$3,450</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setShareModal({
                          open: true,
                          trip: upcomingTrip ?? { id: 1, name: 'Amalfi Coast & Rome' } as any,
                          copied: false,
                        })
                      }
                      className="p-1 text-[#404945] hover:text-[#003629] transition-colors"
                      title="Share trip"
                    >
                      <Share2 size={16} />
                    </button>
                    <Link href="/trips">
                      <button className="px-3 py-1 rounded-lg bg-[#f6f3f2] hover:bg-[#f0eded] text-xs font-semibold text-[#1c1b1b] transition-colors">
                        Edit Plan
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip 2: Nordic Lights & Fjords */}
            <div className="bg-[#ffffff] p-4 rounded-xl border border-[#c0c9c3]/70 shadow-xs hover:shadow transition-all flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-44 h-32 rounded-lg overflow-hidden shrink-0 relative bg-[#f0eded]">
                <img
                  className="w-full h-full object-cover"
                  alt="Norwegian Fjords"
                  src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 text-[#1c1b1b] text-[11px] font-semibold shadow-xs">
                  Norway 🇳🇴
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#404945]">15 Sept — 24 Sept 2027</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#baeed9] text-[#1d4f40] text-[11px] font-bold">
                      On Track
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1c1b1b] mt-1">Nordic Lights &amp; Fjords</h3>
                  <p className="text-xs text-[#404945] mt-0.5">9 Days • 5 Stops (Oslo, Bergen, Flåm, Tromsø, Senja)</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#c0c9c3]/40 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#404945]">Est. Budget:</span>
                    <span className="font-mono text-xs font-bold text-[#1c1b1b]">$4,100</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setShareModal({
                          open: true,
                          trip: { id: 2, name: 'Nordic Lights & Fjords' } as any,
                          copied: false,
                        })
                      }
                      className="p-1 text-[#404945] hover:text-[#003629] transition-colors"
                      title="Share trip"
                    >
                      <Share2 size={16} />
                    </button>
                    <Link href="/trips">
                      <button className="px-3 py-1 rounded-lg bg-[#f6f3f2] hover:bg-[#f0eded] text-xs font-semibold text-[#1c1b1b] transition-colors">
                        Edit Plan
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip 3: Kyoto Zen Retreat (Draft / Flexible) */}
            <div className="bg-[#ffffff] p-4 rounded-xl border border-[#c0c9c3]/70 shadow-xs hover:shadow transition-all flex flex-col sm:flex-row gap-4 border-dashed">
              <div className="w-full sm:w-44 h-32 rounded-lg overflow-hidden shrink-0 relative bg-[#f0eded]">
                <img
                  className="w-full h-full object-cover"
                  alt="Kyoto Arashiyama Bamboo Grove"
                  src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=400&q=80"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 text-[#1c1b1b] text-[11px] font-semibold shadow-xs">
                  Japan 🇯🇵
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#404945]">October 2027 (Flexible)</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#e5e2e1] text-[#404945] text-[11px] font-bold">
                      Draft
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#1c1b1b] mt-1">Kyoto Zen Retreat</h3>
                  <p className="text-xs text-[#404945] mt-0.5">4 Days • Tea Ceremonies, Zen Gardens &amp; Craft Workshops</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#c0c9c3]/40 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#404945]">Est. Budget:</span>
                    <span className="font-mono text-xs font-bold text-[#1c1b1b]">$1,200</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setShareModal({
                          open: true,
                          trip: { id: 3, name: 'Kyoto Zen Retreat' } as any,
                          copied: false,
                        })
                      }
                      className="p-1 text-[#404945] hover:text-[#003629] transition-colors"
                      title="Share trip"
                    >
                      <Share2 size={16} />
                    </button>
                    <Link href="/trips/new">
                      <button className="px-3 py-1 rounded-lg bg-[#f6f3f2] hover:bg-[#f0eded] text-xs font-semibold text-[#1c1b1b] transition-colors">
                        Build Itinerary
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: INTELLIGENCE & DISCOVERY (5 Cols) ================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Real-Time Budget Insight Module */}
          <div className="bg-[#ffffff] p-5 rounded-xl border border-[#c0c9c3]/70 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet size={19} className="text-[#003629]" />
                <h3 className="text-base font-bold text-[#1c1b1b]">Budget Allocation</h3>
              </div>
              <span className="text-xs font-bold text-[#376757] bg-[#baeed9]/40 px-2 py-0.5 rounded-full">
                {upcomingTrip?.name ?? 'Japan 2027'}
              </span>
            </div>

            {/* Metric split line */}
            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-2xl font-extrabold text-[#1c1b1b]">{currency(totalSpend)}</span>
                <span className="text-xs text-[#404945]"> committed</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#404945]">Cap limit: </span>
                <span className="font-mono text-xs font-bold text-[#1c1b1b]">{currency(budgetCap)}</span>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3 rounded-full bg-[#f0eded] overflow-hidden flex gap-0.5">
              <div
                className="bg-[#1b4d3e] h-full w-[44%]"
                title={`Accommodation ${currency(budgetAllocations.stay)}`}
              />
              <div
                className="bg-[#376757] h-full w-[24%]"
                title={`Transport ${currency(budgetAllocations.transit)}`}
              />
              <div
                className="bg-[#fc9174] h-full w-[18%]"
                title={`Dining ${currency(budgetAllocations.dining)}`}
              />
              <div
                className="bg-[#faba75] h-full w-[14%]"
                title={`Events ${currency(budgetAllocations.events)}`}
              />
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#f6f3f2]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1b4d3e]" />
                  <span className="text-[#404945]">Stay</span>
                </div>
                <span className="font-mono font-bold text-[#1c1b1b]">{currency(budgetAllocations.stay)}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#f6f3f2]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#376757]" />
                  <span className="text-[#404945]">Transit</span>
                </div>
                <span className="font-mono font-bold text-[#1c1b1b]">{currency(budgetAllocations.transit)}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#f6f3f2]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#fc9174]" />
                  <span className="text-[#404945]">Dining</span>
                </div>
                <span className="font-mono font-bold text-[#1c1b1b]">{currency(budgetAllocations.dining)}</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-[#f6f3f2]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#faba75]" />
                  <span className="text-[#404945]">Events</span>
                </div>
                <span className="font-mono font-bold text-[#1c1b1b]">{currency(budgetAllocations.events)}</span>
              </div>
            </div>
          </div>

          {/* 2. Trending Destinations Curated for You */}
          <div className="bg-[#ffffff] p-5 rounded-xl border border-[#c0c9c3]/70 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame size={19} className="text-[#9a442d]" />
                <h3 className="text-base font-bold text-[#1c1b1b]">Curated For You</h3>
              </div>
              <Link href="/explore" className="text-xs font-semibold text-[#376757] hover:underline">
                See all
              </Link>
            </div>

            {/* Mini Recommendation Rows */}
            <div className="space-y-3">
              {curatedCities.map((city, idx) => {
                const photo = getCityPhoto(city.name);
                const tag = idx === 0 ? 'Cultured' : idx === 1 ? 'Geothermal' : 'Culinary';
                return (
                  <div
                    key={city.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f6f3f2] transition-colors border border-[#c0c9c3]/40"
                  >
                    <div className="flex items-center gap-3">
                      <img src={photo} alt={city.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <h4 className="text-xs font-bold text-[#1c1b1b]">
                          {city.name}, {city.country}
                        </h4>
                        <p className="text-[11px] text-[#404945]">
                          Avg. {currency(city.cost_index)}/day • {tag}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAddCityModal({ open: true, city })}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#c0c9c3] hover:border-[#1b4d3e] text-xs font-semibold text-[#003629] hover:bg-white transition-all"
                    >
                      <Plus size={13} />
                      <span>Add to Trip</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Upcoming Travel Alerts & Fast Actions */}
          <div className="bg-[#ffffff] p-5 rounded-xl border border-[#c0c9c3]/70 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Ticket size={19} className="text-[#653b00]" />
              <h3 className="text-base font-bold text-[#1c1b1b]">Bookings &amp; Travel Passes</h3>
            </div>

            {/* Alert Card 1: Train Pass */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#f6f3f2] border border-[#c0c9c3]/50">
              <div className="flex items-start gap-2.5">
                <Train size={18} className="text-[#003629] mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#1c1b1b] block">Shinkansen Tokyo → Kyoto</span>
                  <span className="text-[11px] text-[#404945]">Seats 7A, 7B • Green Car</span>
                </div>
              </div>
              <button
                onClick={() =>
                  setTicketModal({
                    open: true,
                    title: 'Shinkansen Bullet Train — Tokyo to Kyoto',
                    type: 'train',
                    code: 'TKY-KYO-7A7B',
                    details: 'Train Nozomi #23 · Car 8, Seats 7A & 7B · Departs Tokyo Station 08:33 AM',
                  })
                }
                className="text-xs font-semibold text-[#376757] hover:underline flex items-center gap-1"
              >
                <Download size={13} />
                <span>PDF Pass</span>
              </button>
            </div>

            {/* Alert Card 2: JR Pass */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#f6f3f2] border border-[#c0c9c3]/50">
              <div className="flex items-start gap-2.5">
                <Ticket size={18} className="text-[#003629] mt-0.5 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#1c1b1b] block">7-Day Whole Japan Rail Pass</span>
                  <span className="text-[11px] text-[#404945]">Exchange Order Validated</span>
                </div>
              </div>
              <button
                onClick={() =>
                  setTicketModal({
                    open: true,
                    title: '7-Day Whole Japan National Rail Pass',
                    type: 'pass',
                    code: 'JRPASS-882193-OR',
                    details: 'Valid on all JR East, Central & West Lines · Exchange Voucher Valid until Oct 2027',
                  })
                }
                className="text-xs font-semibold text-[#376757] hover:underline flex items-center gap-1"
              >
                <QrCode size={13} />
                <span>QR Voucher</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ MODAL: Travel Pass & QR Viewer */}
      <Modal
        open={ticketModal.open}
        onClose={() => setTicketModal({ ...ticketModal, open: false })}
        title={ticketModal.title}
      >
        <div className="space-y-4 text-center p-2">
          <div className="mx-auto w-44 h-44 bg-[#f0eded] rounded-xl border border-[#c0c9c3] p-4 flex flex-col items-center justify-center">
            <QrCode size={110} className="text-[#003629]" />
            <span className="font-mono text-[10px] text-[#404945] mt-2 font-bold tracking-widest">
              {ticketModal.code}
            </span>
          </div>

          <div className="bg-[#f6f3f2] p-3 rounded-lg text-left border border-[#c0c9c3]/40">
            <span className="text-[11px] uppercase font-bold text-[#404945] tracking-wider block">Booking Details</span>
            <p className="text-xs text-[#1c1b1b] font-medium mt-0.5">{ticketModal.details}</p>
            <p className="text-[11px] text-[#376757] font-semibold mt-1">Status: Confirmed &amp; Synchronized</p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setTicketModal({ ...ticketModal, open: false })}
              className="px-4 py-2 rounded-lg bg-[#f6f3f2] text-xs font-semibold text-[#1c1b1b] hover:bg-[#eae7e7]"
            >
              Close
            </button>
            <button
              onClick={() => {
                alert(`Downloaded pass voucher ${ticketModal.code} (PDF)`);
                setTicketModal({ ...ticketModal, open: false });
              }}
              className="px-4 py-2 rounded-lg bg-[#1b4d3e] text-xs font-semibold text-white hover:bg-[#003629] flex items-center gap-1.5"
            >
              <Download size={14} /> Download PDF
            </button>
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------ MODAL: Share Itinerary */}
      <Modal
        open={shareModal.open}
        onClose={() => setShareModal({ open: false, trip: null, copied: false })}
        title={`Share ${shareModal.trip?.name ?? 'Itinerary'}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#404945]">
            Anyone with this link can view this curated itinerary, clone it to their account, and inspect your planned
            stops.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={
                shareModal.trip?.share_slug
                  ? `${typeof window !== 'undefined' ? window.location.origin : ''}/s/${shareModal.trip.share_slug}`
                  : `${typeof window !== 'undefined' ? window.location.origin : ''}/trips/${shareModal.trip?.id ?? 1}`
              }
              className="flex-1 rounded-lg border border-[#c0c9c3] bg-[#f6f3f2] px-3 py-2 text-xs font-mono text-[#1c1b1b]"
            />
            <button
              onClick={() => {
                const url = shareModal.trip?.share_slug
                  ? `${window.location.origin}/s/${shareModal.trip.share_slug}`
                  : `${window.location.origin}/trips/${shareModal.trip?.id ?? 1}`;
                navigator.clipboard.writeText(url);
                setShareModal({ ...shareModal, copied: true });
                setTimeout(() => setShareModal((s) => ({ ...s, copied: false })), 2000);
              }}
              className="px-3.5 py-2 rounded-lg bg-[#003629] text-white text-xs font-semibold hover:bg-[#1b4d3e] shrink-0 flex items-center gap-1"
            >
              {shareModal.copied ? <Check size={14} /> : <Share2 size={14} />}
              <span>{shareModal.copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShareModal({ open: false, trip: null, copied: false })}
              className="px-4 py-2 rounded-lg bg-[#f6f3f2] text-xs font-semibold text-[#1c1b1b]"
            >
              Done
            </button>
          </div>
        </div>
      </Modal>

      {/* ------------------------------------------------ MODAL: Add Curated City */}
      <Modal
        open={addCityModal.open}
        onClose={() => setAddCityModal({ open: false, city: null })}
        title={`Add ${addCityModal.city?.name ?? 'City'} to an Itinerary`}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#404945]">
            Choose which planned expedition you would like to include {addCityModal.city?.name} in:
          </p>

          <div className="space-y-2">
            {activeTrips.map((trip) => (
              <button
                key={trip.id}
                onClick={async () => {
                  try {
                    await api.post(`/trips/${trip.id}/stops`, {
                      cityId: addCityModal.city!.id,
                      startDate: trip.start_date,
                      endDate: trip.end_date,
                    });
                    alert(`Added ${addCityModal.city?.name} to ${trip.name}!`);
                    setAddCityModal({ open: false, city: null });
                  } catch (e) {
                    alert(errorText(e));
                  }
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-[#c0c9c3]/60 hover:bg-[#f6f3f2] text-left transition-colors"
              >
                <div>
                  <span className="text-xs font-bold text-[#1c1b1b] block">{trip.name}</span>
                  <span className="text-[11px] text-[#404945]">{dateRange(trip.start_date, trip.end_date)}</span>
                </div>
                <span className="text-xs font-semibold text-[#376757]">+ Add Stop</span>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-[#c0c9c3]/40">
            <Link href="/trips/new" onClick={() => setAddCityModal({ open: false, city: null })}>
              <span className="text-xs font-semibold text-[#003629] hover:underline">+ Or create a new trip</span>
            </Link>
            <button
              onClick={() => setAddCityModal({ open: false, city: null })}
              className="px-4 py-2 rounded-lg bg-[#f6f3f2] text-xs font-semibold text-[#1c1b1b]"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <PrivateRoute>
      <DashboardContent />
    </PrivateRoute>
  );
}
