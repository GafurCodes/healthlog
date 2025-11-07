import { Request, Response } from "express";
import { z } from "zod";
import { calculateMaintenanceCalories } from "../services/nutritionCalculator.service.js";

const userStatsSchema = z.object({
  sex: z.enum(["male", "female"]),
  height: z.number().min(100).max(250), // cm
  weight: z.number().min(30).max(300),  // kg
  age: z.number().min(10).max(100),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
});

export async function calculateMaintenanceCaloriesHandler(req: Request, res: Response) {
  try {
    const userStats = userStatsSchema.parse(req.body);
    const result = calculateMaintenanceCalories(userStats);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid input" });
  }
}

