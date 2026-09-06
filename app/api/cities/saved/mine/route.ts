import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const cities = await q(
      `SELECT c.*, s.saved_at
         FROM saved_cities s JOIN cities c ON c.id = s.city_id
        WHERE s.user_id = ? ORDER BY s.saved_at DESC`,
      [user.id]
    );
    return NextResponse.json({ cities });
  } catch (err) {
    return handleApiError(err);
  }
}
