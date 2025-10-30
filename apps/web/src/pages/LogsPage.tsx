import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { LogsQuery } from '../api/logs';
import { logsApi } from '../api/logs';
import type { Log } from '../types';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input, Select } from '../components/Input';
import { Modal } from '../components/Modal';
import styles from '../styles/components.module.css';
import { handleApiError } from '../api/client';
import { format } from 'date-fns';

export const LogsPage: React.FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
      setLogs(res.data.data);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [type, startDate, endDate]);

  useEffect(() => {
    loadLogs();
  }, [page, type, startDate, endDate]);

  const handleDelete = async (id: string) => {
    try {
      await logsApi.delete(id);
      setLogs(logs.filter((l) => l.id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    }
  };

  const getLogSummary = (log: Log) => {
    const metrics = log.metrics;
    switch (metrics.type) {
      case 'meal':
        return `${metrics.name} - ${metrics.calories} kcal`;
      case 'workout':
        return `${metrics.name} - ${metrics.duration} min (${metrics.intensity})`;
      case 'sleep':
        return `Sleep - ${metrics.duration}h (${metrics.quality})`;
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>Logs</h1>
        <Link to="/logs/new">
          <Button>+ New Log</Button>
        </Link>
      </div>

      <Card style={{ marginBottom: '2rem' }}>
        <CardHeader>
          <h3 style={{ margin: 0 }}>Filters</h3>
        </CardHeader>
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <Select
              label="Type"
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
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>{getLogSummary(log)}</h3>
                      <p style={{ margin: 0, color: 'var(--color-text-light)', fontSize: '0.875rem' }}>
                        {format(new Date(log.date), 'MMM dd, yyyy')}
                      </p>
                      {log.notes && <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem' }}>{log.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/logs/${log.id}/edit`}>
                        <Button variant="secondary">Edit</Button>
                      </Link>
                      <Button variant="danger" onClick={() => setDeleteConfirm(log.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="secondary"
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
              <Link to="/logs/new">
                <Button style={{ marginTop: '1rem' }}>Create First Log</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      )}

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Log"
      >
        <p>Are you sure you want to delete this log? This action cannot be undone.</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};
