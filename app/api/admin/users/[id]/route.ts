import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { handleApiError, notFound } from '@/lib/helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { role } = body;
    if (!['user', 'admin'].includes(role)) throw notFound('Choose a role of user or admin.');

    await run('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    return NextResponse.json({ updated: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    await run('DELETE FROM users WHERE id = ? AND role <> "admin"', [id]);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
