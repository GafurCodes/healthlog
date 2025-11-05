import React from 'react';
import styles from '../styles/components.module.css';

interface ProgressBarProps {
  value: number;
  max: number;
  color: 'red' | 'blue' | 'green' | 'yellow';
  label: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, color, label }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  const colorMap = {
    red: 'var(--color-danger)',
    blue: 'var(--color-primary)',
    green: 'var(--color-success)',
    yellow: 'var(--color-warning)',
  };

  return (
    <div className={styles['progress-bar-container']}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span>{label}</span>
        <span>{`${Math.round(value)} / ${max}`}</span>
      </div>
      <div className={styles['progress-bar-background']}>
        <div
          className={styles['progress-bar-foreground']}
          style={{ width: `${percentage}%`, backgroundColor: colorMap[color] }}
        ></div>
      </div>
    </div>
  );
};
