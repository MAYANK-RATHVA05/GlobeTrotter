import { NextResponse } from 'next/server';
import { q } from '@/lib/db';
import { handleApiError } from '@/lib/helpers';

export async function GET() {
  try {
    const categories = await q(
      'SELECT category, COUNT(*) AS n, ROUND(AVG(cost)) AS avg_cost FROM activities GROUP BY category ORDER BY n DESC'
    );
    return NextResponse.json({ categories });
  } catch (err) {
    return handleApiError(err);
  }
}
