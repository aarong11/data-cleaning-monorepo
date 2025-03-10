import mongoose, { Schema } from 'mongoose';
import { Dataset as DatasetType } from '../types';

/**
 * Mongoose schema for Dataset documents in the database
 * Represents a user-uploaded dataset for cleaning and processing
 */
const DatasetSchema = new Schema({
  /**
   * Unique identifier for the dataset
   */
  datasetId: {
    type: String,
    required: true,
    unique: true,
  },
  /**
   * Current status of the dataset in the processing pipeline
   */
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'processed', 'reviewing', 'completed', 'error'],
    default: 'uploaded',
    required: true,
  },
  /**
   * Original filename of the uploaded dataset
   */
  filename: {
    type: String,
    required: true,
  },
  /**
   * Size of the dataset file in bytes
   */
  size: {
    type: Number,
    required: true,
  },
  /**
   * S3/R2 storage URL where the dataset file is stored
   */
  link: {
    type: String,
    required: true,
  },
  /**
   * Timestamp when the dataset was uploaded
   */
  uploadedAt: {
    type: Date,
    default: Date.now,
    required: true,
  },
  /**
   * ID of the user who uploaded the dataset
   */
  userId: {
    type: String,
    required: true,
    index: true
  },
  /**
   * ID of the organization the dataset belongs to
   */
  organizationId: {
    type: String,
    required: true,
    index: true
  }
});

// Add compound index for organization-based queries
DatasetSchema.index({ organizationId: 1, userId: 1 });

/**
 * Mongoose model for dataset documents
 */
export default mongoose.model<DatasetType>('Dataset', DatasetSchema);