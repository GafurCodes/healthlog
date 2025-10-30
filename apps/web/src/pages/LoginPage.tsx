import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardBody, CardHeader } from '../components/Card';
import styles from '../styles/components.module.css';
import { handleApiError } from '../api/client';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Card>
          <CardHeader>
            <h1 className={styles['text-center']}>Login</h1>
          </CardHeader>
          <CardBody>
            {error && <div className={styles['error-message']}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button fullWidth loading={loading} type="submit" className={styles['mt-lg']}>
                Login
              </Button>
            </form>

            <div className={styles['mt-lg']}>
              <p className={styles['text-center']}>
                Don't have an account? <Link to="/register">Register</Link>
              </p>
              <p className={styles['text-center']}>
                <Link to="/forgot-password">Forgot password?</Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
