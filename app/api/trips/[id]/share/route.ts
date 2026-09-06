import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError, shareSlug } from '@/lib/helpers';
import { ownedTrip } from '@/lib/trips';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const trip = await ownedTrip(id, user.id);

    const body = await req.json().catch(() => ({}));
    const makePublic = body?.isPublic !== false;
    const slug = trip.share_slug || shareSlug();

    await run('UPDATE trips SET is_public = ?, share_slug = ? WHERE id = ?', [
      makePublic ? 1 : 0,
      slug,
      trip.id,
    ]);

    return NextResponse.json({ isPublic: makePublic, slug });
  } catch (err) {
    return handleApiError(err);
  }
}
