import { GoalsCalculator } from "../components/GoalsCalculator";
import styles from "../styles/components.module.css";

export default function GoalsPage() {
  return (
    <div className={styles.container} style={{ maxWidth: "700px", margin: "2rem auto" }}>
      {/* Page Header */}
      <header style={{ textAlign: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Your Goals</h1>
        <p style={{ color: "var(--color-text-light)", fontSize: "1rem", lineHeight: "1.6" }}>
          Calculate your daily calorie needs, set personalized macro goals, and save them to track your progress.
        </p>
      </header>

      {/* Main Card */}
      <section>
        <GoalsCalculator />
      </section>

      {/* Optional Footer / Tips */}
      <footer style={{ marginTop: "2rem", textAlign: "center", color: "var(--color-text-light)" }}>
        <p style={{ fontSize: "0.9rem" }}>
          💡 Tip: Recalculate your goals if your weight or activity level changes.
        </p>
      </footer>
    </div>
  );
}

