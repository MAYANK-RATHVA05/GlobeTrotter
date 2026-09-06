import { NextRequest, NextResponse } from 'next/server';
import { one, tx } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError, notFound } from '@/lib/helpers';
import { loadTrip } from '@/lib/trips';

interface Params {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { slug } = await params;

    const source = await one('SELECT * FROM trips WHERE share_slug = ? AND is_public = 1', [slug]);
    if (!source) throw notFound('This itinerary is private or the link has expired.');

    const newId = await tx(async (conn) => {
      const [tripResult]: any = await conn.query(
        `INSERT INTO trips (user_id, name, description, start_date, end_date, cover_url, travellers, copied_from)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          `${source.name} (copy)`,
          source.description,
          source.start_date,
          source.end_date,
          source.cover_url,
          source.travellers,
          source.id,
        ]
      );
      const tripId = tripResult.insertId;

      const [stops]: any = await conn.query('SELECT * FROM trip_stops WHERE trip_id = ? ORDER BY position', [
        source.id,
      ]);
      const stopMap = new Map<number, number>();
      for (const s of stops) {
        const [inserted]: any = await conn.query(
          'INSERT INTO trip_stops (trip_id, city_id, start_date, end_date, position, notes) VALUES (?, ?, ?, ?, ?, ?)',
          [tripId, s.city_id, s.start_date, s.end_date, s.position, s.notes]
        );
        stopMap.set(s.id, inserted.insertId);
      }

      const [acts]: any = await conn.query('SELECT * FROM trip_activities WHERE trip_id = ?', [source.id]);
      for (const a of acts) {
        await conn.query(
          `INSERT INTO trip_activities
             (trip_id, stop_id, activity_id, title, category, cost, scheduled_date, start_time, duration_minutes, position, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tripId,
            stopMap.get(a.stop_id),
            a.activity_id,
            a.title,
            a.category,
            a.cost,
            a.scheduled_date,
            a.start_time,
            a.duration_minutes,
            a.position,
            a.notes,
          ]
        );
      }

      const [costs]: any = await conn.query('SELECT * FROM trip_costs WHERE trip_id = ?', [source.id]);
      for (const c of costs) {
        await conn.query(
          'INSERT INTO trip_costs (trip_id, stop_id, category, label, amount) VALUES (?, ?, ?, ?, ?)',
          [tripId, c.stop_id ? stopMap.get(c.stop_id) : null, c.category, c.label, c.amount]
        );
      }
      return tripId;
    });

    return NextResponse.json({ trip: await loadTrip(newId) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
