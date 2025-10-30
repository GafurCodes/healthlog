import 'dotenv/config.js';
import { initializeEnv } from './config/env.js';
import { initializeLogger, getLogger } from './config/logger.js';
import { initializeEmailService } from './services/email.service.js';
import { connectDB, disconnectDB } from './db/mongoose.js';
import { createApp } from './app.js';

async function startServer(): Promise<void> {
  try {
    // Initialize environment variables
    const env = initializeEnv();

    // Initialize logger
    initializeLogger();
    const logger = getLogger();

    logger.info('Starting HealthLog API...');

    // Initialize email service
    initializeEmailService();
    logger.info('Email service initialized');

    // Connect to database
    await connectDB();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        await disconnectDB();
        logger.info('Database connection closed');

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
