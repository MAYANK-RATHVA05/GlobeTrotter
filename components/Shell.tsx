'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppNavbar } from './navbar/AppNavbar';
import { AppSidebar } from './sidebar/AppSidebar';
import { MobileNav } from './sidebar/MobileNav';
import { QuickSearchModal } from './modals/QuickSearchModal';

export function Shell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      {/* Top Navbar */}
      <AppNavbar onOpenSearch={() => setSearchOpen(true)} />

      {/* Main Layout Container with Sidebar */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1">
        {/* Desktop Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-8 sm:py-8 pb-24 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Global Quick Search Dialog (Cmd+K) */}
      <QuickSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Professional SaaS Footer */}
      <footer className="border-t border-rule bg-surface hidden lg:block">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-5 text-[12.5px] text-mist">
          <div className="flex items-center gap-4">
            <span className="font-semibold text-ink">GlobeTrotter</span>
            <span>·</span>
            <span>Intelligent Travel Planning</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/explore" className="hover:text-ink transition-colors">Explore</Link>
            <Link href="/community" className="hover:text-ink transition-colors">Community Guides</Link>
            <Link href="/profile" className="hover:text-ink transition-colors">Settings</Link>
            <span>© 2026 GlobeTrotter, Inc.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
