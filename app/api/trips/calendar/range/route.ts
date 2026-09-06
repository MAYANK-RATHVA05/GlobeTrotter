import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { badRequest, dayCount, handleApiError, isoDate } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (!from || !to) throw badRequest('Send a from date and a to date.');

    const [trips, activities] = await Promise.all([
      q<any>(
        `SELECT id, name, start_date, end_date, cover_url FROM trips
          WHERE user_id = ? AND start_date <= ? AND end_date >= ?
          ORDER BY start_date`,
        [user.id, to, from]
      ),
      q<any>(
        `SELECT a.*, c.name AS city_name, t.name AS trip_name
           FROM trip_activities a
           JOIN trips t ON t.id = a.trip_id
           JOIN trip_stops s ON s.id = a.stop_id
           JOIN cities c ON c.id = s.city_id
          WHERE t.user_id = ? AND a.scheduled_date BETWEEN ? AND ?
          ORDER BY a.scheduled_date, a.position`,
        [user.id, from, to]
      ),
    ]);

    return NextResponse.json({
      trips: trips.map((t) => ({
        ...t,
        start_date: isoDate(t.start_date)!,
        end_date: isoDate(t.end_date)!,
        days: dayCount(t.start_date, t.end_date),
      })),
      activities: activities.map((a) => ({ ...a, scheduled_date: isoDate(a.scheduled_date)! })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
