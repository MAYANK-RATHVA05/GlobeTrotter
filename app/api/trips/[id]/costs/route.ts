import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
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
    const { category, label, amount, stopId } = body;
    if (!['transport', 'stay', 'meals', 'other'].includes(category)) throw badRequest('Choose a cost category.');
    if (!label?.trim()) throw badRequest('Give the cost a label.');

    await run('INSERT INTO trip_costs (trip_id, stop_id, category, label, amount) VALUES (?, ?, ?, ?, ?)', [
      trip.id,
      stopId || null,
      category,
      label.trim(),
      Number(amount) || 0,
    ]);

    return NextResponse.json({ trip: await loadTrip(trip.id) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
