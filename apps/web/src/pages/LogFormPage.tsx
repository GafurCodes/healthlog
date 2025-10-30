import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logsApi } from '../api/logs';
import type { LogMetrics } from '../types';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input, TextArea, Select } from '../components/Input';
import styles from '../styles/components.module.css';
import { handleApiError } from '../api/client';
import { format } from 'date-fns';

type LogType = 'meal' | 'workout' | 'sleep';

interface FormData {
  type: LogType;
  date: string;
  notes: string;
  meal?: { name: string; calories: string; protein: string; carbs: string; fat: string };
  workout?: { name: string; duration: string; intensity: 'low' | 'moderate' | 'high'; caloriesBurned: string };
  sleep?: { duration: string; quality: 'poor' | 'fair' | 'good' | 'excellent' };
}

export const LogFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormData>({
    type: 'meal',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    meal: { name: '', calories: '', protein: '', carbs: '', fat: '' },
    workout: { name: '', duration: '', intensity: 'moderate', caloriesBurned: '' },
    sleep: { duration: '', quality: 'good' },
  });

  useEffect(() => {
    if (id) {
      logsApi
        .get(id)
        .then((res) => {
          const log = res.data.data;
          const metrics = log.metrics;
          const newForm: FormData = {
            type: metrics.type,
            date: log.date.split('T')[0],
            notes: log.notes || '',
          };

          if (metrics.type === 'meal') {
            newForm.meal = {
              name: metrics.name,
              calories: String(metrics.calories),
              protein: String(metrics.protein),
              carbs: String(metrics.carbs),
              fat: String(metrics.fat),
            };
          } else if (metrics.type === 'workout') {
            newForm.workout = {
              name: metrics.name,
              duration: String(metrics.duration),
              intensity: metrics.intensity,
              caloriesBurned: String(metrics.caloriesBurned),
            };
          } else if (metrics.type === 'sleep') {
            newForm.sleep = {
              duration: String(metrics.duration),
              quality: metrics.quality,
            };
          }

          setForm(newForm);
        })
        .catch((err) => {
          const apiError = handleApiError(err);
          setError(apiError.message);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const buildMetrics = (): LogMetrics | null => {
    const { type } = form;
    if (type === 'meal' && form.meal) {
      return {
        type: 'meal',
        name: form.meal.name,
        calories: Number(form.meal.calories),
        protein: Number(form.meal.protein),
        carbs: Number(form.meal.carbs),
        fat: Number(form.meal.fat),
      };
    } else if (type === 'workout' && form.workout) {
      return {
        type: 'workout',
        name: form.workout.name,
        duration: Number(form.workout.duration),
        intensity: form.workout.intensity,
        caloriesBurned: Number(form.workout.caloriesBurned),
      };
    } else if (type === 'sleep' && form.sleep) {
      return {
        type: 'sleep',
        duration: Number(form.sleep.duration),
        quality: form.sleep.quality,
      };
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const metrics = buildMetrics();
    if (!metrics) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (id) {
        await logsApi.update(id, metrics, form.date, form.notes || undefined);
      } else {
        await logsApi.create(metrics, form.date, form.notes || undefined);
      }
      navigate('/logs');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles['text-center']}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
        <CardHeader>
          <h1 style={{ margin: 0 }}>{id ? 'Edit Log' : 'Create Log'}</h1>
        </CardHeader>
        <CardBody>
          {error && <div className={styles['error-message']}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => {
                const newType = e.target.value as LogType;
                setForm({ ...form, type: newType });
              }}
              options={[
                { value: 'meal', label: 'Meal' },
                { value: 'workout', label: 'Workout' },
                { value: 'sleep', label: 'Sleep' },
              ]}
            />

            <Input
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />

            {form.type === 'meal' && form.meal && (
              <>
                <Input
                  label="Food Name"
                  type="text"
                  value={form.meal.name}
                  onChange={(e) => setForm({ ...form, meal: { ...form.meal!, name: e.target.value } })}
                  required
                />
                <Input
                  label="Calories"
                  type="number"
                  value={form.meal.calories}
                  onChange={(e) => setForm({ ...form, meal: { ...form.meal!, calories: e.target.value } })}
                  required
                />
                <Input
                  label="Protein (g)"
                  type="number"
                  value={form.meal.protein}
                  onChange={(e) => setForm({ ...form, meal: { ...form.meal!, protein: e.target.value } })}
                  required
                />
                <Input
                  label="Carbs (g)"
                  type="number"
                  value={form.meal.carbs}
                  onChange={(e) => setForm({ ...form, meal: { ...form.meal!, carbs: e.target.value } })}
                  required
                />
                <Input
                  label="Fat (g)"
                  type="number"
                  value={form.meal.fat}
                  onChange={(e) => setForm({ ...form, meal: { ...form.meal!, fat: e.target.value } })}
                  required
                />
              </>
            )}

            {form.type === 'workout' && form.workout && (
              <>
                <Input
                  label="Exercise Name"
                  type="text"
                  value={form.workout.name}
                  onChange={(e) => setForm({ ...form, workout: { ...form.workout!, name: e.target.value } })}
                  required
                />
                <Input
                  label="Duration (minutes)"
                  type="number"
                  value={form.workout.duration}
                  onChange={(e) => setForm({ ...form, workout: { ...form.workout!, duration: e.target.value } })}
                  required
                />
                <Select
                  label="Intensity"
                  value={form.workout.intensity}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      workout: { ...form.workout!, intensity: e.target.value as 'low' | 'moderate' | 'high' },
                    })
                  }
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'high', label: 'High' },
                  ]}
                />
                <Input
                  label="Calories Burned"
                  type="number"
                  value={form.workout.caloriesBurned}
                  onChange={(e) => setForm({ ...form, workout: { ...form.workout!, caloriesBurned: e.target.value } })}
                  required
                />
              </>
            )}

            {form.type === 'sleep' && form.sleep && (
              <>
                <Input
                  label="Duration (hours)"
                  type="number"
                  step="0.5"
                  value={form.sleep.duration}
                  onChange={(e) => setForm({ ...form, sleep: { ...form.sleep!, duration: e.target.value } })}
                  required
                />
                <Select
                  label="Quality"
                  value={form.sleep.quality}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sleep: { ...form.sleep!, quality: e.target.value as 'poor' | 'fair' | 'good' | 'excellent' },
                    })
                  }
                  options={[
                    { value: 'poor', label: 'Poor' },
                    { value: 'fair', label: 'Fair' },
                    { value: 'good', label: 'Good' },
                    { value: 'excellent', label: 'Excellent' },
                  ]}
                />
              </>
            )}

            <TextArea
              label="Notes (optional)"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={4}
            />

            <div className={styles['form-actions']}>
              <Button variant="secondary" onClick={() => navigate('/logs')}>
                Cancel
              </Button>
              <Button loading={saving} type="submit">
                {id ? 'Update' : 'Create'} Log
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
