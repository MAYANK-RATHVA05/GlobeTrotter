'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Compass, LayoutGrid, Route, User } from 'lucide-react';

const MOBILE_TABS = [
  { href: '/dashboard', label: 'Home', icon: LayoutGrid },
  { href: '/trips', label: 'Trips', icon: Route },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/profile', label: 'Profile', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-rule bg-surface/95 backdrop-blur-md px-3 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {MOBILE_TABS.map((tab) => {
          const active =
            tab.href === '/dashboard'
              ? pathname === '/dashboard' || pathname === '/'
              : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-[11px] font-medium transition-colors ${
                active ? 'text-brand font-bold' : 'text-slate hover:text-ink'
              }`}
            >
              <div className={`p-1 rounded-full ${active ? 'bg-brand-soft text-brand' : ''}`}>
                <Icon size={18} />
              </div>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
