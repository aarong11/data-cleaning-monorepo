import mongoose, { Schema } from 'mongoose';
import { Dataset } from 'shared/types';

const DatasetSchema = new Schema<Dataset>({
  datasetId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'reviewing', 'completed', 'error'],
    default: 'uploaded',
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  }
});

export default mongoose.model<Dataset>('Dataset', DatasetSchema);