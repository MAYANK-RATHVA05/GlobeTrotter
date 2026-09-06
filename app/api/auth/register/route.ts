import { NextRequest, NextResponse } from 'next/server';
import { one, run } from '@/lib/db';
import { signToken, hashPassword, PUBLIC_USER_COLUMNS } from '@/lib/auth';
import { badRequest, handleApiError } from '@/lib/helpers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { firstName, lastName, email, password, phone, city, country, bio, photoUrl } = body;

    if (!firstName?.trim()) throw badRequest('Enter a first name.');
    if (!EMAIL_RE.test(email ?? '')) throw badRequest('Enter a valid email address.');
    if (!password || password.length < 8) throw badRequest('Use a password of at least 8 characters.');

    const normalized = email.trim().toLowerCase();
    const taken = await one('SELECT id FROM users WHERE email = ?', [normalized]);
    if (taken) throw badRequest('An account already uses that email address.');

    const result = await run(
      `INSERT INTO users (first_name, last_name, email, password_hash, phone, city, country, bio, photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName.trim(),
        (lastName ?? '').trim(),
        normalized,
        await hashPassword(password),
        phone || null,
        city || null,
        country || null,
        bio || null,
        photoUrl || null,
      ]
    );

    const user = await one(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ?`, [result.insertId]);
    return NextResponse.json({ token: signToken(user), user }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
