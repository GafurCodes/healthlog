import React from 'react';
import styles from '../styles/components.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseClasses = styles.button;
  const variantClass = styles[`button-${variant}`];
  const widthClass = fullWidth ? styles['button-full-width'] : '';
  const disabledClass = disabled || loading ? styles['button-disabled'] : '';

  return (
    <button
      className={`${baseClasses} ${variantClass} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};
