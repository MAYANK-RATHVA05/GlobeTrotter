import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { one } from './db';
import { forbidden, unauthorized } from './helpers';
import type { User } from './types';

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

export const PUBLIC_USER_COLUMNS = `
  id, first_name, last_name, email, phone, city, country, bio,
  photo_url, language, home_currency, role, created_at
`;

/** Verify an email and password pair. Returns the user row or null. */
export async function verifyCredentials(email: string, password: string): Promise<any | null> {
  const user = await one('SELECT * FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  return ok ? user : null;
}

export function signToken(user: { id: number; role: string }): string {
  return jwt.sign({ sub: user.id, role: user.role }, SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/** Strip the password hash before a user row leaves the server. */
export function publicUser(row: any): User | null {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe as User;
}

/** Extract bearer token from Authorization header. */
export function extractBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

/** Get the authenticated user from the request, or null if invalid/absent. */
export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  const token = extractBearerToken(req);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, SECRET) as unknown as { sub: number; role: string };
    if (!payload?.sub) return null;
    const user = await one<User>(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ?`, [payload.sub]);
    return user;
  } catch {
    return null;
  }
}

/** Require a valid bearer token. Throws HttpError(401) if not authenticated. */
export async function requireAuth(req: NextRequest): Promise<User> {
  const user = await getUserFromRequest(req);
  if (!user) {
    throw unauthorized('You must be signed in to do that.');
  }
  return user;
}

/** Require a valid bearer token belonging to an admin. Throws 401 or 403. */
export async function requireAdmin(req: NextRequest): Promise<User> {
  const user = await requireAuth(req);
  if (user.role !== 'admin') {
    throw forbidden('This area is for administrators.');
  }
  return user;
}

/** Read the user from a bearer token if present, but never reject. */
export async function optionalAuth(req: NextRequest): Promise<User | null> {
  return getUserFromRequest(req);
}
