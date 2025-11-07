type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";

interface UserStats {
  sex: "male" | "female";
  height: number; // cm
  weight: number; // kg
  age: number;
  activityLevel: ActivityLevel;
}

export function calculateMaintenanceCalories({ sex, height, weight, age, activityLevel }: UserStats) {
  // Mifflin-St Jeor Equation
  const bmr =
    sex === "male"
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161;

  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = bmr * activityMultipliers[activityLevel];

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
  };
}

