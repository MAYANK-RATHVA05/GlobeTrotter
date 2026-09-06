import { NextRequest, NextResponse } from 'next/server';
import { one, run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { badRequest, handleApiError, isoDate } from '@/lib/helpers';
import { loadTrip, ownedTrip } from '@/lib/trips';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const trip = await ownedTrip(id, user.id);

    const body = await req.json().catch(() => ({}));
    const { cityId, startDate, endDate, notes } = body;
    if (!cityId) throw badRequest('Choose a city for this stop.');

    const city = await one('SELECT id FROM cities WHERE id = ?', [cityId]);
    if (!city) throw badRequest('That city is not in the catalogue.');

    const last = await one<{ p: number }>('SELECT MAX(position) AS p FROM trip_stops WHERE trip_id = ?', [trip.id]);
    const position = (last?.p ?? -1) + 1;

    // Default to the day after the previous stop ends, or the trip start.
    const previous = await one<{ end_date: string }>(
      'SELECT end_date FROM trip_stops WHERE trip_id = ? ORDER BY position DESC LIMIT 1',
      [trip.id]
    );
    const fallbackStart = previous ? isoDate(previous.end_date)! : isoDate(trip.start_date)!;
    const start = startDate || fallbackStart;

    // Default to a two-night stay, shortened to whatever is left of the trip.
    const suggested = new Date(`${start}T00:00:00Z`);
    suggested.setUTCDate(suggested.getUTCDate() + 2);
    const defaultEnd =
      [isoDate(suggested)!, isoDate(trip.end_date)!].filter((d) => d >= start).sort()[0] ?? start;
    const end = endDate || defaultEnd;
    if (end < start) throw badRequest('The stop cannot end before it starts.');

    const result = await run(
      'INSERT INTO trip_stops (trip_id, city_id, start_date, end_date, position, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [trip.id, cityId, start, end, position, notes || null]
    );

    return NextResponse.json({ stopId: result.insertId, trip: await loadTrip(trip.id) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
