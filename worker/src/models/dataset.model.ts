import mongoose, { Schema } from 'mongoose';
import { Dataset } from 'shared/types';

// Define the dataset schema
const datasetSchema = new Schema<Dataset>({
  datasetId: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['uploaded', 'processing', 'processed', 'reviewing', 'completed', 'error'],
    default: 'uploaded'
  },
  filename: { type: String, required: true },
  size: { type: Number, required: true },
  link: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
  userId: { type: String, required: true }
});

// Create and export the dataset model
export default mongoose.model<Dataset>('Dataset', datasetSchema);