import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

export class HttpError extends Error { status: number; constructor(status: number, message: string) { super(message); this.status = status; } }
export const badRequest = (msg: string) => new HttpError(400, msg);
export const notFound = (msg = 'Not found.') => new HttpError(404, msg);
export const forbidden = (msg = 'You do not have access to this.') => new HttpError(403, msg);
export const unauthorized = (msg = 'Authentication required.') => new HttpError(401, msg);
export function shareSlug() { return crypto.randomBytes(9).toString('base64url').slice(0, 12); }
export function isoDate(value: string | Date | null | undefined) { if (!value) return null; return typeof value === 'string' ? value.slice(0, 10) : new Date(value).toISOString().slice(0, 10); }
export function eachDate(start: string | Date, end: string | Date) { const out: string[] = [], s = isoDate(start), e = isoDate(end); if (!s || !e) return out; const c = new Date(`${s}T00:00:00Z`), last = new Date(`${e}T00:00:00Z`); while (c <= last) { out.push(c.toISOString().slice(0,10)); c.setUTCDate(c.getUTCDate()+1); } return out; }
export function dayCount(start: string | Date, end: string | Date) { const s=isoDate(start), e=isoDate(end); if(!s||!e) return 1; return Math.max(1, Math.round((new Date(`${e}T00:00:00Z`).getTime()-new Date(`${s}T00:00:00Z`).getTime())/86400000)+1); }
export function tripStatus(start: string | Date, end: string | Date, today=isoDate(new Date())!) { const s=isoDate(start)!, e=isoDate(end)!; return e<today?'completed':s>today?'upcoming':'ongoing'; }
export function pickSort(requested: string | null | undefined, allowed: Record<string,string>) { return requested && allowed[requested] ? allowed[requested] : Object.values(allowed)[0]; }
export function setAuthCookie(response: NextResponse, token: string) { response.cookies.set('globetrotter.token', token, { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'lax', path:'/', maxAge:60*60*24*7 }); }
export function clearAuthCookie(response: NextResponse) { response.cookies.set('globetrotter.token','',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0}); }
export function handleApiError(err: unknown) { if(err instanceof HttpError) return NextResponse.json({error:err.message},{status:err.status}); console.error('API Handler Error:',err); return NextResponse.json({error:'Something went wrong. Please try again.'},{status:500}); }
