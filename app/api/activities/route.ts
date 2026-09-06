import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { handleApiError, pickSort } from '@/lib/helpers';

const SORTS = {
  popularity: 'a.popularity DESC, a.name ASC',
  name: 'a.name ASC',
  'cost-low': 'a.cost ASC, a.name ASC',
  'cost-high': 'a.cost DESC, a.name ASC',
  duration: 'a.duration_minutes ASC, a.name ASC',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q');
    const cityId = searchParams.get('cityId');
    const category = searchParams.get('category');
    const maxCost = searchParams.get('maxCost');
    const maxDuration = searchParams.get('maxDuration');
    const sort = searchParams.get('sort');
    const limit = searchParams.get('limit');

    const where: string[] = [];
    const params: any[] = [];

    if (search) {
      where.push('(a.name LIKE ? OR a.description LIKE ? OR c.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (cityId) {
      where.push('a.city_id = ?');
      params.push(cityId);
    }
    if (category) {
      where.push('a.category = ?');
      params.push(category);
    }
    if (maxCost) {
      where.push('a.cost <= ?');
      params.push(Number(maxCost));
    }
    if (maxDuration) {
      where.push('a.duration_minutes <= ?');
      params.push(Number(maxDuration));
    }

    const rows = await q(
      `SELECT a.*, c.name AS city_name, c.country
         FROM activities a JOIN cities c ON c.id = a.city_id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        ORDER BY ${pickSort(sort, SORTS)}
        LIMIT ?`,
      [...params, Number(limit) || 80]
    );

    return NextResponse.json({ activities: rows });
  } catch (err) {
    return handleApiError(err);
  }
}
