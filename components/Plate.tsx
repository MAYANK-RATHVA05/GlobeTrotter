'use client';

import { useMemo, useState } from 'react';
import { getCityPhoto } from '../lib/destination-photos';
import { seedFrom } from '../lib/format';

const SCHEMES = [
  { ink: '#0B1B2B', line: '#0D7A5F', wash: '#E6F4F1' },
  { ink: '#0D2B2A', line: '#0A5C4A', wash: '#D5EFEC' },
  { ink: '#2B1D08', line: '#D97706', wash: '#FEF3C7' },
  { ink: '#2B1210', line: '#C2410C', wash: '#FFEDD5' },
  { ink: '#1B0F2B', line: '#7B3FBF', wash: '#EDE3FA' },
  { ink: '#0B1B2B', line: '#1F3A5F', wash: '#DCE4EE' },
];

function rng(seed: number) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state >>>= 0;
    state ^= state >> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
}

function contour(next: () => number, y: number, amp: number) {
  const points: string[] = [`M -10 ${y.toFixed(1)}`];
  for (let x = 0; x <= 220; x += 20) {
    const drift = (next() - 0.5) * amp;
    points.push(`Q ${x + 10} ${(y + drift).toFixed(1)} ${x + 20} ${(y + drift * 0.35).toFixed(1)}`);
  }
  return points.join(' ');
}

export function Plate({
  name,
  src,
  className = '',
  ratio = 'aspect-[16/10]',
  label,
  overlay = true,
}: {
  name: string;
  src?: string | null;
  className?: string;
  ratio?: string;
  label?: string;
  overlay?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const photoUrl = src || getCityPhoto(name);

  const art = useMemo(() => {
    const seed = seedFrom(name);
    const next = rng(seed);
    const scheme = SCHEMES[seed % SCHEMES.length];
    const lines = Array.from({ length: 7 }, (_, i) => contour(next, 22 + i * 16, 16 + i * 2));
    const marker = { x: 40 + next() * 120, y: 30 + next() * 60 };
    return { scheme, lines, marker };
  }, [name]);

  const { scheme, lines, marker } = art;

  return (
    <div className={`relative overflow-hidden rounded-[12px] bg-sunk ${ratio} ${className}`}>
      {!imgFailed && photoUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl}
            alt={name}
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
          {overlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
          )}
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: scheme.wash }}>
          <svg viewBox="0 0 200 125" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
            {lines.map((d, i) => (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={scheme.line}
                strokeWidth={i === 3 ? 1.4 : 0.7}
                opacity={i === 3 ? 0.75 : 0.3 + i * 0.03}
              />
            ))}
            <circle cx={marker.x} cy={marker.y} r="3.4" fill={scheme.line} />
            <circle cx={marker.x} cy={marker.y} r="8" fill="none" stroke={scheme.line} strokeWidth="0.8" opacity="0.5" />
          </svg>
        </div>
      )}

      {label && (
        <span className="absolute bottom-2.5 left-3 z-10 inline-flex items-center rounded-md bg-black/40 px-2 py-0.5 text-[10.5px] font-semibold tracking-wider text-white backdrop-blur-md uppercase">
          {label}
        </span>
      )}
    </div>
  );
}

/** A modern avatar with smooth border and image support */
export function Avatar({ name, src, size = 36 }: { name: string; src?: string | null; size?: number }) {
  const seed = seedFrom(name || '?');
  const scheme = SCHEMES[seed % SCHEMES.length];
  const letters = (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-white/80 shadow-xs"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="inline-grid shrink-0 place-items-center rounded-full font-bold shadow-xs ring-2 ring-white/80"
      style={{
        width: size,
        height: size,
        background: scheme.wash,
        color: scheme.line,
        fontSize: size * 0.38,
      }}
    >
      {letters}
    </span>
  );
}
