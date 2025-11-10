import { useState } from "react";
import { searchFood } from "../api/food";
import { Input, Select } from "./Input";
import { Button } from "./Button";
import styles from "../styles/components.module.css";

interface MealFormProps {
  value?: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  onChange: (meal: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }) => void;
}

export default function MealForm({ value, onChange }: MealFormProps) {
  const [mode, setMode] = useState<"search" | "custom">("search");
  const [query, setQuery] = useState(value?.name || "");
  const [foodData, setFoodData] = useState<any | null>(null);
  const [amount, setAmount] = useState(100);
  const [loading, setLoading] = useState(false);
  const [macros, setMacros] = useState({
    calories: value?.calories?.toString() || "",
    protein: value?.protein?.toString() || "",
    carbs: value?.carbs?.toString() || "",
    fat: value?.fat?.toString() || "",
  });
  const [error, setError] = useState("");

  // 🔍 Search for food
  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await searchFood(query);
      if (data) {
        setFoodData(data);
        const newMacros = {
          calories: data.calories.toFixed(1),
          protein: data.protein.toFixed(1),
          carbs: data.carbs.toFixed(1),
          fat: data.fat.toFixed(1),
        };
        setMacros(newMacros);
        onChange({
          name: data.name,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
        });
      } else {
        setError("No food found. Switching to custom mode.");
        setMode("custom");
        setFoodData(null);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError("Search failed. Switching to custom mode.");
      setMode("custom");
      setFoodData(null);
    } finally {
      setLoading(false);
    }
  }

  // ⚖️ Scale based on amount
  const handleAmountChange = (grams: number) => {
    setAmount(grams);
    if (foodData) {
      const scaled = {
        calories: ((foodData.calories * grams) / 100).toFixed(1),
        protein: ((foodData.protein * grams) / 100).toFixed(1),
        carbs: ((foodData.carbs * grams) / 100).toFixed(1),
        fat: ((foodData.fat * grams) / 100).toFixed(1),
      };
      setMacros(scaled);
      onChange({
        name: foodData.name,
        calories: parseFloat(scaled.calories),
        protein: parseFloat(scaled.protein),
        carbs: parseFloat(scaled.carbs),
        fat: parseFloat(scaled.fat),
      });
    }
  };

  // ✏️ Manual entry updates
  const handleMacroChange = (field: keyof typeof macros, value: string) => {
    const updated = { ...macros, [field]: value };
    setMacros(updated);
    onChange({
      name: foodData?.name || query,
      calories: parseFloat(updated.calories) || 0,
      protein: parseFloat(updated.protein) || 0,
      carbs: parseFloat(updated.carbs) || 0,
      fat: parseFloat(updated.fat) || 0,
    });
  };

  return (
    <div>
      <Select
        label="Meal Input Mode"
        value={mode}
        onChange={(e) => setMode(e.target.value as "search" | "custom")}
        options={[
          { value: "search", label: "Search from database" },
          { value: "custom", label: "Enter manually" },
        ]}
      />

      {error && (
        <p className={styles["error-message"]} style={{ marginBottom: "1rem" }}>
          {error}
        </p>
      )}

      {/* 🔍 Search mode */}
      {mode === "search" && (
        <>
          <Input
            label="Food Name"
            placeholder="e.g. Banana"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button onClick={handleSearch} disabled={loading} fullWidth>
            {loading ? "Searching..." : "Search"}
          </Button>

          {foodData && (
            <>
              <p className={styles["mt-md"]}>
                Found: <strong>{foodData.name}</strong>
              </p>

              <Input
                label="Amount (grams)"
                type="number"
                min={1}
                value={amount}
                onChange={(e) => handleAmountChange(Number(e.target.value))}
              />

              <Input
                label="Calories"
                type="number"
                value={macros.calories}
                onChange={(e) => handleMacroChange("calories", e.target.value)}
                disabled={true}
              />
              <Input
                label="Protein (g)"
                type="number"
                value={macros.protein}
                onChange={(e) => handleMacroChange("protein", e.target.value)}
                disabled={true}
              />
              <Input
                label="Carbs (g)"
                type="number"
                value={macros.carbs}
                onChange={(e) => handleMacroChange("carbs", e.target.value)}
                disabled={true}
              />
              <Input
                label="Fat (g)"
                type="number"
                value={macros.fat}
                onChange={(e) => handleMacroChange("fat", e.target.value)}
                disabled={true}
              />
            </>
          )}
        </>
      )}

      {/* ✏️ Custom mode */}
      {mode === "custom" && (
        <>
          <Input
            label="Food Name"
            placeholder="e.g. My Protein Shake"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onChange({
                name: e.target.value,
                calories: parseFloat(macros.calories) || 0,
                protein: parseFloat(macros.protein) || 0,
                carbs: parseFloat(macros.carbs) || 0,
                fat: parseFloat(macros.fat) || 0,
              });
            }}
          />

          <Input
            label="Calories"
            type="number"
            value={macros.calories}
            onChange={(e) => handleMacroChange("calories", e.target.value)}
          />
          <Input
            label="Protein (g)"
            type="number"
            value={macros.protein}
            onChange={(e) => handleMacroChange("protein", e.target.value)}
          />
          <Input
            label="Carbs (g)"
            type="number"
            value={macros.carbs}
            onChange={(e) => handleMacroChange("carbs", e.target.value)}
          />
          <Input
            label="Fat (g)"
            type="number"
            value={macros.fat}
            onChange={(e) => handleMacroChange("fat", e.target.value)}
          />
        </>
      )}
    </div>
  );
}

