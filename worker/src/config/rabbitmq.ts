import amqp from 'amqplib';
import { QUEUES } from 'shared/types';

export const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Export types for processing jobs
export { DatasetProcessingJob } from 'shared/types';