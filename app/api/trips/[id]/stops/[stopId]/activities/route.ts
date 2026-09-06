import { NextRequest, NextResponse } from 'next/server';
import { one, run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { badRequest, handleApiError, isoDate, notFound } from '@/lib/helpers';
import { loadTrip, ownedTrip } from '@/lib/trips';

interface Params {
  params: Promise<{ id: string; stopId: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id, stopId } = await params;
    const trip = await ownedTrip(id, user.id);

    const stop = await one('SELECT * FROM trip_stops WHERE id = ? AND trip_id = ?', [stopId, trip.id]);
    if (!stop) throw notFound('That stop is not on this trip.');

    const body = await req.json().catch(() => ({}));
    let { activityId, title, category, cost, scheduledDate, startTime, durationMinutes, notes } = body;

    // Adding from the catalogue fills in the details for you.
    if (activityId) {
      const source = await one('SELECT * FROM activities WHERE id = ?', [activityId]);
      if (!source) throw badRequest('That activity is not in the catalogue.');
      title ??= source.name;
      category ??= source.category;
      cost ??= source.cost;
      durationMinutes ??= source.duration_minutes;
    }
    if (!title?.trim()) throw badRequest('Give the activity a name.');

    const date = scheduledDate || isoDate(stop.start_date);
    const last = await one<{ p: number }>(
      'SELECT MAX(position) AS p FROM trip_activities WHERE stop_id = ? AND scheduled_date = ?',
      [stop.id, date]
    );

    const result = await run(
      `INSERT INTO trip_activities
         (trip_id, stop_id, activity_id, title, category, cost, scheduled_date, start_time, duration_minutes, position, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        trip.id,
        stop.id,
        activityId || null,
        title.trim(),
        category || 'sightseeing',
        Number(cost) || 0,
        date,
        startTime || null,
        Number(durationMinutes) || 60,
        (last?.p ?? -1) + 1,
        notes || null,
      ]
    );

    return NextResponse.json({ activityId: result.insertId, trip: await loadTrip(trip.id) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
