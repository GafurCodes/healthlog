import axios from "axios";

const USDA_API_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

export interface FoodSuggestion {
  name: string;
  fdcId?: number;
}

export async function fetchNutritionData(query: string) {
  try {
    const apiKey = process.env.USDA_API_KEY!;
    const response = await axios.get(USDA_API_URL, {
      params: {
        api_key: apiKey,
        query,
        pageSize: 10,
      },
    });

    const foods = response.data.foods;
    if (!foods || foods.length === 0) {
      // return null to indicate "not found"
      return null;
    }

    const preferred =
      foods.find((f: any) => /raw|fresh/i.test(f.description)) || foods[0];

    const nutrients = preferred.foodNutrients || [];
    const getNutrient = (name: string) => {
      const nutrient = nutrients.find((n: any) =>
        n.nutrientName.toLowerCase().includes(name)
      );
      return nutrient ? nutrient.value : 0;
    };

    return {
      name: preferred.description,
      calories: getNutrient("energy"),
      protein: getNutrient("protein"),
      carbs: getNutrient("carbohydrate"),
      fat: getNutrient("fat"),
    };
  } catch (err) {
    console.error("USDA API error:", err);
    // also return null here
    return null;
  }
}

export async function fetchFoodSuggestions(query: string): Promise<FoodSuggestion[]> {
  try {
    const apiKey = process.env.USDA_API_KEY!;
    const response = await axios.get(USDA_API_URL, {
      params: {
        api_key: apiKey,
        query,
        pageSize: 10,
      },
    });

    const foods = response.data.foods;
    if (!foods || foods.length === 0) {
      return [];
    }

    // Return list of food names for autocomplete
    return foods.map((food: any) => ({
      name: food.description,
      fdcId: food.fdcId,
    }));
  } catch (err) {
    console.error("USDA API error:", err);
    return [];
  }
}

