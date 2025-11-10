import React from 'react';
import { Modal } from './Modal';
import type { Log } from '../types';
import { format } from 'date-fns';
import styles from '../styles/components.module.css';

interface LogDetailsModalProps {
  log: Log | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LogDetailsModal: React.FC<LogDetailsModalProps> = ({ log, isOpen, onClose }) => {
  if (!log) return null;

  const formatValue = (value: number | undefined, unit: string = '') => {
    if (value === undefined || value === null) return 'Not tracked';
    return `${value}${unit}`;
  };

  const renderMealDetails = () => {
    const metrics = log.metrics as any;
    return (
      <div className={styles['details-grid']}>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Food Name:</span>
          <span className={styles['detail-value']}>{metrics.name || 'Not tracked'}</span>
        </div>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Calories:</span>
          <span className={styles['detail-value']}>{formatValue(metrics.calories, ' kcal')}</span>
        </div>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Protein:</span>
          <span className={styles['detail-value']}>{formatValue(metrics.protein, 'g')}</span>
        </div>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Carbs:</span>
          <span className={styles['detail-value']}>{formatValue(metrics.carbs, 'g')}</span>
        </div>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Fat:</span>
          <span className={styles['detail-value']}>{formatValue(metrics.fat, 'g')}</span>
        </div>
      </div>
    );
  };

  const renderWorkoutDetails = () => {
    const metrics = log.metrics as any;
    return (
      <div className={styles['details-grid']}>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Exercise Name:</span>
          <span className={styles['detail-value']}>{metrics.name || 'Not tracked'}</span>
        </div>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Duration:</span>
          <span className={styles['detail-value']}>{formatValue(metrics.duration, ' minutes')}</span>
        </div>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Workout Type:</span>
          <span className={styles['detail-value']}>
            {metrics.workoutType ?
              metrics.workoutType.charAt(0).toUpperCase() + metrics.workoutType.slice(1)
              : 'Not tracked'}
          </span>
        </div>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Intensity:</span>
          <span className={styles['detail-value']}>
            {metrics.intensity ?
              metrics.intensity.charAt(0).toUpperCase() + metrics.intensity.slice(1)
              : 'Not tracked'}
          </span>
        </div>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Calories Burned:</span>
          <span className={styles['detail-value']}>{formatValue(metrics.caloriesBurned, ' kcal')}</span>
        </div>
      </div>
    );
  };

  const renderSleepDetails = () => {
    const metrics = log.metrics as any;
    return (
      <div className={styles['details-grid']}>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Duration:</span>
          <span className={styles['detail-value']}>{formatValue(metrics.duration, ' hours')}</span>
        </div>
        <div className={styles['detail-item']}>
          <span className={styles['detail-label']}>Quality:</span>
          <span className={styles['detail-value']}>
            {metrics.quality ?
              metrics.quality.charAt(0).toUpperCase() + metrics.quality.slice(1)
              : 'Not tracked'}
          </span>
        </div>
      </div>
    );
  };

  const getLogTypeTitle = () => {
    switch (log.type) {
      case 'meal':
        return 'Meal Details';
      case 'workout':
        return 'Workout Details';
      case 'sleep':
        return 'Sleep Details';
      default:
        return 'Log Details';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={getLogTypeTitle()}>
      <div>
        <div className={styles['detail-item']} style={{ marginBottom: '1rem' }}>
          <span className={styles['detail-label']}>Date:</span>
          <span className={styles['detail-value']}>
            {format(new Date(log.date || log.createdAt), 'MMMM dd, yyyy')}
          </span>
        </div>

        {log.type === 'meal' && renderMealDetails()}
        {log.type === 'workout' && renderWorkoutDetails()}
        {log.type === 'sleep' && renderSleepDetails()}

        {log.notes && (
          <div className={styles['detail-item']} style={{ marginTop: '1rem' }}>
            <span className={styles['detail-label']}>Notes:</span>
            <span className={styles['detail-value']}>{log.notes}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
