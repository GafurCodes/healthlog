import mongoose from 'mongoose';
import { getEnv } from '../config/env.js';
import { getLogger } from '../config/logger.js';

let isConnected = false;

export async function connectDB(): Promise<void> {
  const env = getEnv();
  const logger = getLogger();

  if (isConnected) {
    logger.info('Already connected to database');
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI);
    isConnected = true;
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  const logger = getLogger();

  if (!isConnected) {
    logger.info('Already disconnected from database');
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('Disconnected from MongoDB');
  } catch (error) {
    logger.error('Failed to disconnect from MongoDB', error);
    throw error;
  }
}

export function getMongoose(): typeof mongoose {
  return mongoose;
}

export function isDBConnected(): boolean {
  return isConnected;
}
