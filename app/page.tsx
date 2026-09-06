'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  CreditCard,
  Globe2,
  Layers,
  MapPin,
  MapPinned,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/lib/client-auth';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/ui';

const DESTINATIONS = [
  {
    name: 'Tokyo',
    country: 'Japan',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80',
    tag: 'Culture & Food',
    rating: 4.9,
    price: '$140/day',
  },
  {
    name: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    tag: 'Art & Romance',
    rating: 4.8,
    price: '$180/day',
  },
  {
    name: 'Bali',
    country: 'Indonesia',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    tag: 'Nature & Serenity',
    rating: 4.9,
    price: '$75/day',
  },
  {
    name: 'New York',
    country: 'United States',
    image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=800&q=80',
    tag: 'Urban Energy',
    rating: 4.8,
    price: '$210/day',
  },
  {
    name: 'Swiss Alps',
    country: 'Switzerland',
    image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80',
    tag: 'Alpine Hiking',
    rating: 5.0,
    price: '$220/day',
  },
  {
    name: 'Dubai',
    country: 'United Arab Emirates',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    tag: 'Modern Luxury',
    rating: 4.7,
    price: '$190/day',
  },
];

const FEATURES = [
  {
    title: 'Smart Multi-City Itineraries',
    description:
      'Seamlessly plan route sequences between cities with automatic travel-day calculations, timeline synchronization, and activity slots.',
    icon: RouteIcon,
    accent: 'bg-brand-soft text-brand',
  },
  {
    title: 'Real-Time Budget Tracking',
    description:
      'Live expense estimation for transport, accommodation, food, and sightseeing so you never encounter unexpected surprises.',
    icon: Wallet,
    accent: 'bg-amber-soft text-amber',
  },
  {
    title: 'Curated Activity Discovery',
    description:
      'Explore handpicked sightseeing, local culinary tours, and hidden cultural gems with ratings, durations, and costs.',
    icon: Compass,
    accent: 'bg-sunset-soft text-sunset',
  },
  {
    title: 'Collaborative Sharing & Cloning',
    description:
      'Generate stunning public travel guides or copy verified community itineraries directly into your account with one click.',
    icon: Share2,
    accent: 'bg-emerald-100 text-emerald-800',
  },
];

