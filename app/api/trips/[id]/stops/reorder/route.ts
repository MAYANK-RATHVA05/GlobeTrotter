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
    const order = body?.order;
    if (!Array.isArray(order)) throw badRequest('Send the stop ids in their new order.');

    await tx(async (conn) => {
      for (const [index, stopId] of order.entries()) {
        await conn.query('UPDATE trip_stops SET position = ? WHERE id = ? AND trip_id = ?', [index, stopId, trip.id]);
      }
    });

    return NextResponse.json({ trip: await loadTrip(trip.id) });
  } catch (err) {
    return handleApiError(err);
  }
}
