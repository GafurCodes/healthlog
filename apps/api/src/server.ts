import 'dotenv/config.js';
import { initializeEnv } from './config/env.js';
import { initializeEmailService } from './services/email.service.js';
import { connectDB, disconnectDB } from './db/mongoose.js';
import { createApp } from './app.js';

async function startServer(): Promise<void> {
  try {
    const env = initializeEnv();

    console.log('Starting HealthLog API...');

    initializeEmailService();
    console.log('Email service initialized');

    await connectDB();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    });

    const shutdown = async (signal: string) => {
      console.log(`${signal} received, shutting down gracefully...`);

      server.close(async () => {
        console.log('HTTP server closed');

        await disconnectDB();
        console.log('Database connection closed');

        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
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
