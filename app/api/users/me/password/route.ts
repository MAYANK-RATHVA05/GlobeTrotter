import { NextRequest, NextResponse } from 'next/server';
import { run } from '@/lib/db';
import { requireAuth, hashPassword } from '@/lib/auth';
import { badRequest, handleApiError } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const { password } = body;
    if (!password || password.length < 8) throw badRequest('Use a password of at least 8 characters.');

    await run('UPDATE users SET password_hash = ? WHERE id = ?', [await hashPassword(password), user.id]);
    return NextResponse.json({ updated: true });
  } catch (err) {
    return handleApiError(err);
  }
}
