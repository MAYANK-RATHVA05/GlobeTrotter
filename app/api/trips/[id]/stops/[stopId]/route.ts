import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { badRequest, handleApiError } from '@/lib/helpers';
import { loadTrip, ownedTrip } from '@/lib/trips';

interface Params {
  params: Promise<{ id: string; stopId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id, stopId } = await params;
    const trip = await ownedTrip(id, user.id);

    const body = await req.json().catch(() => ({}));
    const fields = {
      city_id: body.cityId,
      start_date: body.startDate,
      end_date: body.endDate,
      notes: body.notes,
    };
    const set = Object.entries(fields).filter(([, v]) => v !== undefined);
    if (set.length === 0) throw badRequest('Nothing to update.');

    await run(
      `UPDATE trip_stops SET ${set.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ? AND trip_id = ?`,
      [...set.map(([, v]) => v), stopId, trip.id]
    );

    return NextResponse.json({ trip: await loadTrip(trip.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id, stopId } = await params;
    const trip = await ownedTrip(id, user.id);

    await run('DELETE FROM trip_stops WHERE id = ? AND trip_id = ?', [stopId, trip.id]);
    return NextResponse.json({ trip: await loadTrip(trip.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
