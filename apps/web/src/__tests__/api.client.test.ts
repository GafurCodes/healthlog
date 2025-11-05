import { apiClient, handleApiError } from '../api/client';

describe('api/client (unit)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds Authorization header when token present (request interceptor)', () => {
    localStorage.setItem('accessToken', 'tkn');

    const cfg: any = { headers: {} };

    const reqHandler = (apiClient.interceptors.request as any).handlers?.[0]
      ?.fulfilled;

    expect(typeof reqHandler).toBe('function');

    const out = reqHandler(cfg);
    expect(out.headers.Authorization).toBe('Bearer tkn');
  });

  it('does NOT add Authorization header when token absent', () => {
    const cfg: any = { headers: {} };

    const reqHandler = (apiClient.interceptors.request as any).handlers?.[0]
      ?.fulfilled;

    const out = reqHandler(cfg);
    expect(out.headers.Authorization).toBeUndefined();
  });

  it('handleApiError extracts message from AxiosError-like object', () => {
    const err = {
      isAxiosError: true,
      response: { data: { message: 'Bad stuff', details: { f: 'x' } } },
      message: 'fallback',
      code: '400',
    } as any;

    const apiErr = handleApiError(err);
    expect(apiErr.message).toBe('Bad stuff');
    expect(apiErr.code).toBe('400');
    expect(apiErr.details).toEqual({ f: 'x' });
  });

  it('handleApiError falls back for non-Axios errors', () => {
    const apiErr = handleApiError(new Error('nope'));
    expect(apiErr.message).toBe('An unexpected error occurred');
  });
});
