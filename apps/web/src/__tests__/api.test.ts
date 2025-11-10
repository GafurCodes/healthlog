import axios, { AxiosError } from 'axios';
import { handleApiError } from '../api/client';
import type { ApiError } from '../types';

// Mock console.error to avoid cluttering test output
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

describe('API Client Utilities', () => {
  describe('handleApiError', () => {
    it('should handle AxiosError with response data', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Request failed',
        code: 'ERR_BAD_REQUEST',
        response: {
          status: 400,
          data: {
            message: 'Invalid input',
            details: { field: 'email' },
          },
        },
        config: {
          url: '/api/test',
        },
      } as unknown as AxiosError;

      // Mock axios.isAxiosError
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result: ApiError = handleApiError(axiosError);

      expect(result.message).toBe('Invalid input');
      expect(result.code).toBe('ERR_BAD_REQUEST');
      expect(result.details).toEqual({ field: 'email' });
    });

    it('should handle AxiosError without response data', () => {
      const axiosError = {
        isAxiosError: true,
        message: 'Network Error',
        code: 'ERR_NETWORK',
      } as unknown as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result: ApiError = handleApiError(axiosError);

      expect(result.message).toBe('Network Error');
      expect(result.code).toBe('ERR_NETWORK');
      expect(result.details).toBeUndefined();
    });

    it('should handle non-Axios errors', () => {
      const genericError = new Error('Something went wrong');

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result: ApiError = handleApiError(genericError);

      expect(result.message).toBe('An unexpected error occurred');
      expect(result.code).toBeUndefined();
      expect(result.details).toBeUndefined();
    });

    it('should handle unknown error types', () => {
      const unknownError = { weird: 'object' };

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(false);

      const result: ApiError = handleApiError(unknownError);

      expect(result.message).toBe('An unexpected error occurred');
    });

    it('should use fallback message when error data is missing', () => {
      const axiosError = {
        isAxiosError: true,
        message: '',
        code: undefined,
        response: {
          status: 500,
          data: {},
        },
      } as unknown as AxiosError;

      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);

      const result: ApiError = handleApiError(axiosError);

      expect(result.message).toBe('An error occurred');
    });
  });
});
