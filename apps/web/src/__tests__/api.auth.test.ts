jest.mock('../api/client', () => {
  const post = jest.fn();
  return { apiClient: { post } };
});

import { apiClient } from '../api/client';
import { authApi } from '../api/auth';

describe('api/auth', () => {
  beforeEach(() => {
    (apiClient.post as jest.Mock).mockReset();
  });

  it('login posts credentials and returns tokens', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { tokens: { accessToken: 'A', refreshToken: 'R' } },
    });
    const r = await authApi.login('a@b.com', 'x');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'a@b.com',
      password: 'x',
    });
    expect(r.data).toEqual({ tokens: { accessToken: 'A', refreshToken: 'R' } });
  });

  it('register posts email,password,name and returns response', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { tokens: { accessToken: 'A2', refreshToken: 'R2' } },
    });
    const r = await authApi.register('a@b.com', 'P@ssw0rd!', 'G');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/register', {
      email: 'a@b.com',
      password: 'P@ssw0rd!',
      name: 'G',
    });
    expect(r.data.tokens.accessToken).toBe('A2');
  });

  it('verifyEmail posts token', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { ok: true } });
    const r = await authApi.verifyEmail('tok');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/verify-email', {
      token: 'tok',
    });
    expect(r.data).toEqual({ ok: true });
  });

  it('forgotPassword posts email', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { message: 'sent' },
    });
    const r = await authApi.forgotPassword('a@b.com');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/forgot-password', {
      email: 'a@b.com',
    });
    expect(r.data.message).toBe('sent');
  });

  it('resetPassword posts token and newPassword', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { message: 'ok' },
    });
    const r = await authApi.resetPassword('tok', 'NewP@ss1');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
      token: 'tok',
      password: 'NewP@ss1',
    });
    expect(r.data.message).toBe('ok');
  });

  it('refresh posts refreshToken', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      data: { tokens: { accessToken: 'A3', refreshToken: 'R3' } },
    });
    const r = await authApi.refresh('RRR');
    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh', {
      refreshToken: 'RRR',
    });
    expect(r.data.tokens.refreshToken).toBe('R3');
  });
});
