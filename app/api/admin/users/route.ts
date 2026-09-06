import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const search = query ? `%${query}%` : null;

    const users = await q(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.city, u.country, u.role, u.created_at,
              COUNT(DISTINCT t.id) AS trip_count,
              MAX(t.created_at) AS last_trip_at
         FROM users u LEFT JOIN trips t ON t.user_id = u.id
        ${search ? 'WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?' : ''}
        GROUP BY u.id
        ORDER BY trip_count DESC, u.created_at DESC`,
      search ? [search, search, search] : []
    );

    return NextResponse.json({ users });
  } catch (err) {
    return handleApiError(err);
  }
}
