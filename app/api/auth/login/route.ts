import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, signToken } from '@/lib/auth';
import { handleApiError, setAuthCookie } from '@/lib/helpers';
export async function POST(req: NextRequest){try{const body=await req.json().catch(()=>({}));const {email,password}=body;if(!email||!password)return NextResponse.json({error:'That email and password do not match an account.'},{status:401});const user=await verifyCredentials(email,password);if(!user)return NextResponse.json({error:'That email and password do not match an account.'},{status:401});const token=signToken(user);const response=NextResponse.json({token,user});setAuthCookie(response,token);return response;}catch(err){return handleApiError(err);}}
