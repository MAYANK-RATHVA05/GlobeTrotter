import { NextRequest, NextResponse } from 'next/server';
import { one, q } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, notFound } from '@/lib/helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const { id } = await params;

    const user = await one('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) throw notFound('No such user.');

    const trips = await q(
      `SELECT t.id, t.name, t.start_date, t.end_date, t.is_public,
              COUNT(DISTINCT s.id) AS stop_count
         FROM trips t LEFT JOIN trip_stops s ON s.trip_id = t.id
        WHERE t.user_id = ? GROUP BY t.id ORDER BY t.start_date DESC`,
      [id]
    );

    return NextResponse.json({ trips });
  } catch (err) {
    return handleApiError(err);
  }
}
