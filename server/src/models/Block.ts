import mongoose, { Schema, Document } from 'mongoose';

export interface IBlock extends Document {
  index: number;
  timestamp: Date;
  data: any;
  previousHash: string;
  hash: string;
  nonce: number;
  createdAt: Date;
}

const blockSchema = new Schema<IBlock>({
  index: {
    type: Number,
    required: true,
    unique: true,
    min: 0
  },
  timestamp: {
    type: Date,
    required: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  previousHash: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true,
    unique: true
  },
  nonce: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
blockSchema.index({ index: 1 });
blockSchema.index({ hash: 1 });
blockSchema.index({ timestamp: -1 });

export const Block = mongoose.model<IBlock>('Block', blockSchema);