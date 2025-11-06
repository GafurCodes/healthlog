import React, { useEffect, useState } from 'react';
import { profileApi } from '../api/profile';
import type { ProfileGoals } from '../api/profile';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import styles from '../styles/components.module.css';
import { handleApiError } from '../api/client';

export const GoalsPage: React.FC = () => {
  const [goals, setGoals] = useState<ProfileGoals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [goalsExist, setGoalsExist] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      setLoading(true);
      setGoalsExist(true);
      try {
        const res = await profileApi.get();
        if (res.data) {
          setGoals(res.data.goals);
        }
      } catch (err) {
        const apiError = handleApiError(err);
        if (apiError.message?.toLowerCase().includes('not found')) {
          setGoalsExist(false);
        } else {
          setError(apiError.message || 'Failed to fetch goals');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGoals((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await profileApi.update(goals);
      setSuccess('Goals saved successfully!');
      setGoalsExist(true); // Goals now exist
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || 'Failed to save goals');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles['text-center']}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Set Your Daily Goals</h1>
      <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem' }}>
        Set your daily nutritional goals to track your progress.
      </p>
      <Card>
        <CardHeader>
          <h2 style={{ margin: 0 }}>Macro Goals</h2>
        </CardHeader>
        <CardBody>
          {!goalsExist && !loading && (
            <p className={styles['text-center']}>No goals set yet!</p>
          )}
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <Input
                label='Calories (kcal)'
                type='number'
                name='calories'
                value={goals.calories}
                onChange={handleChange}
                min={0}
              />
              <Input
                label='Protein (g)'
                type='number'
                name='protein'
                value={goals.protein}
                onChange={handleChange}
                min={0}
              />
              <Input
                label='Carbs (g)'
                type='number'
                name='carbs'
                value={goals.carbs}
                onChange={handleChange}
                min={0}
              />
              <Input
                label='Fats (g)'
                type='number'
                name='fats'
                value={goals.fats}
                onChange={handleChange}
                min={0}
              />
            </div>
            {error && <p className={styles['error-message']}>{error}</p>}
            {success && <p style={{ color: 'var(--color-success)' }}>{success}</p>}
            <Button
              type='submit'
              disabled={saving}
              style={{ marginTop: '1rem' }}
            >
              {saving ? 'Saving...' : 'Save Goals'}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
