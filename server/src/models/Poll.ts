import mongoose, { Schema, Document } from 'mongoose';

export interface IPollOption {
  id: string;
  text: string;
  votes: number;
}

export interface IPoll extends Document {
  title: string;
  description: string;
  options: IPollOption[];
  startTime: Date;
  endTime: Date;
  isActive: boolean;
  eligibleVoters: string[];
  createdBy: string;
  totalVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const pollOptionSchema = new Schema<IPollOption>({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const pollSchema = new Schema<IPoll>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  options: {
    type: [pollOptionSchema],
    required: true,
    validate: {
      validator: function(options: IPollOption[]) {
        return options.length >= 2 && options.length <= 10;
      },
      message: 'Poll must have between 2 and 10 options'
    }
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true,
    validate: {
      validator: function(this: IPoll, endTime: Date) {
        return endTime > this.startTime;
      },
      message: 'End time must be after start time'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  eligibleVoters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Index for efficient querying
pollSchema.index({ startTime: 1, endTime: 1 });
pollSchema.index({ createdBy: 1 });
pollSchema.index({ isActive: 1 });

// Virtual for checking if poll is currently active
pollSchema.virtual('isCurrentlyActive').get(function() {
  const now = new Date();
  return this.isActive && now >= this.startTime && now <= this.endTime;
});

export const Poll = mongoose.model<IPoll>('Poll', pollSchema);