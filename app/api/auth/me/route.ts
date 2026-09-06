import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/helpers';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    return NextResponse.json({ user });
  } catch (err) {
    return handleApiError(err);
  }
}
