import React, { useEffect, useState } from 'react';
import { handleApiError } from '../api/client';
import { Button } from '../components/Button';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Input } from '../components/Input';
import { useAuth } from '../contexts/AuthContext';
import styles from '../styles/components.module.css';

export const SettingsPage: React.FC = () => {
  const { user, changePassword, updateAccount } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [nameLoading, setNameLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    setName(user?.name ?? '');
  }, [user]);

  const handleNameSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNameError('');
    setNameSuccess('');

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }

    setNameLoading(true);

    try {
      const message = await updateAccount(trimmedName);
      setNameSuccess(message || 'Account details updated successfully.');
    } catch (err) {
      const apiError = handleApiError(err);
      setNameError(apiError.message || 'Unable to update account details');
    } finally {
      setNameLoading(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation must match');
      return;
    }

    setLoading(true);

    try {
      const message = await changePassword(currentPassword, newPassword);
      setPasswordSuccess(message || 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const apiError = handleApiError(err);
      setPasswordError(apiError.message || 'Unable to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ maxWidth: '520px', margin: '0 auto' }}>
        <Card>
          <CardHeader>
            <h1 className={styles['text-center']}>Account Settings</h1>
            <p
              className={styles['text-center']}
              style={{ color: 'var(--color-text-light)', margin: '0.5rem 0 0' }}
            >
              Manage your account details and keep your password up to date.
            </p>
          </CardHeader>
          <CardBody>
            <section style={{ marginBottom: '2rem' }}>
              <h2 style={{ marginTop: 0 }}>Profile Details</h2>
              <p style={{ color: 'var(--color-text-light)', marginTop: '0.25rem' }}>
                Update the name associated with your account.
              </p>
              {nameError && <div className={styles['error-message']}>{nameError}</div>}
              {nameSuccess && <div className={styles['success-message']}>{nameSuccess}</div>}
              <form onSubmit={handleNameSubmit}>
                <Input
                  label='Full Name'
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Button
                  type='submit'
                  loading={nameLoading}
                  fullWidth
                  className={styles['mt-lg']}
                  disabled={
                    nameLoading ||
                    name.trim().length < 2 ||
                    name.trim() === (user?.name ?? '')
                  }
                >
                  Save Changes
                </Button>
              </form>
            </section>

            <hr
              style={{
                border: 'none',
                borderTop: '1px solid var(--color-border)',
                margin: '2rem 0',
              }}
            />

            <section>
              <h2 style={{ marginTop: 0 }}>Update Password</h2>
              <p style={{ color: 'var(--color-text-light)', marginTop: '0.25rem' }}>
                Choose a strong password to keep your account secure.
              </p>
              {passwordError && <div className={styles['error-message']}>{passwordError}</div>}
              {passwordSuccess && <div className={styles['success-message']}>{passwordSuccess}</div>}
              <form onSubmit={handlePasswordSubmit}>
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
            </section>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;

