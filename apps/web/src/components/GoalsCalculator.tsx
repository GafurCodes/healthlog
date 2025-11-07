import { useState } from "react";
import { Card, CardBody, CardHeader } from "./Card";
import { Input, Select } from "./Input";
import { Button } from "./Button";
import { calculateTargetCalories, calculateMacros } from "../utils/nutritionUtils";
import { profileApi } from "../api/profile";
import { handleApiError } from "../api/client";
import styles from "../styles/components.module.css";

export function GoalsCalculator() {
  const [form, setForm] = useState({
    sex: "male",
    height: "",
    weight: "",
    age: "",
    activityLevel: "moderate",
  });

  const [goal, setGoal] = useState("maintain");
  const [result, setResult] = useState<any>(null);
  const [mode, setMode] = useState<"auto" | "custom">("auto");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");

  // ✅ State for macros and calories (persisted)
  const [autoMacros, setAutoMacros] = useState<any>(null);
  const [customMacros, setCustomMacros] = useState({
    calories: "",
    protein: "",
    fat: "",
    carbs: "",
  });

  // ---------- Handlers ----------

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/nutrition/maintenance-calories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        height: Number(form.height),
        weight: Number(form.weight),
        age: Number(form.age),
      }),
    });
    const data = await res.json();
    setResult(data);
    updateCaloriesAndMacros(data.tdee, goal);
  };

  const updateCaloriesAndMacros = (tdee: number, goal: string) => {
    const goalCalories = calculateTargetCalories(tdee, goal);
    const newMacros = calculateMacros(goalCalories, goal);
    setAutoMacros({
      calories: goalCalories,
      protein: newMacros.protein,
      fat: newMacros.fat,
      carbs: newMacros.carbs,
    });
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGoal = e.target.value;
    setGoal(newGoal);
    if (result?.tdee) updateCaloriesAndMacros(result.tdee, newGoal);
  };

  const handleMacroChange = (field: string, value: string) => {
    setCustomMacros((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveGoals = async () => {
    setSaving(true);
    setStatus("");
    try {
      const payload =
        mode === "auto"
          ? {
            calories: autoMacros.calories,
            protein: autoMacros.protein,
            fats: autoMacros.fat, // ✅ fixed: use singular "fat"
            carbs: autoMacros.carbs,
          }
          : {
            calories: Number(customMacros.calories),
            protein: Number(customMacros.protein),
            fats: Number(customMacros.fat), // ✅ fixed: use singular "fat"
            carbs: Number(customMacros.carbs),
          };

      await profileApi.update(payload);
      setStatus("✅ Goals saved successfully!");
    } catch (err) {
      const apiError = handleApiError(err);
      setStatus(apiError.message || "❌ Failed to save goals.");
    } finally {
      setSaving(false);
    }
  };


  // ---------- UI ----------

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
      <Card style={{ width: "100%", maxWidth: "550px" }}>
        <CardHeader>
          <h2 style={{ margin: 0 }}>Goals & Calorie Calculator</h2>
        </CardHeader>

        <CardBody>
          {/* SECTION 1: Maintenance Calorie Calculator */}
          <div style={{ marginBottom: "2rem" }}>
            <h3
              style={{
                borderBottom: "1px solid var(--color-border)",
                paddingBottom: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              1️⃣ Maintenance Calorie Calculator
            </h3>

            <form onSubmit={handleSubmit}>
              <Select
                label="Sex"
                name="sex"
                value={form.sex}
                onChange={handleChange}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
              />

              <Input label="Height (cm)" name="height" type="number" value={form.height} onChange={handleChange} />
              <Input label="Weight (kg)" name="weight" type="number" value={form.weight} onChange={handleChange} />
              <Input label="Age" name="age" type="number" value={form.age} onChange={handleChange} />

              <Select
                label="Activity Level"
                name="activityLevel"
                value={form.activityLevel}
                onChange={handleChange}
                options={[
                  { value: "sedentary", label: "Sedentary" },
                  { value: "light", label: "Light" },
                  { value: "moderate", label: "Moderate" },
                  { value: "active", label: "Active" },
                  { value: "very_active", label: "Very Active" },
                ]}
              />

              <Button type="submit" fullWidth style={{ marginTop: "1rem" }}>
                Calculate Maintenance
              </Button>
            </form>

            {result && (
              <div className={styles["mt-md"]}>
                <p>
                  <strong>BMR:</strong> {result.bmr} kcal/day
                </p>
                <p>
                  <strong>TDEE:</strong> {result.tdee} kcal/day
                </p>
              </div>
            )}
          </div>

          {/* SECTION 2: Goal & Macros */}
          {result && (
            <div>
              <h3
                style={{
                  borderBottom: "1px solid var(--color-border)",
                  paddingBottom: "0.5rem",
                  marginBottom: "1rem",
                }}
              >
                2️⃣ Goal & Macro Setup
              </h3>

              <Select
                label="Goal Mode"
                name="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as "auto" | "custom")}
                options={[
                  { value: "auto", label: "Automatic (Based on Goal)" },
                  { value: "custom", label: "Custom (Manual Entry)" },
                ]}
              />

              {mode === "auto" ? (
                <>
                  <Select
                    label="Goal"
                    name="goal"
                    value={goal}
                    onChange={handleGoalChange}
                    options={[
                      { value: "maintain", label: "Maintain" },
                      { value: "cut", label: "Cut (Lose Fat)" },
                      { value: "bulk", label: "Bulk (Gain Muscle)" },
                    ]}
                  />

                  {autoMacros && (
                    <div style={{ marginTop: "1rem" }}>
                      <Input
                        label="Calories (kcal)"
                        type="number"
                        value={autoMacros.calories || ""}
                        onChange={(e) =>
                          setAutoMacros({ ...autoMacros, calories: Number(e.target.value) || 0 })
                        }
                      />
                      <Input
                        label="Protein (g)"
                        type="number"
                        value={autoMacros.protein || ""}
                        onChange={(e) =>
                          setAutoMacros({ ...autoMacros, protein: Number(e.target.value) || 0 })
                        }
                      />
                      <Input
                        label="Fat (g)"
                        type="number"
                        value={autoMacros.fat || ""}
                        onChange={(e) =>
                          setAutoMacros({ ...autoMacros, fat: Number(e.target.value) || 0 })
                        }
                      />
                      <Input
                        label="Carbs (g)"
                        type="number"
                        value={autoMacros.carbs || ""}
                        onChange={(e) =>
                          setAutoMacros({ ...autoMacros, carbs: Number(e.target.value) || 0 })
                        }
                      />
                    </div>
                  )}
                </>
              ) : (
                <div style={{ marginTop: "1rem" }}>
                  <Input
                    label="Calories (kcal)"
                    type="number"
                    value={customMacros.calories}
                    onChange={(e) => handleMacroChange("calories", e.target.value)}
                  />
                  <Input
                    label="Protein (g)"
                    type="number"
                    value={customMacros.protein}
                    onChange={(e) => handleMacroChange("protein", e.target.value)}
                  />
                  <Input
                    label="Fat (g)"
                    type="number"
                    value={customMacros.fat}
                    onChange={(e) => handleMacroChange("fat", e.target.value)}
                  />
                  <Input
                    label="Carbs (g)"
                    type="number"
                    value={customMacros.carbs}
                    onChange={(e) => handleMacroChange("carbs", e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={handleSaveGoals}
                disabled={saving}
                fullWidth
                style={{ marginTop: "0.75rem" }}
              >
                {saving ? "Saving..." : "Save My Goals"}
              </Button>

              {status && <p style={{ marginTop: "0.5rem" }}>{status}</p>}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

