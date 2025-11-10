class NutritionUtils {
  /// Calculate target calories based on TDEE and goal
  static int calculateTargetCalories(int tdee, String goal) {
    double goalCalories = tdee.toDouble();
    if (goal == 'cut') {
      goalCalories = tdee * 0.8;
    } else if (goal == 'bulk') {
      goalCalories = tdee * 1.1;
    }
    return goalCalories.round();
  }

  /// Calculate macros based on calories and goal
  static Map<String, int> calculateMacros(int calories, String goal) {
    double proteinRatio = 0.25;
    double fatRatio = 0.25;
    double carbRatio = 0.5;

    if (goal == 'cut') {
      proteinRatio = 0.3;
      fatRatio = 0.25;
      carbRatio = 0.45;
    } else if (goal == 'bulk') {
      proteinRatio = 0.25;
      fatRatio = 0.3;
      carbRatio = 0.45;
    }

    return {
      'protein': ((calories * proteinRatio) / 4).round(),
      'fat': ((calories * fatRatio) / 9).round(),
      'carbs': ((calories * carbRatio) / 4).round(),
    };
  }
}

