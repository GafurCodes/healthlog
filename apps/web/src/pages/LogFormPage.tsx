import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logsApi } from '../api/logs';
import type { Log, LogMetrics } from '../types';
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
  meal: {
    name: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  };
  workout: {
    name: string;
    duration: string;
    workoutType: 'cardio' | 'strength' | 'flexibility';
    intensity: 'low' | 'moderate' | 'high';
    caloriesBurned: string;
  };
  sleep: { duration: string; quality: 'poor' | 'fair' | 'good' | 'excellent' };
}

export const LogFormPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    type: 'meal',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    meal: { name: '', calories: '', protein: '', carbs: '', fat: '' },
    workout: {
      name: '',
      duration: '',
      workoutType: 'cardio',
      intensity: 'moderate',
      caloriesBurned: '',
    },
    sleep: { duration: '', quality: 'good' },
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await logsApi.get(id);
        const log: Log | undefined = res?.data?.data as any;
        if (!log || !log.id) {
          setError('Log not found');
          return;
        }

        const next: FormData = {
          type: log.type as LogType,
          date: (log.date || log.createdAt || new Date().toISOString()).slice(
            0,
            10
          ),
          notes: log.notes || '',
          meal: { name: '', calories: '', protein: '', carbs: '', fat: '' },
          workout: {
            name: '',
            duration: '',
            workoutType: 'cardio',
            intensity: 'moderate',
            caloriesBurned: '',
          },
          sleep: { duration: '', quality: 'good' },
        };

        if (log.type === 'meal') {
          const m = (log as any).metrics || {};
          next.meal = {
            name: String(m.name ?? ''),
            calories: toForm(m.calories),
            protein: toForm(m.protein),
            carbs: toForm(m.carbs),
            fat: toForm(m.fat),
          };
        } else if (log.type === 'workout') {
          const m = (log as any).metrics || {};
          next.workout = {
            name: String(m.name ?? ''),
            duration: toForm(m.duration),
            workoutType: (m.workoutType as any) ?? 'cardio',
            intensity: (m.intensity as any) ?? 'moderate',
            caloriesBurned: toForm(m.caloriesBurned),
          };
        } else if (log.type === 'sleep') {
          const m = (log as any).metrics || {};
          next.sleep = {
            duration: toForm(m.duration),
            quality: (m.quality as any) ?? 'good',
          };
        }

        setForm(next);
      } catch (err) {
        const apiError = handleApiError(err);
        setError(apiError.message || 'Failed to load log');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const buildMetrics = (): LogMetrics | null => {
    if (form.type === 'meal') {
      return {
        type: 'meal',
        name: blankToUndef(form.meal.name),
        calories: toNum(form.meal.calories),
        protein: toNum(form.meal.protein),
        carbs: toNum(form.meal.carbs),
        fat: toNum(form.meal.fat),
      } as any;
    }
    if (form.type === 'workout') {
      return {
        type: 'workout',
        name: blankToUndef(form.workout.name),
        duration: toNum(form.workout.duration),
        workoutType: form.workout.workoutType,
        intensity: form.workout.intensity,
        caloriesBurned: toNum(form.workout.caloriesBurned),
      } as any;
    }
    if (form.type === 'sleep') {
      return {
        type: 'sleep',
        duration: toNum(form.sleep.duration),
        quality: form.sleep.quality,
      } as any;
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
      const dateIso = new Date(form.date + 'T00:00:00.000Z').toISOString();
      if (id) {
        await logsApi.update(id, metrics, dateIso, blankToUndef(form.notes));
      } else {
        await logsApi.create(metrics, dateIso, blankToUndef(form.notes));
      }
      navigate('/logs');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || 'Unexpected error');
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
              label='Type'
              value={form.type}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  type: e.target.value as LogType,
                }))
              }
              options={[
                { value: 'meal', label: 'Meal' },
                { value: 'workout', label: 'Workout' },
                { value: 'sleep', label: 'Sleep' },
              ]}
            />

            <Input
              label='Date'
              type='date'
              value={form.date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, date: e.target.value }))
              }
              required
            />

            {form.type === 'meal' && (
              <>
                <Input
                  label='Food Name'
                  type='text'
                  value={form.meal.name}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      meal: { ...p.meal, name: e.target.value },
                    }))
                  }
                  required
                />
                <Input
                  label='Calories'
                  type='number'
                  value={form.meal.calories}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      meal: { ...p.meal, calories: e.target.value },
                    }))
                  }
                  required
                />
                <Input
                  label='Protein (g)'
                  type='number'
                  value={form.meal.protein}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      meal: { ...p.meal, protein: e.target.value },
                    }))
                  }
                />
                <Input
                  label='Carbs (g)'
                  type='number'
                  value={form.meal.carbs}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      meal: { ...p.meal, carbs: e.target.value },
                    }))
                  }
                />
                <Input
                  label='Fat (g)'
                  type='number'
                  value={form.meal.fat}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      meal: { ...p.meal, fat: e.target.value },
                    }))
                  }
                />
              </>
            )}

            {form.type === 'workout' && (
              <>
                <Input
                  label='Exercise Name'
                  type='text'
                  value={form.workout.name}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      workout: { ...p.workout, name: e.target.value },
                    }))
                  }
                  required
                />
                <Input
                  label='Duration (minutes)'
                  type='number'
                  value={form.workout.duration}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      workout: { ...p.workout, duration: e.target.value },
                    }))
                  }
                  required
                />
                <Select
                  label='Workout Type'
                  value={form.workout.workoutType}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      workout: {
                        ...p.workout,
                        workoutType: e.target.value as
                          | 'cardio'
                          | 'strength'
                          | 'flexibility',
                      },
                    }))
                  }
                  options={[
                    { value: 'cardio', label: 'Cardio' },
                    { value: 'strength', label: 'Strength' },
                    { value: 'flexibility', label: 'Flexibility' },
                  ]}
                />
                <Select
                  label='Intensity'
                  value={form.workout.intensity}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      workout: {
                        ...p.workout,
                        intensity: e.target.value as
                          | 'low'
                          | 'moderate'
                          | 'high',
                      },
                    }))
                  }
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'moderate', label: 'Moderate' },
                    { value: 'high', label: 'High' },
                  ]}
                />
                <Input
                  label='Calories Burned'
                  type='number'
                  value={form.workout.caloriesBurned}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      workout: { ...p.workout, caloriesBurned: e.target.value },
                    }))
                  }
                />
              </>
            )}

            {form.type === 'sleep' && (
              <>
                <Input
                  label='Duration (hours)'
                  type='number'
                  step='0.5'
                  value={form.sleep.duration}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sleep: { ...p.sleep, duration: e.target.value },
                    }))
                  }
                  required
                />
                <Select
                  label='Quality'
                  value={form.sleep.quality}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      sleep: {
                        ...p.sleep,
                        quality: e.target.value as
                          | 'poor'
                          | 'fair'
                          | 'good'
                          | 'excellent',
                      },
                    }))
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
              label='Notes (optional)'
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              rows={4}
            />

            <div className={styles['form-actions']}>
              <Button variant='secondary' onClick={() => navigate('/logs')}>
                Cancel
              </Button>
              <Button loading={saving} type='submit'>
                {id ? 'Update' : 'Create'} Log
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

function toForm(v: any): string {
  if (v === null || v === undefined) return '';
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : '';
}

function toNum(v: string): number | undefined {
  if (v === null || v === undefined || v === '') return undefined;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
}

function blankToUndef<T extends string | undefined>(v: T): T | undefined {
  if (v === '' || v === undefined) return undefined;
  return v;
}
