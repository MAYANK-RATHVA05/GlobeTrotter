import { NextRequest, NextResponse } from 'next/server';
import { badRequest, handleApiError } from '@/lib/helpers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;
    if (!EMAIL_RE.test(email ?? '')) throw badRequest('Enter a valid email address.');
    return NextResponse.json({
      message: 'If an account uses that address, a reset link is on its way. Check your inbox in a few minutes.',
    });
  } catch (err) {
    return handleApiError(err);
  }
}
