// src/utils/nutritionUtils.ts
export function calculateTargetCalories(tdee: number, goal: string) {
	let goalCalories = tdee;
	if (goal === "cut") goalCalories = tdee * 0.8;
	else if (goal === "bulk") goalCalories = tdee * 1.1;
	return Math.round(goalCalories);
}

export function calculateMacros(calories: number, goal: string) {
	let proteinRatio = 0.25,
		fatRatio = 0.25,
		carbRatio = 0.5;

	if (goal === "cut") {
		proteinRatio = 0.3;
		fatRatio = 0.25;
		carbRatio = 0.45;
	} else if (goal === "bulk") {
		proteinRatio = 0.25;
		fatRatio = 0.3;
		carbRatio = 0.45;
	}

	return {
		protein: Math.round((calories * proteinRatio) / 4),
		fat: Math.round((calories * fatRatio) / 9),
		carbs: Math.round((calories * carbRatio) / 4),
	};
}

