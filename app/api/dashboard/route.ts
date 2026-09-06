import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { isoDate, handleApiError } from '@/lib/helpers';
import { listTrips } from '@/lib/trips';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const today = isoDate(new Date())!;
    const trips = await listTrips(user.id);

    const ongoing = trips.filter((t) => t.status === 'ongoing');
    const upcoming = trips
      .filter((t) => t.status === 'upcoming')
      .sort((a, b) => a.start_date.localeCompare(b.start_date));
    const previous = trips.filter((t) => t.status === 'completed');

    // Regions the traveller has not been to yet lead the recommendations.
    const visitedRows = await q<{ region: string }>(
      `SELECT DISTINCT c.region FROM trip_stops s
         JOIN cities c ON c.id = s.city_id
         JOIN trips t ON t.id = s.trip_id
        WHERE t.user_id = ?`,
      [user.id]
    );
    const visitedRegions = new Set(visitedRows.map((r) => r.region));

    const popular = await q<any>(
      `SELECT c.*, COUNT(a.id) AS activity_count
         FROM cities c LEFT JOIN activities a ON a.city_id = c.id
        GROUP BY c.id ORDER BY c.popularity DESC LIMIT 24`
    );

    const recommended = [
      ...popular.filter((c) => !visitedRegions.has(c.region)),
      ...popular.filter((c) => visitedRegions.has(c.region)),
    ].slice(0, 8);

    const byRegion = await q<any>(
      `SELECT region, COUNT(*) AS city_count, ROUND(AVG(cost_index)) AS avg_daily_cost
         FROM cities GROUP BY region ORDER BY city_count DESC`
    );

    const nextTrip = ongoing[0] ?? upcoming[0] ?? null;
    const plannedSpend = trips
      .filter((t) => t.status !== 'completed')
      .reduce((sum, t) => sum + t.budget.total, 0);
    const recent = [...ongoing, ...upcoming, ...previous].slice(0, 6);
    const uniqueCities = new Set(trips.flatMap((t) => (t.route ?? []).map((r) => r.city))).size;

    return NextResponse.json({
      user,
      today,
      ongoing,
      upcoming: upcoming.slice(0, 4),
      previous: previous.slice(0, 6),
      nextTrip,
      trip: nextTrip,
      recent,
      recommended,
      regions: byRegion,
      stats: {
        trips: trips.length,
        cities: uniqueCities,
        activities: trips.reduce(
          (sum, t) => sum + (t.stops?.reduce((s, stop) => s + (stop.activities?.length ?? 0), 0) ?? 0),
          0
        ),
        totalSpend: plannedSpend,
      },
      highlights: {
        tripCount: trips.length,
        plannedSpend,
        countriesPlanned: new Set(trips.flatMap((t) => (t.route ?? []).map((r) => r.country))).size,
        daysAway: trips.filter((t) => t.status !== 'completed').reduce((sum, t) => sum + t.days, 0),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
