import dotenv from 'dotenv';
import path from 'path';
import amqp from 'amqplib';
import { QUEUES } from 'shared/types';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Validate required environment variables
if (!process.env.RABBITMQ_URL) {
  throw new Error('Missing required environment variable: RABBITMQ_URL');
}

export const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Export types for processing jobs
export { DatasetProcessingJob } from 'shared/types';

export default {
  url: process.env.RABBITMQ_URL,
  queues: {
    datasetProcessing: 'dataset-processing',
    datasetValidation: 'dataset-validation'
  }
};