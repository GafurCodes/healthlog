import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import pinoHttp from 'pino-http';
import { getEnv } from './config/env.js';
import { getLogger } from './config/logger.js';
import { apiLimiter } from './config/rateLimiter.js';
import authRoutes from './routes/auth.routes.js';
import logRoutes from './routes/log.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp(): express.Application {
  const app = express();
  const env = getEnv();
  const logger = getLogger();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }
  app.use(pinoHttp({ logger }));

  // Rate limiting
  app.use('/api', apiLimiter);

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, message: 'HealthLog API is running' });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/logs', logRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
