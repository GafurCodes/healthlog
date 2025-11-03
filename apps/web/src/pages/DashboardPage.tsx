import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { LogsQuery } from '../api/logs';
import { logsApi } from '../api/logs';
import type { Log } from '../types';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import styles from '../styles/components.module.css';
import { handleApiError } from '../api/client';
import { format, subDays } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 7), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const isRangeValid =
    !!startDate && !!endDate
      ? new Date(startDate).getTime() <= new Date(endDate).getTime()
      : true;

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      if (!isRangeValid) {
        setError('End date must be on or after start date');
        setLogs([]);
        return;
      }
      const query: LogsQuery = { startDate, endDate, pageSize: 100 };
      const res = await logsApi.list(query);
      setLogs(res.data.data ?? []);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || '');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRangeValid) {
      loadLogs();
    } else {
      setError('End date must be on or after start date');
      setLogs([]);
    }
  }, [startDate, endDate]);

  const mealLogs = logs.filter((l) => l.type === 'meal');
  const workoutLogs = logs.filter((l) => l.type === 'workout');
  const sleepLogs = logs.filter((l) => l.type === 'sleep');

  const totalCalories = mealLogs.reduce((sum, l) => {
    const m = (l as any)?.metrics as
      | Partial<import('../types').MealLog>
      | undefined;
    return sum + (m?.calories ?? 0);
  }, 0);

  const avgSleep = sleepLogs.length
    ? (
        sleepLogs.reduce((sum, l) => {
          const m = (l as any)?.metrics as
            | Partial<import('../types').SleepLog>
            | undefined;
          return sum + (m?.duration ?? 0);
        }, 0) / sleepLogs.length
      ).toFixed(1)
    : 0;

  const caloriesByDay = mealLogs.reduce((acc: Record<string, number>, log) => {
    const dStr =
      (log.date ?? '').split('T')[0] ||
      format(new Date(log.createdAt), 'yyyy-MM-dd');
    const m = (log as any)?.metrics as
      | Partial<import('../types').MealLog>
      | undefined;
    acc[dStr] = (acc[dStr] || 0) + (m?.calories ?? 0);
    return acc;
  }, {});

  const workoutDurationByDay = workoutLogs.reduce(
    (acc: Record<string, number>, log) => {
      const dStr =
        (log.date ?? '').split('T')[0] ||
        format(new Date(log.createdAt), 'yyyy-MM-dd');
      const m = (log as any)?.metrics as
        | Partial<import('../types').WorkoutLog>
        | undefined;
      acc[dStr] = (acc[dStr] || 0) + (m?.duration ?? 0);
      return acc;
    },
    {}
  );

  const sleepByDay = sleepLogs.reduce((acc: Record<string, number>, log) => {
    const dStr =
      (log.date ?? '').split('T')[0] ||
      format(new Date(log.createdAt), 'yyyy-MM-dd');
    const m = (log as any)?.metrics as
      | Partial<import('../types').SleepLog>
      | undefined;
    acc[dStr] = (acc[dStr] || 0) + (m?.duration ?? 0);
    return acc;
  }, {});

  const calorieChartData = Object.entries(caloriesByDay).map(
    ([date, calories]) => ({
      date: format(new Date(date), 'MMM dd'),
      calories,
    })
  );

  const workoutChartData = Object.entries(workoutDurationByDay).map(
    ([date, duration]) => ({
      date: format(new Date(date), 'MMM dd'),
      duration,
    })
  );

  const sleepChartData = Object.entries(sleepByDay).map(([date, hours]) => ({
    date: format(new Date(date), 'MMM dd'),
    hours,
  }));

  return (
    <div className={styles.container}>
      <div>
        <h1>Welcome back, {user?.name}!</h1>
        <p style={{ color: 'var(--color-text-light)', marginBottom: '2rem' }}>
          Here's your wellness summary
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <Card>
            <CardBody>
              <h3 style={{ marginTop: 0 }}>Total Meals hi hi</h3>
              <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>
                {mealLogs.length}
              </p>
              <p style={{ color: 'var(--color-text-light)', margin: 0 }}>
                this period
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 style={{ marginTop: 0 }}>Total Calories</h3>
              <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>
                {totalCalories}
              </p>
              <p style={{ color: 'var(--color-text-light)', margin: 0 }}>
                kcal
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 style={{ marginTop: 0 }}>Workouts</h3>
              <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>
                {workoutLogs.length}
              </p>
              <p style={{ color: 'var(--color-text-light)', margin: 0 }}>
                completed
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3 style={{ marginTop: 0 }}>Avg Sleep</h3>
              <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>{avgSleep}</p>
              <p style={{ color: 'var(--color-text-light)', margin: 0 }}>
                hours
              </p>
            </CardBody>
          </Card>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <Card>
            <CardHeader>
              <h2 style={{ margin: 0 }}>Filters</h2>
            </CardHeader>
            <CardBody>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '1rem',
                }}
              >
                <Input
                  label='Start Date'
                  type='date'
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate || undefined}
                />
                <Input
                  label='End Date'
                  type='date'
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <Button
                    fullWidth
                    onClick={loadLogs}
                    style={{ marginBottom: 0 }}
                    disabled={!isRangeValid}
                  >
                    Refresh
                  </Button>
                </div>
              </div>
              {!isRangeValid && (
                <p
                  style={{ color: 'var(--color-danger)', marginTop: '0.5rem' }}
                >
                  End date must be on or after start date
                </p>
              )}
            </CardBody>
          </Card>
        </div>

        {error && <div className={styles['error-message']}>{error}</div>}

        {loading ? (
          <div className={styles['text-center']}>
            <div className={styles.spinner}></div>
          </div>
        ) : logs.length > 0 ? (
          <div style={{ display: 'grid', gap: '2rem' }}>
            {calorieChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 style={{ margin: 0 }}>Calorie Trends</h2>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width='100%' height={300}>
                    <LineChart data={calorieChartData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='date' />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type='monotone'
                        dataKey='calories'
                        stroke='#4caf50'
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>
            )}

            {workoutChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 style={{ margin: 0 }}>Workout Duration (minutes)</h2>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width='100%' height={300}>
                    <LineChart data={workoutChartData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='date' />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type='monotone'
                        dataKey='duration'
                        stroke='#ff9800'
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>
            )}

            {sleepChartData.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 style={{ margin: 0 }}>Sleep Hours</h2>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width='100%' height={300}>
                    <LineChart data={sleepChartData}>
                      <CartesianGrid strokeDasharray='3 3' />
                      <XAxis dataKey='date' />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type='monotone'
                        dataKey='hours'
                        stroke='#2196f3'
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>
            )}

            {calorieChartData.length === 0 &&
              workoutChartData.length === 0 &&
              sleepChartData.length === 0 && (
                <Card>
                  <CardBody>
                    <p className={styles['text-center']}>
                      No data to display for selected period
                    </p>
                  </CardBody>
                </Card>
              )}
          </div>
        ) : (
          <Card>
            <CardBody>
              <p className={styles['text-center']}>No logs for this period</p>
              <div className={styles['text-center']}>
                <Link to='/logs/new'>
                  <Button style={{ marginTop: '1rem' }}>
                    Create First Log
                  </Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
};
