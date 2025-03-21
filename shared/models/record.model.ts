import mongoose, { Schema } from 'mongoose';
import { Record as RecordType } from '../types';

const RecordSchema = new Schema<RecordType>({
  datasetId: {
    type: String,
    required: true,
    index: true
  },
  index: {
    type: Number,
    required: true
  },
  data: {
    type: Schema.Types.Mixed,
    required: true
  },
  changes: {
    type: Schema.Types.Mixed,
    default: {}
  },
  reviewed: {
    type: Boolean,
    default: false
  },
  approved: {
    type: Boolean,
    default: undefined
  },
  comments: {
    type: String
  },
  reviewedAt: {
    type: Date
  }
});

// Compound index for quick lookups based on datasetId and index
RecordSchema.index({ datasetId: 1, index: 1 }, { unique: true });

export default mongoose.model<RecordType>('Record', RecordSchema);