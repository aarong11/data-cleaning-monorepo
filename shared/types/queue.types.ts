// Queue names constants
export enum QUEUES {
  DATASET_PROCESSING = 'dataset_processing'
}

// Job type definitions
export interface DatasetProcessingJob {
  datasetId: string;
  userId: string;
  filePath: string;
}

// Queue message types
export type QueueMessage = DatasetProcessingJob;