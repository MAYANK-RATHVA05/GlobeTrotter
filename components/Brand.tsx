export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white shadow-xs">
        {/* Modern Globe / Compass Star */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="10" strokeOpacity="0.8" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" strokeOpacity="0.8" />
          <path d="M2 12h20" strokeOpacity="0.8" />
          <path d="m14 8-4 8" stroke="var(--color-sunset)" strokeWidth="2.5" />
        </svg>
      </div>
      {!compact && (
        <span className="font-display text-[18px] font-extrabold tracking-[-0.03em] text-ink">
          Globe<span className="text-brand font-black">Trotter</span>
        </span>
      )}
    </span>
  );
}
