import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db';
import { User } from '@/lib/models';
import { signToken, hashPassword } from '@/lib/auth';
import { badRequest, handleApiError, setAuthCookie } from '@/lib/helpers';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export async function POST(req: NextRequest) { try {
  const body = await req.json().catch(() => ({})); const { firstName,lastName,email,password,phone,city,country,bio,photoUrl }=body;
  if(!firstName?.trim()) throw badRequest('Enter a first name.'); if(!EMAIL_RE.test(email??'')) throw badRequest('Enter a valid email address.'); if(!password||password.length<8) throw badRequest('Use a password of at least 8 characters.');
  await connectMongo(); const normalized=String(email).trim().toLowerCase(); if(await User.exists({email:normalized})) throw badRequest('An account already uses that email address.');
  const user=await User.create({firstName:firstName.trim(),lastName:(lastName??'').trim(),email:normalized,passwordHash:await hashPassword(password),phone:phone||null,city:city||null,country:country||null,bio:bio||null,photoUrl:photoUrl||null});
  const safe={id:String(user._id),first_name:user.firstName,last_name:user.lastName,email:user.email,phone:user.phone,city:user.city,country:user.country,bio:user.bio,photo_url:user.photoUrl,language:user.language,home_currency:user.homeCurrency,role:user.role,created_at:user.createdAt};
  const response=NextResponse.json({token:signToken(user),user:safe},{status:201}); setAuthCookie(response,signToken(user)); return response;
} catch(err){return handleApiError(err);} }
