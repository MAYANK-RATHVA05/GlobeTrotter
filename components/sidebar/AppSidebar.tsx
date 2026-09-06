'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bookmark,
  CalendarDays,
  Compass,
  Globe2,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Route,
  Settings,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/lib/client-auth';

const MAIN_NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { href: '/trips', label: 'My Trips', icon: Route },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/cities', label: 'Cities', icon: MapPin },
  { href: '/activities', label: 'Activities', icon: Sparkles },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
];

const SECONDARY_NAV = [
  { href: '/profile', label: 'Saved', icon: Bookmark },
  { href: '/community', label: 'Shared Trips', icon: Globe2 },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isLinkActive = (href: string) => {
    if (href === '/dashboard' || href === '/') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col justify-between border-r border-rule bg-surface/60 p-4 min-h-[calc(100vh-3.5rem)] select-none">
      <div className="space-y-6">
        {/* Main Section */}
        <div>
          <p className="eyebrow px-3 mb-2 text-[10px] text-mist tracking-widest font-bold">Menu</p>
          <nav className="space-y-1">
            {MAIN_NAV.map((item) => {
              const active = isLinkActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-all ${
                    active
                      ? 'bg-brand-soft text-brand font-semibold shadow-2xs'
                      : 'text-slate hover:bg-canvas hover:text-ink'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-brand' : 'text-slate'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Community & Saved Section */}
        <div>
          <p className="eyebrow px-3 mb-2 text-[10px] text-mist tracking-widest font-bold">Community</p>
          <nav className="space-y-1">
            {SECONDARY_NAV.map((item) => {
              const active = isLinkActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-all ${
                    active
                      ? 'bg-brand-soft text-brand font-semibold'
                      : 'text-slate hover:bg-canvas hover:text-ink'
                  }`}
                >
                  <Icon size={16} className={active ? 'text-brand' : 'text-slate'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Section: Settings & Admin */}
      <div className="space-y-1 border-t border-rule pt-4">
        {user?.role === 'admin' && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-all ${
              pathname.startsWith('/admin')
                ? 'bg-brand-soft text-brand font-semibold'
                : 'text-slate hover:bg-canvas hover:text-ink'
            }`}
          >
            <Shield size={16} />
            <span>Admin Console</span>
          </Link>
        )}
        <Link
          href="/profile"
          className={`flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-all ${
            pathname.startsWith('/profile') || pathname.startsWith('/settings')
              ? 'bg-brand-soft text-brand font-semibold'
              : 'text-slate hover:bg-canvas hover:text-ink'
          }`}
        >
          <Settings size={16} />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
