'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, MapPin, Route, Search, Sparkles, X } from 'lucide-react';
import { api } from '@/lib/api';

interface SearchResult {
  trips: { id: number; name: string; start_date: string }[];
  cities: { id: number; name: string; country: string }[];
  activities: { id: number; title: string; category: string }[];
}

export function QuickSearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ trips: [], cities: [], activities: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
        else open = true;
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults({ trips: [], cities: [], activities: [] });
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ trips: [], cities: [], activities: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [tripsRes, citiesRes] = await Promise.all([
          api.get('/trips', { params: { limit: 5 } }).catch(() => ({ data: { trips: [] } })),
          api.get('/cities', { params: { q: query, limit: 5 } }).catch(() => ({ data: { cities: [] } })),
        ]);

        const filteredTrips = (tripsRes.data?.trips ?? []).filter((t: any) =>
          t.name.toLowerCase().includes(query.toLowerCase())
        );

        setResults({
          trips: filteredTrips,
          cities: citiesRes.data?.cities ?? [],
          activities: [],
        });
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onClose} aria-hidden />

      <div className="rise relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-rule bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-rule px-4 py-3.5">
          <Search size={18} className="text-mist shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search trips, cities, places to explore..."
            className="flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-mist"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-mist hover:text-ink">
              <X size={15} />
            </button>
          )}
          <span className="rounded bg-canvas px-1.5 py-0.5 text-[11px] font-mono text-mist border">ESC</span>
        </div>

        <div className="max-h-96 overflow-y-auto p-3">
          {query.trim().length < 2 ? (
            <div className="py-8 text-center text-[13px] text-mist">
              <Compass size={28} className="mx-auto mb-2 text-brand opacity-60" />
              <p>Type at least 2 characters to search across GlobeTrotter</p>
            </div>
          ) : loading ? (
            <div className="py-8 text-center text-[13px] text-mist">Searching destinations...</div>
          ) : results.trips.length === 0 && results.cities.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-mist">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-4">
              {results.trips.length > 0 && (
                <div>
                  <p className="eyebrow px-3 mb-1.5 text-[10.5px]">Your Trips</p>
                  <div className="space-y-0.5">
                    {results.trips.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          onClose();
                          router.push(`/trips/${t.id}`);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] text-ink hover:bg-canvas transition-colors"
                      >
                        <Route size={15} className="text-brand" />
                        <span className="font-medium">{t.name}</span>
                        <span className="num ml-auto text-[12px] text-mist">{t.start_date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.cities.length > 0 && (
                <div>
                  <p className="eyebrow px-3 mb-1.5 text-[10.5px]">Destinations</p>
                  <div className="space-y-0.5">
                    {results.cities.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onClose();
                          router.push(`/explore?q=${encodeURIComponent(c.name)}`);
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] text-ink hover:bg-canvas transition-colors"
                      >
                        <MapPin size={15} className="text-sunset" />
                        <span className="font-medium">{c.name}</span>
                        <span className="text-[12px] text-slate">{c.country}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
