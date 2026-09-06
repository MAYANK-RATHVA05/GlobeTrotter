import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { badRequest, handleApiError } from '@/lib/helpers';
import { loadTrip, ownedTrip } from '@/lib/trips';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    await ownedTrip(id, user.id);
    const trip = await loadTrip(id);
    return NextResponse.json({ trip });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    await ownedTrip(id, user.id);

    const body = await req.json().catch(() => ({}));
    const fields = {
      name: body.name,
      description: body.description,
      start_date: body.startDate,
      end_date: body.endDate,
      cover_url: body.coverUrl,
      travellers: body.travellers,
    };
    const set = Object.entries(fields).filter(([, v]) => v !== undefined);
    if (set.length === 0) throw badRequest('Nothing to update.');

    await run(
      `UPDATE trips SET ${set.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`,
      [...set.map(([, v]) => v), id]
    );

    const trip = await loadTrip(id);
    return NextResponse.json({ trip });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    await ownedTrip(id, user.id);
    await run('DELETE FROM trips WHERE id = ?', [id]);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
