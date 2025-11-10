import { AppError } from '../utils/errors.js';

describe('AppError', () => {
  it('should create error with message and status code', () => {
    const error = new AppError('Something went wrong', 500);

    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('AppError');
    expect(error).toBeInstanceOf(Error);
  });

  it('should use default status code 400', () => {
    const error = new AppError('Bad request');

    expect(error.message).toBe('Bad request');
    expect(error.statusCode).toBe(400);
  });

  it('should be throwable', () => {
    expect(() => {
      throw new AppError('Test error', 404);
    }).toThrow(AppError);
  });

  it('should be catchable', () => {
    try {
      throw new AppError('Not found', 404);
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      if (error instanceof AppError) {
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe('Not found');
      }
    }
  });

  it('should maintain error stack trace', () => {
    const error = new AppError('Test error', 500);
    expect(error.stack).toBeDefined();
    expect(typeof error.stack).toBe('string');
  });
});
