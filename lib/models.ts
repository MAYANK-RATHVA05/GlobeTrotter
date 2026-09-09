import mongoose, { Schema, type Model, type InferSchemaType } from 'mongoose';

const oid = Schema.Types.ObjectId;
const categories = ['sightseeing','food','adventure','culture','nature','nightlife','shopping','relaxation'] as const;

const userSchema = new Schema({
  legacyId: { type: Number, unique: true, sparse: true, index: true },
  firstName: { type: String, required: true, trim: true, maxlength: 80 },
  lastName: { type: String, default: '', trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 190 },
  passwordHash: { type: String, required: true, select: false },
  phone: { type: String, default: null, maxlength: 40 }, city: { type: String, default: null, maxlength: 120 }, country: { type: String, default: null, maxlength: 120 },
  bio: { type: String, default: null, maxlength: 1000 }, photoUrl: { type: String, default: null, maxlength: 500 }, language: { type: String, default: 'en', maxlength: 20 }, homeCurrency: { type: String, default: 'USD', uppercase: true, maxlength: 3 }, role: { type: String, enum: ['user','admin'], default: 'user' },
  savedCities: [{ type: oid, ref: 'City' }],
}, { timestamps: true, versionKey: false });

const citySchema = new Schema({ legacyId: { type: Number, unique: true, sparse: true, index: true }, name: { type: String, required: true, trim: true, maxlength: 120 }, country: { type: String, required: true, trim: true }, region: { type: String, required: true, trim: true }, costIndex: { type: Number, default: 0, min: 0 }, popularity: { type: Number, default: 0 }, currency: { type: String, default: 'USD', uppercase: true }, imageUrl: { type: String, default: null }, description: { type: String, default: null } }, { timestamps: true, versionKey: false });
citySchema.index({ name: 1, country: 1 }, { unique: true });
citySchema.index({ region: 1, popularity: -1 });

const activitySchema = new Schema({ legacyId: { type: Number, unique: true, sparse: true, index: true }, city: { type: oid, ref: 'City', required: true, index: true }, name: { type: String, required: true, trim: true }, category: { type: String, enum: categories, default: 'sightseeing' }, cost: { type: Number, default: 0, min: 0 }, durationMinutes: { type: Number, default: 60, min: 1 }, description: { type: String, default: null }, imageUrl: { type: String, default: null }, popularity: { type: Number, default: 0 } }, { timestamps: true, versionKey: false });
activitySchema.index({ city: 1, popularity: -1 }); activitySchema.index({ category: 1, cost: 1 }); activitySchema.index({ name: 'text', description: 'text' });

const activityItemSchema = new Schema({ legacyId: Number, activity: { type: oid, ref: 'Activity', default: null }, title: { type: String, required: true, trim: true }, category: { type: String, enum: categories, default: 'sightseeing' }, cost: { type: Number, default: 0, min: 0 }, scheduledDate: { type: String, required: true }, startTime: { type: String, default: null }, durationMinutes: { type: Number, default: 60 }, position: { type: Number, default: 0 }, notes: { type: String, default: null } }, { _id: true, versionKey: false });
const stopSchema = new Schema({ legacyId: Number, city: { type: oid, ref: 'City', required: true }, startDate: { type: String, required: true }, endDate: { type: String, required: true }, position: { type: Number, default: 0 }, notes: { type: String, default: null }, activities: { type: [activityItemSchema], default: [] } }, { _id: true, versionKey: false });
const costSchema = new Schema({ legacyId: Number, stop: { type: oid, default: null }, category: { type: String, enum: ['transport','stay','meals','other'], required: true }, label: { type: String, required: true }, amount: { type: Number, default: 0, min: 0 } }, { _id: true, versionKey: false });
const tripSchema = new Schema({ legacyId: { type: Number, unique: true, sparse: true, index: true }, user: { type: oid, ref: 'User', required: true, index: true }, name: { type: String, required: true, trim: true, maxlength: 160 }, description: { type: String, default: null }, startDate: { type: String, required: true }, endDate: { type: String, required: true }, coverUrl: { type: String, default: null }, travellers: { type: Number, default: 1, min: 1, max: 100 }, isPublic: { type: Boolean, default: false, index: true }, shareSlug: { type: String, unique: true, sparse: true, index: true }, copiedFrom: { type: oid, ref: 'Trip', default: null }, stops: { type: [stopSchema], default: [] }, costs: { type: [costSchema], default: [] } }, { timestamps: true, versionKey: false });
tripSchema.index({ user: 1, startDate: -1 }); tripSchema.index({ isPublic: 1, createdAt: -1 });

const postSchema = new Schema({ legacyId: { type: Number, unique: true, sparse: true, index: true }, user: { type: oid, ref: 'User', required: true, index: true }, trip: { type: oid, ref: 'Trip', default: null }, city: { type: oid, ref: 'City', default: null }, title: { type: String, required: true, maxlength: 200 }, body: { type: String, required: true, maxlength: 10000 }, likedBy: [{ type: oid, ref: 'User' }] }, { timestamps: true, versionKey: false });
postSchema.index({ createdAt: -1 });

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User: Model<UserDoc> = mongoose.models.User || mongoose.model<UserDoc>('User', userSchema);
export const City = mongoose.models.City || mongoose.model('City', citySchema);
export const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
export const Trip = mongoose.models.Trip || mongoose.model('Trip', tripSchema);
export const CommunityPost = mongoose.models.CommunityPost || mongoose.model('CommunityPost', postSchema);
export { mongoose };
