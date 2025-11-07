import { apiClient } from './client';

export interface ExerciseSearchItem {
  id: number;
  name: string;
  category?: string;
  equipment?: string[];
  muscles?: string[];
}

export type Intensity = 'low' | 'moderate' | 'high';

export async function searchExercises(
  q: string
): Promise<ExerciseSearchItem[]> {
  const res = await apiClient.get('/exercises/search', { params: { q } });
  return res.data?.data ?? [];
}

export async function estimateExercise(payload: {
  name: string;
  durationMin: number;
  weightKg?: number;
  intensity?: Intensity;
}): Promise<{ met: number; intensity: Intensity; caloriesBurned: number }> {
  const res = await apiClient.post('/exercises/estimate', payload);
  return res.data?.data;
}

export async function lookupExercise(payload: {
  name: string;
  durationMin?: number;
  weightKg?: number;
  intensity?: Intensity;
}): Promise<{
  id?: number;
  name: string;
  category?: string;
  equipment?: string[];
  muscles?: string[];
  workoutType: 'cardio' | 'strength' | 'flexibility';
  met: number;
  intensity: Intensity;
  caloriesBurned?: number;
}> {
  const res = await apiClient.post('/exercises/lookup', payload);
  return res.data?.data;
}
