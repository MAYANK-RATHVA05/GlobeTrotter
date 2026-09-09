import 'dotenv/config';
import mysql from 'mysql2/promise';
import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) throw new Error('MONGODB_URI is required. Set it before running the migration.');
const sql = await mysql.createConnection({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER||'root',password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME||'globetrotter'});
await mongoose.connect(mongoUri);
const db=mongoose.connection.db;
const oid=()=>new mongoose.Types.ObjectId();
const rows=async table=>(await sql.query(`SELECT * FROM ${table}`))[0];

try {
  const [users,cities,activities,trips,stops,tripActivities,costs,posts,likes,saved]=await Promise.all(['users','cities','activities','trips','trip_stops','trip_activities','trip_costs','community_posts','post_likes','saved_cities'].map(rows));
  const userMap=new Map(),cityMap=new Map(),activityMap=new Map(),tripMap=new Map(),stopMap=new Map(),postMap=new Map();
  const userDocs=users.map(u=>{const _id=oid();userMap.set(u.id,_id);return{_id,legacyId:u.id,firstName:u.first_name,lastName:u.last_name,email:u.email,passwordHash:u.password_hash,phone:u.phone,city:u.city,country:u.country,bio:u.bio,photoUrl:u.photo_url,language:u.language,homeCurrency:u.home_currency,role:u.role,savedCities:[] ,createdAt:u.created_at,updatedAt:u.created_at};});
  const cityDocs=cities.map(c=>{const _id=oid();cityMap.set(c.id,_id);return{_id,legacyId:c.id,name:c.name,country:c.country,region:c.region,costIndex:Number(c.cost_index),popularity:Number(c.popularity),currency:c.currency,imageUrl:c.image_url,description:c.description,createdAt:new Date(),updatedAt:new Date()};});
  const activityDocs=activities.map(a=>{const _id=oid();activityMap.set(a.id,_id);return{_id,legacyId:a.id,city:cityMap.get(a.city_id),name:a.name,category:a.category,cost:Number(a.cost),durationMinutes:Number(a.duration_minutes),description:a.description,imageUrl:a.image_url,popularity:Number(a.popularity),createdAt:new Date(),updatedAt:new Date()};});
  const tripDocs=trips.map(t=>{const _id=oid();tripMap.set(t.id,_id);return{_id,legacyId:t.id,user:userMap.get(t.user_id),name:t.name,description:t.description,startDate:String(t.start_date).slice(0,10),endDate:String(t.end_date).slice(0,10),coverUrl:t.cover_url,travellers:Number(t.travellers),isPublic:Boolean(t.is_public),shareSlug:t.share_slug,copiedFrom:t.copied_from?tripMap.get(t.copied_from):null,stops:[],costs:[],createdAt:t.created_at,updatedAt:t.updated_at};});
  const stopDocs=stops.map(s=>{const _id=oid();stopMap.set(s.id,_id);return{_id,legacyId:s.id,city:cityMap.get(s.city_id),startDate:String(s.start_date).slice(0,10),endDate:String(s.end_date).slice(0,10),position:Number(s.position),notes:s.notes,activities:[]};});
  for(const a of tripActivities){const trip=tripDocs.find(t=>t.legacyId===a.trip_id);const stop=stopDocs.find(s=>s.legacyId===a.stop_id);if(!trip||!stop)continue;stop.activities.push({_id:oid(),legacyId:a.id,activity:activityMap.get(a.activity_id)||null,title:a.title,category:a.category,cost:Number(a.cost),scheduledDate:String(a.scheduled_date).slice(0,10),startTime:a.start_time,durationMinutes:Number(a.duration_minutes),position:Number(a.position),notes:a.notes});}
  for(const s of stopDocs){const trip=tripDocs.find(t=>t.legacyId===stops.find(x=>x.id===s.legacyId)?.trip_id);if(trip)trip.stops.push(s);}
  for(const c of costs){const trip=tripDocs.find(t=>t.legacyId===c.trip_id);if(trip)trip.costs.push({_id:oid(),legacyId:c.id,stop: c.stop_id?stopMap.get(c.stop_id):null,category:c.category,label:c.label,amount:Number(c.amount)});}
  const postDocs=posts.map(p=>{const _id=oid();postMap.set(p.id,_id);return{_id,legacyId:p.id,user:userMap.get(p.user_id),trip:p.trip_id?tripMap.get(p.trip_id):null,city:p.city_id?cityMap.get(p.city_id):null,title:p.title,body:p.body,likedBy:[],createdAt:p.created_at,updatedAt:p.created_at};});
  for(const l of likes){const p=postDocs.find(x=>x.legacyId===l.post_id);if(p&&userMap.has(l.user_id))p.likedBy.push(userMap.get(l.user_id));}
  for(const s of saved){const u=userDocs.find(x=>x.legacyId===s.user_id);if(u&&cityMap.has(s.city_id))u.savedCities.push(cityMap.get(s.city_id));}
  await Promise.all([db.collection('users').insertMany(userDocs),db.collection('cities').insertMany(cityDocs),db.collection('activities').insertMany(activityDocs),db.collection('trips').insertMany(tripDocs),db.collection('communityposts').insertMany(postDocs)]);
  console.log(`Migrated ${users.length} users, ${cities.length} cities, ${activities.length} activities, ${trips.length} trips, ${posts.length} community posts.`);
} finally { await sql.end(); await mongoose.disconnect(); }
