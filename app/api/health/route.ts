import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    await pool.query('SELECT 1');
    return NextResponse.json({ ok: true, database: 'connected' });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, database: 'unreachable', detail: err.message },
      { status: 503 }
    );
  }
}
