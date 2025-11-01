import mongoose from 'mongoose';
import { getEnv } from '../config/env.js';

let isConnected = false;

export async function connectDB(): Promise<void> {
  const env = getEnv();

  if (isConnected) {
    console.log('Already connected to database');
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI);
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (!isConnected) {
    console.log('Already disconnected from database');
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Failed to disconnect from MongoDB', error);
    throw error;
  }
}

export function getMongoose(): typeof mongoose {
  return mongoose;
}

export function isDBConnected(): boolean {
  return isConnected;
}
