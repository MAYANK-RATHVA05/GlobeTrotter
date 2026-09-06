import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

/** An error that carries an HTTP status code. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const badRequest = (msg: string) => new HttpError(400, msg);
export const notFound = (msg = 'Not found.') => new HttpError(404, msg);
export const forbidden = (msg = 'You do not have access to this.') => new HttpError(403, msg);
export const unauthorized = (msg = 'Authentication required.') => new HttpError(401, msg);

/** A short, URL-safe id used for share links. */
export function shareSlug(): string {
  return crypto.randomBytes(9).toString('base64url').slice(0, 12);
}

/** 'YYYY-MM-DD' for a Date or a date-like string. */
export function isoDate(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

/** Every date from start to end, inclusive, as 'YYYY-MM-DD'. */
export function eachDate(start: string | Date, end: string | Date): string[] {
  const out: string[] = [];
  const s = isoDate(start);
  const e = isoDate(end);
  if (!s || !e) return out;
  const cursor = new Date(`${s}T00:00:00Z`);
  const last = new Date(`${e}T00:00:00Z`);
  while (cursor <= last) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/** Whole days from start to end, inclusive. */
export function dayCount(start: string | Date, end: string | Date): number {
  const s = isoDate(start);
  const e = isoDate(end);
  if (!s || !e) return 1;
  const a = new Date(`${s}T00:00:00Z`).getTime();
  const b = new Date(`${e}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

/** 'upcoming' | 'ongoing' | 'completed' for a date range. */
export function tripStatus(
  start: string | Date,
  end: string | Date,
  today: string = isoDate(new Date())!
): 'upcoming' | 'ongoing' | 'completed' {
  const s = isoDate(start)!;
  const e = isoDate(end)!;
  if (e < today) return 'completed';
  if (s > today) return 'upcoming';
  return 'ongoing';
}

/** Pick an allowed sort column, falling back to the first one. */
export function pickSort(requested: string | null | undefined, allowed: Record<string, string>): string {
  if (requested && allowed[requested]) return allowed[requested];
  return Object.values(allowed)[0];
}

/** Format error for Next.js Route Handler JSON response. */
export function handleApiError(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  const errorObj = err as any;
  const isDbDown = errorObj?.code === 'ECONNREFUSED' || errorObj?.code === 'ER_BAD_DB_ERROR';
  const status = errorObj?.status || 500;
  if (status >= 500) {
    console.error('API Handler Error:', err);
  }
  return NextResponse.json(
    {
      error: isDbDown
        ? 'The database is not reachable. Check database configuration.'
        : errorObj?.message || 'Something went wrong.',
    },
    { status: isDbDown ? 503 : status }
  );
}
