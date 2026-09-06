import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;
    await run('DELETE FROM community_posts WHERE id = ? AND user_id = ?', [id, user.id]);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
