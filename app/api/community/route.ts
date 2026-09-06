import { NextRequest, NextResponse } from 'next/server';
import { q, run } from '@/lib/db';
import { optionalAuth, requireAuth } from '@/lib/auth';
import { badRequest, handleApiError, pickSort } from '@/lib/helpers';

const SORTS = {
  newest: 'p.created_at DESC',
  oldest: 'p.created_at ASC',
  liked: 'like_count DESC, p.created_at DESC',
};

export async function GET(req: NextRequest) {
  try {
    const user = await optionalAuth(req);
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q');
    const cityId = searchParams.get('cityId');
    const sort = searchParams.get('sort');

    const where: string[] = [];
    const params: any[] = [];

    if (search) {
      where.push('(p.title LIKE ? OR p.body LIKE ? OR c.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (cityId) {
      where.push('p.city_id = ?');
      params.push(cityId);
    }

    const posts = await q(
      `SELECT p.*,
              CONCAT(u.first_name, ' ', u.last_name) AS author_name,
              u.photo_url AS author_photo,
              c.name AS city_name, c.country,
              t.share_slug, t.name AS trip_name, t.is_public,
              COUNT(DISTINCT l.user_id) AS like_count,
              SUM(l.user_id = ?) AS liked_by_me
         FROM community_posts p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN cities c ON c.id = p.city_id
         LEFT JOIN trips t ON t.id = p.trip_id
         LEFT JOIN post_likes l ON l.post_id = p.id
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
        GROUP BY p.id
        ORDER BY ${pickSort(sort, SORTS)}
        LIMIT 60`,
      [user?.id ?? 0, ...params]
    );

    return NextResponse.json({ posts });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(req);
    const body = await req.json().catch(() => ({}));
    const { title, body: content, tripId, cityId } = body;

    if (!title?.trim()) throw badRequest('Give the post a title.');
    if (!content?.trim()) throw badRequest('Write something to share.');

    const result = await run(
      'INSERT INTO community_posts (user_id, trip_id, city_id, title, body) VALUES (?, ?, ?, ?, ?)',
      [user.id, tripId || null, cityId || null, title.trim(), content.trim()]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
