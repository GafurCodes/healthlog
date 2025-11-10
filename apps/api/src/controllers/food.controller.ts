import { Request, Response } from "express";
import { fetchNutritionData, fetchFoodSuggestions } from "../services/nutrition.service.js";
import { z } from "zod";

const foodQuerySchema = z.object({
  query: z.string().min(1),
});

export async function searchFood(req: Request, res: Response) {
  try {
    const { query } = foodQuerySchema.parse(req.body);
    const foodData = await fetchNutritionData(query);
    res.json(foodData);
  } catch (err) {
    console.error("Controller error:", err);
    res.status(500).json({ error: "Failed to fetch nutrition data" });
  }
}

export async function autocompleteFood(req: Request, res: Response) {
  try {
    const { query } = foodQuerySchema.parse(req.body);
    const suggestions = await fetchFoodSuggestions(query);
    res.json(suggestions);
  } catch (err) {
    console.error("Controller error:", err);
    res.status(500).json({ error: "Failed to fetch food suggestions" });
  }
}

