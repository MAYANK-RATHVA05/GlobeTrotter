import { NextRequest, NextResponse } from 'next/server';
import { one, q } from '@/lib/db';
import { handleApiError, notFound } from '@/lib/helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const city = await one('SELECT * FROM cities WHERE id = ?', [id]);
    if (!city) throw notFound('That city is not in the catalogue.');
    const activities = await q(
      'SELECT * FROM activities WHERE city_id = ? ORDER BY popularity DESC, name ASC',
      [city.id]
    );
    return NextResponse.json({ city, activities });
  } catch (err) {
    return handleApiError(err);
  }
}
