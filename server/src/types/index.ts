export type DatasetStatus = 'uploaded' | 'processing' | 'processed' | 'reviewing' | 'completed';

export interface Dataset {
  _id: string;
  datasetId: string;
  status: DatasetStatus;
  filename: string;
  size: number;
  link: string;
  uploadedAt: Date;
  userId: string;
}

export interface DatasetResponse {
  datasetId: string;
  status: DatasetStatus;
  filename: string;
  size: number;
  link: string;
  uploadedAt: string;
}

export interface DatasetList {
  datasets: DatasetResponse[];
}

export interface DeleteResponse {
  message: string;
}

export interface ProcessingResponse {
  datasetId: string;
  status: string;
  message: string;
}

export interface Record {
  _id: string;
  datasetId: string;
  index: number;
  data: { [key: string]: any };
  changes: { [key: string]: any };
  reviewed: boolean;
  approved?: boolean;
  comments?: string;
}

export interface RecordResponse {
  index: number;
  [key: string]: any;
}

export interface RecordsList {
  records: RecordResponse[];
}

export interface ReviewDecision {
  approved: boolean;
  comments?: string;
}

export interface ReviewResponse {
  message: string;
}

export interface ReviewProgress {
  datasetId: string;
  totalRecords: number;
  reviewedRecords: number;
  progress: number;
}

export interface CompleteResponse {
  message: string;
}