import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardBody, CardHeader } from '../components/Card';
import styles from '../styles/components.module.css';
import { handleApiError } from '../api/client';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const hasAttemptedVerification = useRef(false);

  useEffect(() => {
    // Prevent duplicate verification attempts
    if (hasAttemptedVerification.current) {
      return;
    }

    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    hasAttemptedVerification.current = true;

    verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email verified successfully!');
        setTimeout(() => navigate('/dashboard'), 2000);
      })
      .catch((err) => {
        const apiError = handleApiError(err);
        setStatus('error');
        setMessage(apiError.message);
      });
  }, [searchParams, verifyEmail, navigate]);

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <Card>
          <CardHeader>
            <h1 className={styles['text-center']}>Email Verification</h1>
          </CardHeader>
          <CardBody>
            {status === 'loading' && (
              <div className={styles['text-center']}>
                <div className={styles.spinner}></div>
                <p className={styles['mt-md']}>Verifying email...</p>
              </div>
            )}
            {status === 'success' && (
              <div>
                <div className={styles['success-message']}>{message}</div>
                <p className={styles['mt-lg']}>Redirecting to dashboard...</p>
              </div>
            )}
            {status === 'error' && (
              <div>
                <div className={styles['error-message']}>{message}</div>
                <p className={styles['mt-lg']}>
                  <Link to="/login">Back to login</Link>
                </p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
