import mongoose, { Document, Schema, Types } from 'mongoose';

export type LogType = 'meal' | 'workout' | 'sleep';

export interface IMealLog {
  name?: string;
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
}

export interface IWorkoutLog {
  name?: string;
  duration?: number; // in minutes
  type?: 'cardio' | 'strength' | 'flexibility';
  intensity?: 'low' | 'moderate' | 'high';
  caloriesBurned?: number;
}

export interface ISleepLog {
  duration?: number; // in minutes
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface ILog extends Document {
  userId: Types.ObjectId;
  type: LogType;
  metrics: IMealLog | IWorkoutLog | ISleepLog;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const logSchema = new Schema<ILog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['meal', 'workout', 'sleep'],
      required: true,
    },
    metrics: {
      type: Schema.Types.Mixed,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

logSchema.index({ userId: 1, date: -1 });
logSchema.index({ userId: 1, type: 1, date: -1 });
logSchema.index({ date: 1 });

export const Log = mongoose.model<ILog>('Log', logSchema);
