import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { badRequest, handleApiError } from '@/lib/helpers';
import { listTrips, loadTrip } from '@/lib/trips';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const trips = await listTrips(user.id);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('q');

    let filtered = trips;
    if (status && status !== 'all') filtered = filtered.filter((t) => t.status === status);
    if (search) {
      const needle = search.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(needle) ||
          (t.description ?? '').toLowerCase().includes(needle) ||
          (t.route ?? []).some((r) => r.city.toLowerCase().includes(needle))
      );
    }

    return NextResponse.json({
      trips: filtered,
      counts: {
        all: trips.length,
        ongoing: trips.filter((t) => t.status === 'ongoing').length,
        upcoming: trips.filter((t) => t.status === 'upcoming').length,
        completed: trips.filter((t) => t.status === 'completed').length,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const { name, description, startDate, endDate, coverUrl, travellers } = body;

    if (!name?.trim()) throw badRequest('Give the trip a name.');
    if (!startDate || !endDate) throw badRequest('Choose a start date and an end date.');
    if (endDate < startDate) throw badRequest('The end date must come after the start date.');

    const result = await run(
      `INSERT INTO trips (user_id, name, description, start_date, end_date, cover_url, travellers)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, name.trim(), description || null, startDate, endDate, coverUrl || null, Number(travellers) || 1]
    );

    const trip = await loadTrip(result.insertId);
    return NextResponse.json({ trip }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
