'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Command,
  LogOut,
  MapPinned,
  Search,
  Shield,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '@/lib/client-auth';
import { Brand } from '@/components/Brand';
import { Avatar } from '@/components/Plate';
import { Button } from '@/components/ui';

export function AppNavbar({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [accountOpen]);

  const name = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Traveller';

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="shrink-0">
            <Brand />
          </Link>

          {/* Quick Search Bar */}
          <button
            onClick={onOpenSearch}
            className="hidden md:flex items-center gap-2.5 rounded-full border border-rule bg-canvas-subtle px-3.5 py-1.5 text-[13px] text-slate hover:border-gray-300 hover:text-ink transition-all cursor-pointer w-64"
          >
            <Search size={14} className="text-mist" />
            <span className="flex-1 text-left">Search destinations, trips...</span>
            <span className="flex items-center gap-0.5 rounded bg-surface px-1.5 py-0.5 text-[10.5px] font-mono font-medium text-mist border">
              <Command size={10} />K
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            size="sm"
            variant="primary"
            onClick={() => router.push('/trips/new')}
            className="hidden sm:inline-flex"
          >
            <MapPinned size={14} />
            <span>Plan New Trip</span>
          </Button>

          {/* Account Dropdown */}
          <div className="relative ml-1" ref={accountRef}>
            <button
              onClick={() => setAccountOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full p-1 transition hover:opacity-85 cursor-pointer ring-offset-2 focus-visible:outline-none"
              aria-label="User menu"
              aria-expanded={accountOpen}
            >
              <Avatar name={name} src={user?.photo_url} size={32} />
            </button>

            {accountOpen && (
              <div className="rise card-elevated absolute right-0 top-11 w-60 overflow-hidden p-1.5 z-50">
                <div className="px-3 py-2.5 border-b border-rule-subtle mb-1">
                  <p className="truncate text-sm font-bold text-ink">{name}</p>
                  <p className="truncate text-[12px] text-mist">{user?.email}</p>
                  <span className="mt-1.5 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
                    {user?.role === 'admin' ? 'Administrator' : 'Explorer'}
                  </span>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13.5px] font-medium text-ink hover:bg-canvas transition-colors"
                >
                  <UserIcon size={15} className="text-slate" /> Profile & Settings
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-[13.5px] font-medium text-ink hover:bg-canvas transition-colors"
                  >
                    <Shield size={15} className="text-slate" /> Admin Dashboard
                  </Link>
                )}

                <div className="my-1 border-t border-rule-subtle" />

                <button
                  onClick={() => {
                    setAccountOpen(false);
                    logout();
                    router.push('/login');
                  }}
                  className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-[13.5px] font-medium text-flag hover:bg-flag-soft transition-colors cursor-pointer"
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
