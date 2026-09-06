import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { badRequest, handleApiError } from '@/lib/helpers';
import { loadTrip, ownedTrip } from '@/lib/trips';

interface Params {
  params: Promise<{ id: string; activityId: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id, activityId } = await params;
    const trip = await ownedTrip(id, user.id);

    const body = await req.json().catch(() => ({}));
    const fields = {
      title: body.title,
      category: body.category,
      cost: body.cost,
      scheduled_date: body.scheduledDate,
      start_time: body.startTime,
      duration_minutes: body.durationMinutes,
      position: body.position,
      stop_id: body.stopId,
      notes: body.notes,
    };
    const set = Object.entries(fields).filter(([, v]) => v !== undefined);
    if (set.length === 0) throw badRequest('Nothing to update.');

    await run(
      `UPDATE trip_activities SET ${set.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ? AND trip_id = ?`,
      [...set.map(([, v]) => v), activityId, trip.id]
    );

    return NextResponse.json({ trip: await loadTrip(trip.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id, activityId } = await params;
    const trip = await ownedTrip(id, user.id);

    await run('DELETE FROM trip_activities WHERE id = ? AND trip_id = ?', [activityId, trip.id]);
    return NextResponse.json({ trip: await loadTrip(trip.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
