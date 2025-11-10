import { calculateTargetCalories, calculateMacros } from '../utils/nutritionUtils';

describe('Nutrition Utilities', () => {
  describe('calculateTargetCalories', () => {
    it('should maintain calories for maintain goal', () => {
      const tdee = 2000;
      const result = calculateTargetCalories(tdee, 'maintain');
      expect(result).toBe(2000);
    });

    it('should reduce calories by 20% for cut goal', () => {
      const tdee = 2000;
      const result = calculateTargetCalories(tdee, 'cut');
      expect(result).toBe(1600);
    });

    it('should increase calories by 10% for bulk goal', () => {
      const tdee = 2000;
      const result = calculateTargetCalories(tdee, 'bulk');
      expect(result).toBe(2200);
    });

    it('should return rounded integer values', () => {
      const tdee = 2345;
      const result = calculateTargetCalories(tdee, 'cut');
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBe(1876);
    });
  });

  describe('calculateMacros', () => {
    it('should calculate macros for maintain goal', () => {
      const calories = 2000;
      const result = calculateMacros(calories, 'maintain');

      expect(result.protein).toBe(125); // (2000 * 0.25) / 4
      expect(result.fat).toBe(56); // (2000 * 0.25) / 9
      expect(result.carbs).toBe(250); // (2000 * 0.5) / 4
    });

    it('should calculate macros for cut goal', () => {
      const calories = 1600;
      const result = calculateMacros(calories, 'cut');

      expect(result.protein).toBe(120); // (1600 * 0.3) / 4
      expect(result.fat).toBe(44); // (1600 * 0.25) / 9
      expect(result.carbs).toBe(180); // (1600 * 0.45) / 4
    });

    it('should calculate macros for bulk goal', () => {
      const calories = 2200;
      const result = calculateMacros(calories, 'bulk');

      expect(result.protein).toBe(138); // (2200 * 0.25) / 4
      expect(result.fat).toBe(73); // (2200 * 0.3) / 9
      expect(result.carbs).toBe(248); // (2200 * 0.45) / 4
    });

    it('should return rounded integer values', () => {
      const calories = 2345;
      const result = calculateMacros(calories, 'maintain');

      expect(Number.isInteger(result.protein)).toBe(true);
      expect(Number.isInteger(result.fat)).toBe(true);
      expect(Number.isInteger(result.carbs)).toBe(true);
    });

    it('should handle zero calories', () => {
      const calories = 0;
      const result = calculateMacros(calories, 'maintain');

      expect(result.protein).toBe(0);
      expect(result.fat).toBe(0);
      expect(result.carbs).toBe(0);
    });
  });
});
