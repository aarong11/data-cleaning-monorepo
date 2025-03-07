import { v4 as uuidv4 } from 'uuid';
import DatasetModel from '../models/dataset.model';
import RecordModel from '../models/record.model';
import { Dataset, DatasetStatus, RecordResponse, Record, DatasetProcessingJob, QUEUES } from 'shared';
import { parseCSV, processRecordsWithAI } from '../utils/file.utils';
import path from 'path';
import { sendToQueue } from '../config/rabbitmq';

export class DatasetService {
  async createDataset(userId: string, filename: string, size: number, link: string): Promise<Dataset> {
    const datasetId = uuidv4();
    
    const dataset = new DatasetModel({
      datasetId,
      userId,
      filename,
      size,
      link,
      status: 'uploaded' as DatasetStatus,
      uploadedAt: new Date()
    });

    await dataset.save();
    return dataset;
  }

  async getDatasetsByUserId(userId: string, limit = 10, offset = 0): Promise<Dataset[]> {
    return DatasetModel.find({ userId })
      .sort({ uploadedAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  async getDatasetById(datasetId: string): Promise<Dataset | null> {
    return DatasetModel.findOne({ datasetId });
  }

  async deleteDatasetById(datasetId: string, userId: string): Promise<boolean> {
    const dataset = await DatasetModel.findOne({ datasetId, userId });
    
    if (!dataset) {
      return false;
    }
    
    // Only allow deletion if dataset hasn't been processed yet
    if (dataset.status !== 'uploaded') {
      return false;
    }
    
    await DatasetModel.deleteOne({ datasetId });
    return true;
  }

  async processDataset(datasetId: string, userId: string): Promise<Dataset | null> {
    const dataset = await DatasetModel.findOne({ datasetId, userId });
    
    if (!dataset || dataset.status !== 'uploaded') {
      return null;
    }
    
    // Update dataset status to processing
    dataset.status = 'processing';
    await dataset.save();

    try {
      // Get the local file path based on S3 link
      const filePath = path.join('/tmp', path.basename(dataset.link));
      
      // Create a job for RabbitMQ
      const job: DatasetProcessingJob = {
        datasetId,
        userId,
        filePath
      };
      
      // Send job to processing queue
      const sent = await sendToQueue(QUEUES.DATASET_PROCESSING, job);
      
      if (!sent) {
        // If job couldn't be dispatched, revert status
        dataset.status = 'uploaded';
        await dataset.save();
        return null;
      }
      
      console.log(`Dispatched dataset ${datasetId} for processing via RabbitMQ`);
      return dataset;
      
    } catch (error) {
      console.error('Error dispatching dataset processing job:', error);
      // Revert status on error
      dataset.status = 'uploaded';
      await dataset.save();
      return null;
    }
  }

  async getRecords(
    datasetId: string, 
    userId: string, 
    limit = 10, 
    offset = 0
  ): Promise<RecordResponse[] | null> {
    // Verify dataset exists and belongs to user
    const dataset = await DatasetModel.findOne({ datasetId, userId });
    if (!dataset) return null;

    const records = await RecordModel.find({ datasetId })
      .sort({ index: 1 })
      .skip(offset)
      .limit(limit);

    return records.map(record => {
      const response: RecordResponse = {
        index: record.index,
        ...record.data
      };

      // Add changes and _changed fields if they exist
      for (const [key, value] of Object.entries(record.changes)) {
        response[`${key}_changed`] = true;
        response[`${key}_new`] = value;
      }

      return response;
    });
  }

  async submitReviewDecision(
    datasetId: string,
    userId: string,
    index: number,
    approved: boolean,
    comments?: string
  ): Promise<boolean> {
    // Verify dataset exists and belongs to user
    const dataset = await DatasetModel.findOne({ datasetId, userId });
    if (!dataset) return false;
    
    // Find the specific record
    const record = await RecordModel.findOne({ datasetId, index });
    if (!record) return false;
    
    // Update record with review decision
    record.reviewed = true;
    record.approved = approved;
    if (comments) record.comments = comments;
    
    await record.save();
    
    // Check if all records have been reviewed
    const totalRecords = await RecordModel.countDocuments({ datasetId });
    const reviewedRecords = await RecordModel.countDocuments({ datasetId, reviewed: true });
    
    if (reviewedRecords === totalRecords) {
      dataset.status = 'reviewing';
      await dataset.save();
    }
    
    return true;
  }

  async getReviewProgress(datasetId: string, userId: string): Promise<{ 
    totalRecords: number; 
    reviewedRecords: number; 
    progress: number; 
  } | null> {
    // Verify dataset exists and belongs to user
    const dataset = await DatasetModel.findOne({ datasetId, userId });
    if (!dataset) return null;
    
    const totalRecords = await RecordModel.countDocuments({ datasetId });
    const reviewedRecords = await RecordModel.countDocuments({ datasetId, reviewed: true });
    
    const progress = Math.floor((reviewedRecords / totalRecords) * 100);
    
    return {
      totalRecords,
      reviewedRecords,
      progress
    };
  }

  async completeReview(datasetId: string, userId: string): Promise<boolean> {
    // Verify dataset exists and belongs to user
    const dataset = await DatasetModel.findOne({ datasetId, userId });
    if (!dataset) return false;
    
    // Verify all records are reviewed
    const totalRecords = await RecordModel.countDocuments({ datasetId });
    const reviewedRecords = await RecordModel.countDocuments({ datasetId, reviewed: true });
    
    if (reviewedRecords < totalRecords) {
      return false;
    }
    
    // Update dataset status
    dataset.status = 'completed';
    await dataset.save();
    
    return true;
  }
}