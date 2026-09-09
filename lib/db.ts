import { cache } from 'react';
import { mongoose } from './models';

declare global { var __mongoose_state: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined; }
const state = globalThis.__mongoose_state ?? { conn: null, promise: null };
if (process.env.NODE_ENV !== 'production') globalThis.__mongoose_state = state;

export const connectMongo = cache(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not configured.');
  if (state.conn) return state.conn;
  if (!state.promise) state.promise = mongoose.connect(uri, { maxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE || 10), serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || 5000) });
  state.conn = await state.promise;
  return state.conn;
});

export async function closeMongo() { if (state.conn) { await mongoose.disconnect(); state.conn = null; state.promise = null; } }
