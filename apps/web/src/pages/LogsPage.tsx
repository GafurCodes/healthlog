import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LogsQuery } from '../api/logs';
import { logsApi } from '../api/logs';
import { profileApi } from '../api/profile';
import type { ProfileGoals } from '../api/profile';
import type { Log, MealLog } from '../types';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input, Select } from '../components/Input';
import { Modal } from '../components/Modal';
import { LogDetailsModal } from '../components/LogDetailsModal';
import { ProgressBar } from '../components/ProgressBar';
import styles from '../styles/components.module.css';
import { handleApiError } from '../api/client';
import { format } from 'date-fns';

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewDetailsLog, setViewDetailsLog] = useState<Log | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [goals, setGoals] = useState<ProfileGoals | null>(null);
  const [todaysMacros, setTodaysMacros] = useState<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  const loadLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const query: LogsQuery = {
        page,
        pageSize: 10,
        type: type || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      const res = await logsApi.list(query);
      setLogs(res.data.data ?? []);
      setTotalPages(res.data.totalPages ?? 1);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || '');
      setLogs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadGoalsAndTodaysMacros = async () => {
    try {
      const goalsRes = await profileApi.get();
      const g = goalsRes?.data?.goals || {};
      setGoals({
        calories: Number(g.calories) || 0,
        protein: Number(g.protein) || 0,
        carbs: Number(g.carbs) || 0,
        fats: Number(g.fats) || 0,
      });

      const today = format(new Date(), 'yyyy-MM-dd');
      const todaysLogsRes = await logsApi.list({
        type: 'meal',
        startDate: today,
        endDate: today,
        pageSize: 100,
      });
      const todaysMealLogs = todaysLogsRes?.data?.data as
        | (Log & { metrics: MealLog })[]
        | undefined;

      if (todaysMealLogs && todaysMealLogs.length > 0) {
        const macros = todaysMealLogs.reduce(
          (acc, log) => ({
            calories:
              acc.calories + (Number((log as any).metrics?.calories) || 0),
            protein: acc.protein + (Number((log as any).metrics?.protein) || 0),
            carbs: acc.carbs + (Number((log as any).metrics?.carbs) || 0),
            fat: acc.fat + (Number((log as any).metrics?.fat) || 0),
          }),
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        setTodaysMacros({
          calories: Number(macros.calories) || 0,
          protein: Number(macros.protein) || 0,
          carbs: Number(macros.carbs) || 0,
          fat: Number(macros.fat) || 0,
        });
      } else {
        setTodaysMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
      }
    } catch (err) {
      console.error('Failed to load goals and today\'s macros:', err);
      setTodaysMacros({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    }
  };

  useEffect(() => {
    setPage(1);
  }, [type, startDate, endDate]);

  useEffect(() => {
    loadLogs();
    loadGoalsAndTodaysMacros();
  }, [page, type, startDate, endDate]);

  const handleDelete = async (id: string) => {
    try {
      await logsApi.delete(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      setDeleteConfirm(null);
      loadGoalsAndTodaysMacros();
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || '');
    }
  };

  const getLogSummary = (log: Log) => {
    if (log.type === 'meal') {
      const m = (log as any)?.metrics as
        | Partial<import('../types').MealLog>
        | undefined;
      const name = m?.name ?? 'Meal';
      const cal = m?.calories ?? 0;
      return `${name} - ${cal} kcal`;
    }
    if (log.type === 'workout') {
      const m = (log as any)?.metrics as
        | Partial<import('../types').WorkoutLog>
        | undefined;
      const name = m?.name ?? 'Workout';
      const dur = m?.duration ?? 0;
      const intensity = m?.intensity ?? '';
      return `${name} - ${dur} min${intensity ? ` (${intensity})` : ''}`;
    }
    if (log.type === 'sleep') {
      const m = (log as any)?.metrics as
        | Partial<import('../types').SleepLog>
        | undefined;
      const dur = m?.duration ?? 0;
      const quality = m?.quality ?? '';
      return `Sleep - ${dur}h${quality ? ` (${quality})` : ''}`;
    }
    return 'Log';
  };

  const resolvedMax = useMemo(() => {
    const vCal = Number(todaysMacros.calories) || 0;
    const vPro = Number(todaysMacros.protein) || 0;
    const vCarb = Number(todaysMacros.carbs) || 0;
    const vFat = Number(todaysMacros.fat) || 0;

    const gCal = Number(goals?.calories) || 0;
    const gPro = Number(goals?.protein) || 0;
    const gCarb = Number(goals?.carbs) || 0;
    const gFat = Number(goals?.fats) || 0;

    return {
      calories: gCal > 0 ? gCal : vCal,
      protein: gPro > 0 ? gPro : vPro,
      carbs: gCarb > 0 ? gCarb : vCarb,
      fat: gFat > 0 ? gFat : vFat,
    };
  }, [goals, todaysMacros]);

  const colorFor = (
    value: number,
    max: number
  ): 'blue' | 'yellow' | 'green' | 'red' => {
    if (max <= 0) return 'blue';
    const pct = (value / max) * 100;
    if (pct < 50) return 'red';
    if (pct < 90) return 'yellow';
    if (pct <= 110) return 'green';
    return 'blue';
  };

  return (
    <div className={styles.container}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ margin: 0 }}>Logs</h1>
        <Link to='/logs/new'>
          <Button>+ New Log</Button>
        </Link>
      </div>

      <Card style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <h3 style={{ margin: 0 }}>Today's Progress</h3>
        </CardHeader>
        <CardBody>
          <ProgressBar
            label='Calories'
            value={Number(todaysMacros.calories) || 0}
            max={resolvedMax.calories || 1}
            color={colorFor(
              Number(todaysMacros.calories) || 0,
              resolvedMax.calories || 1
            )}
          />
          <ProgressBar
            label='Protein'
            value={Number(todaysMacros.protein) || 0}
            max={resolvedMax.protein || 1}
            color={colorFor(
              Number(todaysMacros.protein) || 0,
              resolvedMax.protein || 1
            )}
          />
          <ProgressBar
            label='Carbs'
            value={Number(todaysMacros.carbs) || 0}
            max={resolvedMax.carbs || 1}
            color={colorFor(
              Number(todaysMacros.carbs) || 0,
              resolvedMax.carbs || 1
            )}
          />
          <ProgressBar
            label='Fat'
            value={Number(todaysMacros.fat) || 0}
            max={resolvedMax.fat || 1}
            color={colorFor(
              Number(todaysMacros.fat) || 0,
              resolvedMax.fat || 1
            )}
          />
        </CardBody>
      </Card>

      <Card style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <h3 style={{ margin: 0 }}>Filters</h3>
        </CardHeader>
        <CardBody>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <Select
              label='Type'
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: '', label: 'All Types' },
                { value: 'meal', label: 'Meal' },
                { value: 'workout', label: 'Workout' },
                { value: 'sleep', label: 'Sleep' },
              ]}
            />
            <Input
              label='Start Date'
              type='date'
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label='End Date'
              type='date'
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {error && <div className={styles['error-message']}>{error}</div>}

      {loading ? (
        <div className={styles['text-center']}>
          <div className={styles.spinner}></div>
        </div>
      ) : logs.length > 0 ? (
        <>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
            {logs.map((log) => (
              <Card key={log.id}>
                <CardBody>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                    }}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>
                        {getLogSummary(log)}
                      </h3>
                      <p
                        style={{
                          margin: 0,
                          color: 'var(--color-text-light)',
                          fontSize: '0.875rem',
                        }}
                      >
                        {format(
                          new Date(log.date ?? log.createdAt),
                          'MMM dd, yyyy'
                        )}
                      </p>
                      {log.notes && (
                        <p
                          style={{
                            margin: '0.5rem 0 0 0',
                            fontSize: '0.875rem',
                          }}
                        >
                          {log.notes}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button
                        variant='secondary'
                        onClick={() => setViewDetailsLog(log)}
                      >
                        View Details
                      </Button>
                      <Link to={`/logs/${log.id}/edit`}>
                        <Button variant='secondary'>Edit</Button>
                      </Link>
                      <Button
                        variant='danger'
                        onClick={() => setDeleteConfirm(log.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            <Button
              variant='secondary'
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant='secondary'
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <Card>
          <CardBody>
            <p className={styles['text-center']}>No logs found</p>
            <div className={styles['text-center']}>
              <Link to='/logs/new'>
                <Button style={{ marginTop: '1rem' }}>Create First Log</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title='Delete Log'
      >
        <p>
          Are you sure you want to delete this log? This action cannot be
          undone.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'flex-end',
            marginTop: '1.5rem',
          }}
        >
          <Button variant='secondary' onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant='danger'
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <LogDetailsModal
        log={viewDetailsLog}
        isOpen={!!viewDetailsLog}
        onClose={() => setViewDetailsLog(null)}
      />
    </div>
  );
};
