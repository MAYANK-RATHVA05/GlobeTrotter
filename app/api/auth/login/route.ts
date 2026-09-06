import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, signToken, publicUser } from '@/lib/auth';
import { handleApiError } from '@/lib/helpers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'That email and password do not match an account.' }, { status: 401 });
    }

    const user = await verifyCredentials(email, password);
    if (!user) {
      return NextResponse.json({ error: 'That email and password do not match an account.' }, { status: 401 });
    }

    return NextResponse.json({
      token: signToken(user),
      user: publicUser(user),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
