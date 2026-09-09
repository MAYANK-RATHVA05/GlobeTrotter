import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db';
import { City, Activity } from '@/lib/models';
import { cityDto } from '@/lib/mongo';
import { handleApiError } from '@/lib/helpers';
const SORTS:any={popularity:{popularity:-1,name:1},name:{name:1},'cost-low':{costIndex:1,name:1},'cost-high':{costIndex:-1,name:1},country:{country:1,name:1}};
export async function GET(req:NextRequest){try{await connectMongo();const p=new URL(req.url).searchParams;const q=p.get('q')?.trim();const country=p.get('country');const region=p.get('region');const maxCost=p.get('maxCost');const sort=p.get('sort')||'popularity';const filter:any={};if(q)filter.$or=[{name:{$regex:q,$options:'i'}},{country:{$regex:q,$options:'i'}},{region:{$regex:q,$options:'i'}}];if(country)filter.country=country;if(region)filter.region=region;if(maxCost)filter.costIndex={$lte:Number(maxCost)};const cities=await City.find(filter).sort(SORTS[sort]||SORTS.popularity).limit(Math.min(Number(p.get('limit'))||60,100)).lean();const counts=await Activity.aggregate([{ $match:{city:{$in:cities.map(c=>c._id)}}},{ $group:{_id:'$city',n:{$sum:1}}}]);const map=new Map(counts.map(x=>[String(x._id),x.n]));return NextResponse.json({cities:cities.map(c=>cityDto(c,map.get(String(c._id))||0))});}catch(e){return handleApiError(e);}}
