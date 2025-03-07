import mongoose, { Schema } from 'mongoose';
import { Record } from 'shared/types';

// Define the record schema
const recordSchema = new Schema<Record>({
  datasetId: { type: String, required: true },
  index: { type: Number, required: true },
  data: { type: Schema.Types.Mixed, required: true },
  changes: { type: Schema.Types.Mixed, required: true },
  reviewed: { type: Boolean, default: false },
  reviewedAt: { type: Date },
  approved: { type: Boolean },
  comments: { type: String }
});

// Create a compound index for datasetId and index
recordSchema.index({ datasetId: 1, index: 1 }, { unique: true });

// Create and export the record model
export default mongoose.model<Record>('Record', recordSchema);