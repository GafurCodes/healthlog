import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./Button";
import styles from "../styles/components.module.css";

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles["header-container"]}>
        <Link
          to={isAuthenticated ? "/dashboard" : "/"}
          className={styles["header-logo"]}
        >
          Nibble
        </Link>

        <nav className={styles["header-nav"]}>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/logs">Logs</Link>
              <span className={styles["header-user"]}>Hi, {user?.name}</span>
              <Button variant="secondary" onClick={toggleTheme}>
                {theme === "light" ? "🌙" : "☀️"}
              </Button>
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
              <Button variant="secondary" onClick={toggleTheme}>
                {theme === "light" ? "🌙" : "☀️"}
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
