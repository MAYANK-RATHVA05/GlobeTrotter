import { NextRequest, NextResponse } from 'next/server';
import { one } from '@/lib/db';
import { handleApiError, notFound } from '@/lib/helpers';
import { loadTrip } from '@/lib/trips';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const row = await one<{ id: number }>('SELECT id FROM trips WHERE share_slug = ? AND is_public = 1', [slug]);
    if (!row) throw notFound('This itinerary is private or the link has expired.');

    const trip = await loadTrip(row.id);
    return NextResponse.json({ trip });
  } catch (err) {
    return handleApiError(err);
  }
}