function RouteIcon(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-canvas selection:bg-brand-soft selection:text-brand-dark">
      {/* ------------------------------------------------ Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-rule/70 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="shrink-0">
            <Brand />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[14px] font-medium text-slate">
            <a href="#features" className="hover:text-ink transition-colors">Features</a>
            <a href="#destinations" className="hover:text-ink transition-colors">Destinations</a>
            <a href="#how-it-works" className="hover:text-ink transition-colors">How it works</a>
            <Link href="/explore" className="hover:text-ink transition-colors">Explore</Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Button variant="primary" onClick={() => router.push('/dashboard')}>
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Start Planning
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ------------------------------------------------ Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-soft/70 px-3.5 py-1 text-[12px] font-semibold text-brand">
                <Sparkles size={13} />
                <span>The intelligent travel operating system</span>
              </div>

              <h1 className="text-[42px] sm:text-[56px] lg:text-[62px] font-black tracking-[-0.03em] text-ink leading-[1.06]">
                Plan less. <br />
                <span className="text-brand">Explore more.</span>
              </h1>

              <p className="text-[17px] sm:text-[19px] text-slate max-w-xl font-normal leading-relaxed">
                Build unforgettable multi-city journeys with intelligent day-by-day itineraries,
                curated activity discovery, and real-time budget forecasting.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link href={user ? '/trips/new' : '/register'}>
                  <Button size="lg" variant="primary" className="shadow-lg shadow-brand/20">
                    <span>Start Planning Free</span>
                    <ArrowRight size={16} />
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button size="lg" variant="quiet">
                    <Compass size={16} />
                    <span>Explore Destinations</span>
                  </Button>
                </Link>
              </div>

              <div className="pt-4 flex items-center gap-6 text-[13px] text-slate">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={16} className="text-brand" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={16} className="text-brand" />
                  <span>Free itinerary sharing</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual UI Mockup */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                {/* Decorative background glow */}
                <div className="absolute -inset-4 rounded-3xl bg-gradient-to-tr from-brand/20 via-sunset/10 to-transparent blur-2xl -z-10" />

                {/* Primary Card: Itinerary Preview */}
                <div className="card-elevated overflow-hidden border border-rule/80 bg-surface rounded-2xl shadow-2xl">
                  {/* Top Window Bar */}
                  <div className="flex items-center justify-between border-b border-rule bg-canvas-subtle px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="font-mono text-[11px] font-semibold text-mist uppercase tracking-widest">
                      Japan Adventure · 10 Days
                    </span>
                    <span className="text-[11px] font-semibold text-brand bg-brand-soft px-2 py-0.5 rounded-md">
                      Confirmed
                    </span>
                  </div>

                  {/* Visual Header Image */}
                  <div className="relative h-44 w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80"
                      alt="Kyoto Pagoda"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4 text-white">
                      <p className="text-[12px] font-medium text-emerald-300">Tokyo → Kyoto → Osaka</p>
                      <h3 className="text-[20px] font-bold">The Golden Route Tour</h3>
                    </div>
                  </div>

                  {/* Day Timeline Snippet */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between text-[12px] text-slate pb-2 border-b">
                      <span className="font-semibold text-ink">Day 3: Kyoto Historic Quarter</span>
                      <span className="num font-semibold text-brand">$165 / day</span>
                    </div>

                    <div className="space-y-2 text-[13px]">
                      <div className="flex items-center justify-between rounded-lg bg-canvas p-2.5 border border-rule">
                        <div className="flex items-center gap-2.5">
                          <span className="num font-semibold text-brand text-[12px]">08:30</span>
                          <span className="font-medium text-ink">Fushimi Inari Morning Walk</span>
                        </div>
                        <span className="text-[11px] rounded bg-brand-soft text-brand font-semibold px-2 py-0.5">Culture</span>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-canvas p-2.5 border border-rule">
                        <div className="flex items-center gap-2.5">
                          <span className="num font-semibold text-brand text-[12px]">12:00</span>
                          <span className="font-medium text-ink">Nishiki Market Culinary Tour</span>
                        </div>
                        <span className="text-[11px] rounded bg-sunset-soft text-sunset font-semibold px-2 py-0.5">Food</span>
                      </div>
                    </div>

                    {/* Floating Budget Badge */}
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-brand to-brand-dark p-3 text-white shadow-md">
                      <div className="flex items-center gap-2">
                        <Wallet size={16} className="text-emerald-300" />
                        <div>
                          <p className="text-[10.5px] uppercase tracking-wider text-emerald-200 font-semibold">Total Estimated</p>
                          <p className="num text-[17px] font-extrabold">$2,840</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] rounded bg-white/20 px-2 py-0.5 font-medium backdrop-blur-md">
                          $160 under budget
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Micro Card 1 */}
                <div className="hidden sm:flex absolute -bottom-5 -left-6 items-center gap-3 rounded-xl border border-rule bg-surface p-3 shadow-xl backdrop-blur-md">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[11px] text-mist font-medium">Next Destination</p>
                    <p className="text-[13px] font-bold text-ink">Osaka Gastronomy</p>
                  </div>
                </div>

                {/* Floating Micro Card 2 */}
                <div className="hidden sm:flex absolute -top-4 -right-4 items-center gap-2 rounded-xl border border-rule bg-surface px-3 py-2 shadow-lg">
                  <Star size={15} className="text-amber fill-amber" />
                  <span className="text-[12px] font-bold text-ink">4.9 / 5.0 Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Features Section */}
      <section id="features" className="border-t border-rule bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <p className="eyebrow text-brand font-bold">Why GlobeTrotter</p>
            <h2 className="text-[32px] sm:text-[40px] font-extrabold text-ink tracking-tight">
              Everything you need to travel seamlessly
            </h2>
            <p className="text-[16px] text-slate">
              Designed to replace chaotic spreadsheets, cluttered bookmark folders, and disorganized note apps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card p-6 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-rule space-y-4"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.accent}`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-[18px] font-bold text-ink">{feature.title}</h3>
                  <p className="text-[14px] text-slate leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Destination Showcase */}
      <section id="destinations" className="py-20 bg-canvas">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <p className="eyebrow text-brand font-bold">Inspiration Catalog</p>
              <h2 className="text-[32px] sm:text-[38px] font-extrabold text-ink tracking-tight">
                Featured Destinations
              </h2>
              <p className="text-[15px] text-slate mt-1">
                Explore hand-curated multi-day journeys in top global travel capitals.
              </p>
            </div>
            <Link href="/explore">
              <Button variant="quiet">
                <span>View all destinations</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DESTINATIONS.map((dest) => (
              <div
                key={dest.name}
                className="card group overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-rule bg-surface flex flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dest.image}
                    alt={dest.name}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 rounded-md bg-black/40 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    {dest.tag}
                  </span>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-white/90 px-2 py-0.5 text-[12px] font-bold text-ink backdrop-blur-md">
                    <Star size={12} className="text-amber fill-amber" />
                    <span>{dest.rating}</span>
                  </div>
                </div>

                <div className="p-5 flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="text-[20px] font-bold text-ink group-hover:text-brand transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-[13px] text-slate">{dest.country}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-rule-subtle pt-3">
                    <span className="text-[13px] font-semibold text-ink">
                      Avg {dest.price}
                    </span>
                    <Link
                      href={`/explore?q=${encodeURIComponent(dest.name)}`}
                      className="text-[13px] font-semibold text-brand hover:underline flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ How It Works Section */}
      <section id="how-it-works" className="border-t border-rule bg-surface py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <p className="eyebrow text-brand font-bold">Step-by-Step</p>
            <h2 className="text-[32px] sm:text-[40px] font-extrabold text-ink tracking-tight">
              How GlobeTrotter Works
            </h2>
            <p className="text-[16px] text-slate">
              From an initial idea to a completely budgeted itinerary in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 text-center sm:text-left">
              <span className="font-mono text-[32px] font-black text-brand">01</span>
              <h3 className="text-[20px] font-bold text-ink">Create Your Journey</h3>
              <p className="text-[14.5px] text-slate leading-relaxed">
                Add your destinations, travel dates, and travel party. GlobeTrotter generates your master route timeline.
              </p>
            </div>

            <div className="space-y-4 text-center sm:text-left">
              <span className="font-mono text-[32px] font-black text-brand">02</span>
              <h3 className="text-[20px] font-bold text-ink">Build Day-Wise Itineraries</h3>
              <p className="text-[14.5px] text-slate leading-relaxed">
                Drag and schedule activities, restaurant stops, and sightseeing tours into precise daily slots.
              </p>
            </div>

            <div className="space-y-4 text-center sm:text-left">
              <span className="font-mono text-[32px] font-black text-brand">03</span>
              <h3 className="text-[20px] font-bold text-ink">Explore Without Stress</h3>
              <p className="text-[14.5px] text-slate leading-relaxed">
                Access your schedule offline, track expenses as you spend, and share live itinerary links with companions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Final CTA Banner */}
      <section className="bg-brand py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-white/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-4xl px-6 text-center space-y-6 relative z-10">
          <h2 className="text-[36px] sm:text-[48px] font-black tracking-tight text-white leading-tight">
            Your next adventure starts here.
          </h2>
          <p className="text-[18px] text-emerald-100 max-w-xl mx-auto font-normal">
            Join thousands of modern travelers who build smarter, more organized multi-city itineraries with GlobeTrotter.
          </p>
          <div className="pt-2">
            <Link href={user ? '/trips/new' : '/register'}>
              <button className="h-12 px-8 rounded-xl bg-white text-brand font-bold text-[15px] shadow-2xl hover:bg-emerald-50 active:scale-98 transition-all cursor-pointer">
                Start Planning for Free
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Footer */}
      <footer className="border-t border-rule bg-surface py-12">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Brand />
          <div className="flex items-center gap-6 text-[13px] text-slate">
            <Link href="/explore" className="hover:text-ink">Explore</Link>
            <Link href="/community" className="hover:text-ink">Community</Link>
            <Link href="/login" className="hover:text-ink">Sign in</Link>
            <Link href="/register" className="hover:text-ink">Sign up</Link>
          </div>
          <p className="text-[12px] text-mist">
            © 2026 GlobeTrotter, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
