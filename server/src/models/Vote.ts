import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  pollId: string;
  voterId: string;
  encryptedVote: string;
  blockHash: string;
  timestamp: Date;
  createdAt: Date;
}

const voteSchema = new Schema<IVote>({
  pollId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Poll',
    required: true
  },
  voterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  encryptedVote: {
    type: String,
    required: true
  },
  blockHash: {
    type: String,
    required: true,
    unique: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent double voting
voteSchema.index({ pollId: 1, voterId: 1 }, { unique: true });
voteSchema.index({ blockHash: 1 });
voteSchema.index({ timestamp: -1 });

export const Vote = mongoose.model<IVote>('Vote', voteSchema);