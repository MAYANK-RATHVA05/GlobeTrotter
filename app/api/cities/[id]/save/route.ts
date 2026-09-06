import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    await run('INSERT IGNORE INTO saved_cities (user_id, city_id) VALUES (?, ?)', [user.id, id]);
    return NextResponse.json({ saved: true }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    await run('DELETE FROM saved_cities WHERE user_id = ? AND city_id = ?', [user.id, id]);
    return NextResponse.json({ saved: false });
  } catch (err) {
    return handleApiError(err);
  }
}
