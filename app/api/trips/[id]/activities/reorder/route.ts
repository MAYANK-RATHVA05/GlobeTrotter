import { NextRequest, NextResponse } from 'next/server';
import { tx } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { badRequest, handleApiError } from '@/lib/helpers';
import { loadTrip, ownedTrip } from '@/lib/trips';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    const trip = await ownedTrip(id, user.id);

    const body = await req.json().catch(() => ({}));
    const { order, date, stopId } = body;
    if (!Array.isArray(order)) throw badRequest('Send the activity ids in their new order.');

    await tx(async (conn) => {
      for (const [index, activityId] of order.entries()) {
        const set = ['position = ?'];
        const queryParams: any[] = [index];
        if (date) {
          set.push('scheduled_date = ?');
          queryParams.push(date);
        }
        if (stopId) {
          set.push('stop_id = ?');
          queryParams.push(stopId);
        }
        await conn.query(
          `UPDATE trip_activities SET ${set.join(', ')} WHERE id = ? AND trip_id = ?`,
          [...queryParams, activityId, trip.id]
        );
      }
    });

    return NextResponse.json({ trip: await loadTrip(trip.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
