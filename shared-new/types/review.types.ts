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