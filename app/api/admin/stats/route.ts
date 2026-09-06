import { NextRequest, NextResponse } from 'next/server';
import { one, q } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const [totals, tripsByMonth, topCities, topActivities, categoryMix, budgets] = await Promise.all([
      one<any>(`SELECT
             (SELECT COUNT(*) FROM users)             AS users,
             (SELECT COUNT(*) FROM trips)             AS trips,
             (SELECT COUNT(*) FROM trip_stops)        AS stops,
             (SELECT COUNT(*) FROM trip_activities)   AS activities,
             (SELECT COUNT(*) FROM trips WHERE is_public = 1) AS shared_trips,
             (SELECT COUNT(*) FROM community_posts)   AS posts`),
      q<any>(`SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS trips
           FROM trips GROUP BY month ORDER BY month`),
      q<any>(`SELECT c.id, c.name, c.country, COUNT(s.id) AS visits
           FROM trip_stops s JOIN cities c ON c.id = s.city_id
          GROUP BY c.id ORDER BY visits DESC, c.name LIMIT 10`),
      q<any>(`SELECT title, COUNT(*) AS times_added, ROUND(AVG(cost)) AS avg_cost
           FROM trip_activities GROUP BY title ORDER BY times_added DESC LIMIT 10`),
      q<any>(`SELECT category, COUNT(*) AS n FROM trip_activities GROUP BY category ORDER BY n DESC`),
      one<any>(`SELECT ROUND(AVG(days)) AS avg_days FROM (
             SELECT DATEDIFF(end_date, start_date) + 1 AS days FROM trips
           ) t`),
    ]);

    return NextResponse.json({
      totals,
      tripsByMonth,
      topCities,
      topActivities,
      categoryMix,
      avgTripDays: budgets?.avg_days ?? 0,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
