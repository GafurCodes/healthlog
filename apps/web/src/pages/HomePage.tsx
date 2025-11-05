import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Card, CardBody } from '../components/Card';
import styles from '../styles/components.module.css';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', margin: '2rem 0' }}>
          Welcome to Nibble
        </h1>
        <p
          style={{
            fontSize: '1.25rem',
            marginBottom: '3rem',
            color: 'var(--color-text-light)',
          }}
        >
          Track your meals, workouts, and sleep to achieve your wellness goals
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem',
          }}
        >
          <Card>
            <CardBody>
              <h3>📊 Track Meals</h3>
              <p>Log your meals and track calories, macros, and nutrition</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3>💪 Log Workouts</h3>
              <p>Record your exercises and monitor your fitness progress</p>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h3>😴 Monitor Sleep</h3>
              <p>Track your sleep patterns and improve sleep quality</p>
            </CardBody>
          </Card>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link to='/login'>
            <Button>Login</Button>
          </Link>
          <Link to='/register'>
            <Button variant='secondary'>Register</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
