import React, { useState } from 'react';
import { handleApiError } from '../api/client';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/components.module.css';

export const SettingsPage: React.FC = () => {
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation must match');
      return;
    }

    setLoading(true);

    try {
      const message = await changePassword(currentPassword, newPassword);
      setSuccessMessage(message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || 'Unable to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <Card>
          <CardHeader>
            <h1 className={styles['text-center']}>Account Settings</h1>
            <p className={styles['text-center']} style={{ color: 'var(--color-text-light)', margin: '0.5rem 0 0' }}>
              Update your password to keep your account secure.
            </p>
          </CardHeader>
          <CardBody>
            {error && <div className={styles['error-message']}>{error}</div>}
            {successMessage && <div className={styles['success-message']}>{successMessage}</div>}

            <form onSubmit={handleSubmit}>
              <Input
                label='Current Password'
                type='password'
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label='New Password'
                type='password'
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label='Confirm New Password'
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button
                type='submit'
                loading={loading}
                fullWidth
                className={styles['mt-lg']}
              >
                Update Password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;

