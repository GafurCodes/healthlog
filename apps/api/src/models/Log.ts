import mongoose, { Document, Schema, Types } from 'mongoose';

export type LogType = 'meal' | 'workout' | 'sleep';

export interface IMealLog {
  calories?: number;
  carbs?: number;
  protein?: number;
  fat?: number;
  notes?: string;
}

export interface IWorkoutLog {
  duration?: number; // in minutes
  type?: 'cardio' | 'strength' | 'flexibility';
  intensity?: 'low' | 'moderate' | 'high';
  notes?: string;
}

export interface ISleepLog {
  duration?: number; // in minutes
  quality?: number; // 1-10 scale
  notes?: string;
}

export interface ILog extends Document {
  userId: Types.ObjectId;
  type: LogType;
  metrics: IMealLog | IWorkoutLog | ISleepLog;
  date: Date;
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
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
logSchema.index({ userId: 1, date: -1 });
logSchema.index({ userId: 1, type: 1, date: -1 });
logSchema.index({ date: 1 });

export const Log = mongoose.model<ILog>('Log', logSchema);
