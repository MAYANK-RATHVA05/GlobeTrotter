import { NextRequest, NextResponse } from 'next/server';
import { one, q, run } from '@/lib/db';
import { requireAuth, PUBLIC_USER_COLUMNS } from '@/lib/auth';
import { badRequest, handleApiError } from '@/lib/helpers';
import { listTrips } from '@/lib/trips';

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const trips = await listTrips(user.id);
    const saved = await q(
      `SELECT c.* FROM saved_cities s JOIN cities c ON c.id = s.city_id
        WHERE s.user_id = ? ORDER BY s.saved_at DESC`,
      [user.id]
    );

    return NextResponse.json({
      user,
      planned: trips.filter((t) => t.status !== 'completed'),
      previous: trips.filter((t) => t.status === 'completed'),
      savedCities: saved,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const fields = {
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email && String(body.email).trim().toLowerCase(),
      phone: body.phone,
      city: body.city,
      country: body.country,
      bio: body.bio,
      photo_url: body.photoUrl,
      language: body.language,
      home_currency: body.homeCurrency,
    };
    const set = Object.entries(fields).filter(([, v]) => v !== undefined);
    if (set.length === 0) throw badRequest('Nothing to update.');

    if (fields.email) {
      const taken = await one('SELECT id FROM users WHERE email = ? AND id <> ?', [fields.email, user.id]);
      if (taken) throw badRequest('Another account already uses that email address.');
    }

    await run(`UPDATE users SET ${set.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`, [
      ...set.map(([, v]) => v),
      user.id,
    ]);

    const updated = await one(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ?`, [user.id]);
    return NextResponse.json({ user: updated });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    await run('DELETE FROM users WHERE id = ?', [user.id]);
    return NextResponse.json({ deleted: true });
  } catch (err) {
    return handleApiError(err);
  }
}
