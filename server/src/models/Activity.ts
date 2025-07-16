import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  type: 'vote' | 'poll_created' | 'user_registered' | 'poll_ended';
  description: string;
  userId?: string;
  pollId?: string;
  metadata?: any;
  timestamp: Date;
  createdAt: Date;
}

const activitySchema = new Schema<IActivity>({
  type: {
    type: String,
    enum: ['vote', 'poll_created', 'user_registered', 'poll_ended'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    sparse: true
  },
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    sparse: true
  },
  metadata: {
    type: Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient querying
activitySchema.index({ timestamp: -1 });
activitySchema.index({ type: 1 });
activitySchema.index({ userId: 1 });

export const Activity = mongoose.model<IActivity>('Activity', activitySchema);