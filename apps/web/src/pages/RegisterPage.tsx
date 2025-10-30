import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardBody, CardHeader } from '../components/Card';
import styles from '../styles/components.module.css';
import { handleApiError } from '../api/client';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/login');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name);
      setSuccess(true);
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.container}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <Card>
            <CardBody>
              <div style={{
                padding: '2rem',
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                borderRadius: '4px',
                textAlign: 'center',
              }}>
                <h2 style={{ marginBottom: '1rem' }}>✓ Registration Successful!</h2>
                <p>Please check your email to verify your account.</p>
                <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                  Redirecting to login...
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Card>
          <CardHeader>
            <h1 className={styles['text-center']}>Register</h1>
          </CardHeader>
          <CardBody>
            {error && <div className={styles['error-message']}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <Input
                label="Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
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
              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button fullWidth loading={loading} type="submit" className={styles['mt-lg']}>
                Register
              </Button>
            </form>

            <div className={styles['mt-lg']}>
              <p className={styles['text-center']}>
                Already have an account? <Link to="/login">Login</Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
