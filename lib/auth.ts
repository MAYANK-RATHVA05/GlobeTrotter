import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextRequest } from 'next/server';
import { connectMongo } from './db';
import { User } from './models';
import { forbidden, unauthorized } from './helpers';
import type { User as UserType } from './types';

const SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-only-secret-change-me');
const publicUser = (row: any): UserType | null => row ? ({ id: String(row._id), first_name: row.firstName, last_name: row.lastName, email: row.email, phone: row.phone, city: row.city, country: row.country, bio: row.bio, photo_url: row.photoUrl, language: row.language, home_currency: row.homeCurrency, role: row.role, created_at: row.createdAt } as UserType) : null;
export async function verifyCredentials(email: string, password: string): Promise<any | null> { await connectMongo(); const user = await User.findOne({ email: String(email).trim().toLowerCase() }).select('+passwordHash').lean(); if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null; return publicUser(user); }
export function signToken(user: { id?: any; _id?: any; role: string }): string { return jwt.sign({ sub: String(user._id ?? user.id), role: user.role }, SECRET, { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }); }
export function hashPassword(plain: string): Promise<string> { return bcrypt.hash(plain, 12); }
export function extractBearerToken(req: NextRequest): string | null { const value = req.headers.get('authorization'); return value?.startsWith('Bearer ') ? value.slice(7).trim() : null; }
export async function getUserFromRequest(req: NextRequest): Promise<any | null> { const token = extractBearerToken(req) || req.cookies.get('globetrotter.token')?.value; if (!token) return null; try { const payload = jwt.verify(token, SECRET) as { sub?: string }; if (!payload.sub) return null; await connectMongo(); return await User.findById(payload.sub).lean(); } catch { return null; } }
export async function requireAuth(req: NextRequest): Promise<UserType> { const safe = publicUser(await getUserFromRequest(req)); if (!safe) throw unauthorized('You must be signed in to do that.'); return safe; }
export async function requireAdmin(req: NextRequest): Promise<UserType> { const user = await requireAuth(req); if (user.role !== 'admin') throw forbidden('This area is for administrators.'); return user; }
export async function optionalAuth(req: NextRequest): Promise<UserType | null> { return publicUser(await getUserFromRequest(req)); }
