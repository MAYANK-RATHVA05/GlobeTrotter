import Link from 'next/link';
import { Brand } from './Brand';
import { Compass, MapPin, Star } from 'lucide-react';

export function AuthAside() {
  return (
    <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white">
      {/* Full-height high-resolution travel image with gentle gradient overlays */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1600&q=85"
        alt="Tokyo cityscape at sunset"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/50" />

      {/* Top Brand Logo */}
      <div className="relative z-10">
        <Link href="/" className="inline-block [&_span]:text-white">
          <Brand />
        </Link>
      </div>

      {/* Center / Bottom Editorial Highlight */}
      <div className="relative z-10 max-w-md space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[12px] font-semibold tracking-wide text-white backdrop-blur-md">
          <MapPin size={13} className="text-sunset" />
          <span>Tokyo & Kyoto Autumn Explorer</span>
        </div>

        <h2 className="text-[38px] font-black leading-[1.08] tracking-tight text-white">
          Build journeys you&apos;ll remember forever.
        </h2>

        <p className="text-[15px] leading-relaxed text-gray-200">
          Intelligent multi-city routing, automatic budget forecasting, and curated activity schedules designed for the modern traveller.
        </p>

        {/* Floating Itinerary Snippet Card */}
        <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between text-[12.5px] border-b border-white/15 pb-2.5 mb-2.5">
            <span className="font-semibold text-white">Day 2: Shibuya & Harajuku</span>
            <span className="font-mono text-emerald-300 font-bold">$125 planned</span>
          </div>
          <div className="space-y-1.5 text-[12px] text-gray-200">
            <div className="flex items-center justify-between">
              <span>09:00 · Meiji Jingu Shrine Walk</span>
              <span className="text-white/70">Free</span>
            </div>
            <div className="flex items-center justify-between">
              <span>13:30 · Omotesando Architecture & Lunch</span>
              <span className="text-white/70">$35</span>
            </div>
            <div className="flex items-center justify-between">
              <span>17:00 · Shibuya Sky Sunset Observatory</span>
              <span className="text-white/70">$18</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Quote & Trust Pill */}
      <div className="relative z-10 flex items-center justify-between text-[12.5px] text-gray-300 border-t border-white/15 pt-6">
        <div className="flex items-center gap-1.5">
          <Star size={14} className="text-amber fill-amber" />
          <span>Rated 4.9/5 by 20,000+ travellers worldwide</span>
        </div>
        <span>Japan 2026</span>
      </div>
    </aside>
  );
}
