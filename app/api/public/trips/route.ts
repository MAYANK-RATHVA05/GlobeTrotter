import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { handleApiError } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 24;

    const trips = await q(
      `SELECT t.id, t.name, t.description, t.start_date, t.end_date, t.cover_url, t.share_slug,
              CONCAT(u.first_name, ' ', u.last_name) AS owner_name, u.photo_url AS owner_photo,
              COUNT(DISTINCT s.id) AS stop_count,
              GROUP_CONCAT(DISTINCT c.name ORDER BY s.position SEPARATOR ' → ') AS route
         FROM trips t
         JOIN users u ON u.id = t.user_id
         LEFT JOIN trip_stops s ON s.trip_id = t.id
         LEFT JOIN cities c ON c.id = s.city_id
        WHERE t.is_public = 1
        GROUP BY t.id
        ORDER BY t.created_at DESC
        LIMIT ?`,
      [limit]
    );

    return NextResponse.json({ trips });
  } catch (err) {
    return handleApiError(err);
  }
}
