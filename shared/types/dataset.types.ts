/**
 * Possible status values for a dataset throughout its lifecycle
 */
export type DatasetStatus = 'uploaded' | 'processing' | 'processed' | 'reviewing' | 'completed' | 'error';

/**
 * Dataset document interface for database operations
 */
export interface Dataset {
  _id?: string;
  datasetId: string;
  status: DatasetStatus;
  filename: string;
  size: number;
  link: string;
  uploadedAt: Date;
  userId: string;
  organizationId: string;
}

/**
 * Dataset interface for API responses
 * Contains serialized date for JSON compatibility
 */
export interface DatasetResponse {
  datasetId: string;
  status: DatasetStatus;
  filename: string;
  size: number;
  link: string;
  uploadedAt: string;
  organizationId: string;
}

/**
 * Response interface for listing multiple datasets
 */
export interface DatasetList {
  datasets: DatasetResponse[];
}

/**
 * Standard response for delete operations
 */
export interface DeleteResponse {
  message: string;
}

/**
 * Response interface for dataset processing operations
 */
export interface ProcessingResponse {
  datasetId: string;
  status: string;
  message: string;
}