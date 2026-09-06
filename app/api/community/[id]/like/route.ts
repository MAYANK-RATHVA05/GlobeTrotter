import { NextRequest, NextResponse } from 'next/server';
import { one, run } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { handleApiError, notFound } from '@/lib/helpers';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await requireAuth(req);
    const { id } = await params;

    const post = await one('SELECT id FROM community_posts WHERE id = ?', [id]);
    if (!post) throw notFound('That post is gone.');

    const existing = await one('SELECT 1 AS x FROM post_likes WHERE post_id = ? AND user_id = ?', [
      post.id,
      user.id,
    ]);

    if (existing) {
      await run('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [post.id, user.id]);
    } else {
      await run('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [post.id, user.id]);
    }

    const count = await one<{ n: number }>('SELECT COUNT(*) AS n FROM post_likes WHERE post_id = ?', [post.id]);
    return NextResponse.json({ liked: !existing, likeCount: count?.n ?? 0 });
  } catch (err) {
    return handleApiError(err);
  }
}
