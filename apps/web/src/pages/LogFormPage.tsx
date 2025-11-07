import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { logsApi } from '../api/logs';
import type { Log } from '../types';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input, TextArea, Select } from '../components/Input';
import styles from '../styles/components.module.css';
import { handleApiError } from '../api/client';
import { format } from 'date-fns';
import MealForm from '../components/MealForm';
import ExerciseForm from '../components/ExerciseForm';

type LogType = 'meal' | 'workout' | 'sleep';

interface FormState {
  type: LogType;
  date: string;
  notes: string;
  meal?: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
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

export default function LogFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormState>({
    type: 'meal',
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    workout: {
      name: '',
      duration: '',
      workoutType: 'cardio',
      intensity: 'moderate',
      caloriesBurned: '',
    },
    sleep: { duration: '', quality: 'good' },
  });

  // 🧠 Load existing log for editing
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

        setForm((prev) => ({
          ...prev,
          type: log.type as LogType,
          date: (log.date || new Date().toISOString()).slice(0, 10),
          notes: log.notes || '',
          meal: log.type === 'meal' ? (log.metrics as any) : prev.meal,
          workout: log.type === 'workout' ? (log.metrics as any) : prev.workout,
          sleep: log.type === 'sleep' ? (log.metrics as any) : prev.sleep,
        }));
      } catch (err) {
        const apiError = handleApiError(err);
        setError(apiError.message || 'Failed to load log');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // 💾 Handle submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const dateIso = new Date(`${form.date}T00:00:00-05:00`).toISOString();

      // Build metrics for backend
      let metrics:
        | {
            type: 'meal';
            name: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
          }
        | {
            type: 'workout';
            name: string;
            duration: number;
            workoutType: 'cardio' | 'strength' | 'flexibility';
            intensity: 'low' | 'moderate' | 'high';
            caloriesBurned: number;
          }
        | {
            type: 'sleep';
            duration: number;
            quality: 'poor' | 'fair' | 'good' | 'excellent';
          }
        | undefined;

      if (form.type === 'meal' && form.meal) {
        metrics = { type: 'meal', ...form.meal };
      } else if (form.type === 'workout') {
        metrics = {
          type: 'workout',
          name: form.workout.name,
          duration: parseFloat(form.workout.duration),
          workoutType: form.workout.workoutType,
          intensity: form.workout.intensity,
          caloriesBurned: parseFloat(form.workout.caloriesBurned),
        };
      } else if (form.type === 'sleep') {
        metrics = {
          type: 'sleep',
          duration: parseFloat(form.sleep.duration),
          quality: form.sleep.quality,
        };
      }

      if (!metrics) {
        setError('Please fill out all required fields');
        setSaving(false);
        return;
      }

      if (id) {
        await logsApi.update(id, metrics, dateIso, form.notes || undefined);
      } else {
        await logsApi.create(metrics, dateIso, form.notes || undefined);
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

            {/* 🍎 Meal Form */}
            {form.type === 'meal' && (
              <MealForm
                value={form.meal}
                onChange={(meal) => setForm((p) => ({ ...p, meal }))}
              />
            )}

            {/* 🏋️ Workout Form */}
            {form.type === 'workout' && (
              <ExerciseForm
                value={form.workout}
                onChange={(workout) => setForm((p) => ({ ...p, workout }))}
              />
            )}

            {/* 😴 Sleep Form */}
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
}
