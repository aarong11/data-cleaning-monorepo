import mongoose, { Schema } from 'mongoose';
import { DatasetModel } from 'shared/models';

// Define the dataset schema
const datasetSchema = new Schema<typeof DatasetModel>({
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
  userId: { type: String, required: true }
});

// Create and export the dataset model
export default DatasetModel;