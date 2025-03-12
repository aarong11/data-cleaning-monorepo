export interface Record {
  _id: string;
  datasetId: string;
  index: number;
  data: { [key: string]: any };
  changes: { [key: string]: any };
  reviewed: boolean;
  approved?: boolean;
  comments?: string;
  reviewedAt?: Date;
}

export interface RecordResponse {
  index: number;
  [key: string]: any;
}

export interface RecordsList {
  records: RecordResponse[];
}

export interface RecordProcessingResult {
  original: any;
  changes: any;
}