// apps/web/src/api/food.ts
import { apiClient } from './client';

export async function searchFood(query: string) {
  const res = await apiClient.post('/food/search', { query });
  console.log(res.data);
  return res.data;
}
