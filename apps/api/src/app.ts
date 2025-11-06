import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { getEnv } from './config/env.js';
import { apiLimiter } from './config/rateLimiter.js';
import authRoutes from './routes/auth.routes.js';
import logRoutes from './routes/log.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';

export function createApp(): express.Application {
  const app = express();
  const env = getEnv();

  app.use(helmet());

  // Parse CORS_ORIGIN to handle multiple origins
  const corsOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.use(cors());

  app.use(compression());

  // Increase body size limit to support base64 encoded images (50MB)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use((req: Request, res: Response, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(
        `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`
      );
    });
    next();
  });

  app.use('/api', apiLimiter);

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, message: 'Nibble API is running' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/logs', logRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
