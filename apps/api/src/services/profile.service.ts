import { Profile, IProfile } from '../models/Profile.js';

export interface ProfileDTO {
  id: string;
  userId: string;
  goals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  createdAt: string;
  updatedAt: string;
}

function mapProfile(doc: IProfile): ProfileDTO {
  return {
    id: (doc as any)._id.toString(),
    userId: (doc.userId as any).toString(),
    goals: doc.goals,
    createdAt: new Date(doc.createdAt).toISOString(),
    updatedAt: new Date(doc.updatedAt).toISOString(),
  };
}

export async function getProfileByUserId(
  userId: string
): Promise<{ data: ProfileDTO | null }> {
  const doc = await Profile.findOne({ userId });
  if (!doc) {
    return { data: null };
  }
  return { data: mapProfile(doc) };
}

export async function createOrUpdateProfile(
  userId: string,
  goals: ProfileDTO['goals']
): Promise<{ data: ProfileDTO }> {
  const doc = await Profile.findOneAndUpdate(
    { userId },
    { userId, goals },
    { new: true, upsert: true }
  );
  return { data: mapProfile(doc) };
}

export async function deleteProfile(userId: string): Promise<{ deleted: boolean; userId: string }> {
    const result = await Profile.deleteOne({ userId });
    return { deleted: result.deletedCount === 1, userId };
}
