import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card, CardBody, CardHeader } from '../components/Card';
import styles from '../styles/components.module.css';
import { handleApiError } from '../api/client';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      await forgotPassword(email);
      setSuccess(true);
      setMessage('Check your email for a password reset link');
    } catch (err) {
      const apiError = handleApiError(err);
      setMessage(apiError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Card>
          <CardHeader>
            <h1 className={styles['text-center']}>Forgot Password</h1>
          </CardHeader>
          <CardBody>
            {message && (
              <div className={success ? styles['success-message'] : styles['error-message']}>
                {message}
              </div>
            )}
            {!success && (
              <form onSubmit={handleSubmit}>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button fullWidth loading={loading} type="submit" className={styles['mt-lg']}>
                  Send Reset Link
                </Button>
              </form>
            )}

            <div className={styles['mt-lg']}>
              <p className={styles['text-center']}>
                <Link to="/login">Back to login</Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
