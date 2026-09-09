import { NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db';
import { City } from '@/lib/models';
import { handleApiError } from '@/lib/helpers';
export async function GET(){try{await connectMongo();const [countries,regions,range]=await Promise.all([City.aggregate([{$group:{_id:'$country',n:{$sum:1}}},{$sort:{_id:1}}]),City.aggregate([{$group:{_id:'$region',n:{$sum:1}}},{$sort:{_id:1}}]),City.aggregate([{$group:{_id:null,min:{$min:'$costIndex'},max:{$max:'$costIndex'}}}])]);return NextResponse.json({countries:countries.map(x=>({country:x._id,n:x.n})),regions:regions.map(x=>({region:x._id,n:x.n})),costRange:range[0]??{min:0,max:0}});}catch(e){return handleApiError(e);}}
