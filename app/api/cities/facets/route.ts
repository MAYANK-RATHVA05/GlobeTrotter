import { NextResponse } from 'next/server';
import { one, q } from '@/lib/db';
import { handleApiError } from '@/lib/helpers';

export async function GET() {
  try {
    const [countries, regions, range] = await Promise.all([
      q('SELECT country, COUNT(*) AS n FROM cities GROUP BY country ORDER BY country'),
      q('SELECT region, COUNT(*) AS n FROM cities GROUP BY region ORDER BY region'),
      one('SELECT MIN(cost_index) AS min, MAX(cost_index) AS max FROM cities'),
    ]);
    return NextResponse.json({ countries, regions, costRange: range });
  } catch (err) {
    return handleApiError(err);
  }
}
