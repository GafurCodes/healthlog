import { apiClient as api, handleApiError } from './client';

export interface ProfileGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Profile {
  id: string;
  userId: string;
  goals: ProfileGoals;
  createdAt: string;
  updatedAt: string;
}

export const profileApi = {
  get: async () => {
    try {
      const res = await api.get<{ data: Profile }>('/profile');
      return res.data;
    } catch (err) {
      throw handleApiError(err);
    }
  },
  update: async (goals: ProfileGoals) => {
    try {
      const res = await api.put<{ data: Profile }>('/profile', { goals });
      return res.data;
    } catch (err) {
      throw handleApiError(err);
    }
  },
};
