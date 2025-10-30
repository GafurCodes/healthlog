import React from 'react';
import styles from '../styles/components.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = true,
  className = '',
  ...props
}) => {
  const widthClass = fullWidth ? styles['input-full-width'] : '';
  const errorClass = error ? styles['input-error'] : '';

  return (
    <div className={`${styles['input-wrapper']} ${widthClass}`}>
      {label && <label className={styles['input-label']}>{label}</label>}
      <input
        className={`${styles.input} ${errorClass} ${className}`}
        {...props}
      />
      {error && <span className={styles['input-error-message']}>{error}</span>}
    </div>
  );
};

export const TextArea: React.FC<
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
    fullWidth?: boolean;
  }
> = ({ label, error, fullWidth = true, className = '', ...props }) => {
  const widthClass = fullWidth ? styles['input-full-width'] : '';
  const errorClass = error ? styles['input-error'] : '';

  return (
    <div className={`${styles['input-wrapper']} ${widthClass}`}>
      {label && <label className={styles['input-label']}>{label}</label>}
      <textarea
        className={`${styles.input} ${errorClass} ${className}`}
        {...props}
      />
      {error && <span className={styles['input-error-message']}>{error}</span>}
    </div>
  );
};

export const Select: React.FC<
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
    fullWidth?: boolean;
  }
> = ({ label, error, options, fullWidth = true, className = '', ...props }) => {
  const widthClass = fullWidth ? styles['input-full-width'] : '';
  const errorClass = error ? styles['input-error'] : '';

  return (
    <div className={`${styles['input-wrapper']} ${widthClass}`}>
      {label && <label className={styles['input-label']}>{label}</label>}
      <select
        className={`${styles.input} ${errorClass} ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className={styles['input-error-message']}>{error}</span>}
    </div>
  );
};
