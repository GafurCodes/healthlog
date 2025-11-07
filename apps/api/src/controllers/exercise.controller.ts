import { Request, Response } from 'express';
import {
  searchExercises,
  estimateCaloriesForExercise,
  lookupExerciseDetails,
} from '../services/exercise.service.js';

export async function searchExerciseHandler(req: Request, res: Response) {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing query' });
  const results = await searchExercises(q);
  res.json({ data: results });
}

export async function estimateExerciseHandler(req: Request, res: Response) {
  const { name, durationMin, weightKg, intensity } = req.body || {};
  if (!name || !durationMin)
    return res.status(400).json({ error: 'Missing required fields' });
  const result = estimateCaloriesForExercise(
    { name, durationMin: Number(durationMin), weightKg, intensity },
    75
  );
  res.json({ data: result });
}

export async function lookupExerciseHandler(req: Request, res: Response) {
  const { name, durationMin, weightKg, intensity } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const result = await lookupExerciseDetails(
    {
      name,
      durationMin: durationMin ? Number(durationMin) : undefined,
      weightKg,
      intensity,
    },
    75
  );
  if (!result) return res.status(404).json({ error: 'Not found' });
  res.json({ data: result });
}
