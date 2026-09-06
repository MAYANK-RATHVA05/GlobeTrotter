import { NextRequest, NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { handleApiError, pickSort } from '@/lib/helpers';

const SORTS = {
  popularity: 'c.popularity DESC, c.name ASC',
  name: 'c.name ASC',
  'cost-low': 'c.cost_index ASC, c.name ASC',
  'cost-high': 'c.cost_index DESC, c.name ASC',
  country: 'c.country ASC, c.name ASC',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q');
    const country = searchParams.get('country');
    const region = searchParams.get('region');
    const maxCost = searchParams.get('maxCost');
    const sort = searchParams.get('sort');
    const limit = searchParams.get('limit');

    const where: string[] = [];
    const params: any[] = [];

    if (search) {
      where.push('(c.name LIKE ? OR c.country LIKE ? OR c.region LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (country) {
      where.push('c.country = ?');
      params.push(country);
    }
    if (region) {
      where.push('c.region = ?');
      params.push(region);
    }
    if (maxCost) {
      where.push('c.cost_index <= ?');
      params.push(Number(maxCost));
    }

    const rows = await q(
      `SELECT c.*, COUNT(a.id) AS activity_count
         FROM cities c
         LEFT JOIN activities a ON a.city_id = c.id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        GROUP BY c.id
        ORDER BY ${pickSort(sort, SORTS)}
        LIMIT ?`,
      [...params, Number(limit) || 60]
    );

    return NextResponse.json({ cities: rows });
  } catch (err) {
    return handleApiError(err);
  }
}
