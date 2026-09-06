import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/helpers';
import { loadTrip, ownedTrip } from '@/lib/trips';

interface Params {
  params: Promise<{ id: string; costId: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id, costId } = await params;
    const trip = await ownedTrip(id, user.id);

    await run('DELETE FROM trip_costs WHERE id = ? AND trip_id = ?', [costId, trip.id]);
    return NextResponse.json({ trip: await loadTrip(trip.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
