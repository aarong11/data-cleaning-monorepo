import { v4 as uuidv4 } from 'uuid';
import { DatasetModel, RecordModel, OrganizationModel, Dataset as DatasetType, DatasetStatus, RecordResponse, Record as RecordType, DatasetProcessingJob, QUEUES } from 'shared';
import { parseCSV, processRecordsWithAI, getFileStreamFromS3 } from '../utils/file.utils';
import path from 'path';
import { sendToQueue } from '../config/rabbitmq';

/**
 * Service class responsible for dataset operations including creation, retrieval, 
 * processing, and review management
 */
export class DatasetService {
  /**
   * Checks if a user has permission to access a specific dataset
   * 
   * @param datasetId - The unique identifier of the dataset
   * @param userId - The unique identifier of the user
   * @returns Boolean indicating whether the user can access the dataset
   */
  private async canAccessDataset(datasetId: string, userId: string): Promise<boolean> {
    const dataset = await DatasetModel.findOne({ datasetId });
    if (!dataset) return false;

    // If user is the owner, they can access it
    if (dataset.userId === userId) return true;

    // Check if user is in the organization that owns the dataset
    const organization = await OrganizationModel.findOne({ 
      organizationId: dataset.organizationId,
      'members.userId': userId 
    });

    return !!organization;
  }

  /**
   * Creates a new dataset record in the database
   * 
   * @param userId - The ID of the user creating the dataset
   * @param organizationId - The organization the dataset belongs to
   * @param filename - The original filename of the dataset
   * @param size - The size of the file in bytes
   * @param link - The S3 link where the dataset is stored
   * @returns The created dataset object
   * @throws Error if the user doesn't belong to the specified organization
   */
  async createDataset(userId: string, organizationId: string, filename: string, size: number, link: string): Promise<DatasetType> {
    const datasetId = uuidv4();
    
    // Verify user belongs to organization
    const organization = await OrganizationModel.findOne({ 
      organizationId,
      'members.userId': userId 
    });
    
    if (!organization) {
      throw new Error('User does not belong to the specified organization');
    }
    
    const dataset = new DatasetModel({
      datasetId,
      userId,
      organizationId,
      filename,
      size,
      link,
      status: 'uploaded' as DatasetStatus,
      uploadedAt: new Date()
    });

    await dataset.save();
    return dataset;
  }

  /**
   * Retrieves datasets accessible to a specific user with pagination
   * 
   * @param userId - The ID of the user
   * @param limit - Maximum number of datasets to return (default: 10)
   * @param offset - Number of datasets to skip (default: 0)
   * @returns Array of dataset objects
   */
  async getDatasetsByUserId(userId: string, limit = 10, offset = 0): Promise<DatasetType[]> {
    // Get user's organizations
    const organizations = await OrganizationModel.find({ 'members.userId': userId });
    const orgIds = organizations.map(org => org.organizationId);

    // Find datasets where user is either owner or member of the organization
    return DatasetModel.find({
      $or: [
        { userId },
        { organizationId: { $in: orgIds } }
      ]
    })
      .sort({ uploadedAt: -1 })
      .skip(offset)
      .limit(limit);
  }

  /**
   * Retrieves a specific dataset if the user has access to it
   * 
   * @param datasetId - The ID of the dataset to retrieve
   * @param userId - The ID of the user making the request
   * @returns The dataset object if found and accessible, null otherwise
   */
  async getDatasetById(datasetId: string, userId: string): Promise<DatasetType | null> {
    if (!await this.canAccessDataset(datasetId, userId)) {
      return null;
    }
    return DatasetModel.findOne({ datasetId });
  }

  /**
   * Deletes a dataset if it's in the 'uploaded' state and the user has access
   * 
   * @param datasetId - The ID of the dataset to delete
   * @param userId - The ID of the user making the delete request
   * @returns Boolean indicating success or failure
   */
  async deleteDatasetById(datasetId: string, userId: string): Promise<boolean> {
    const dataset = await DatasetModel.findOne({ datasetId });
    
    if (!dataset) {
      return false;
    }
    
    // Only allow deletion if dataset hasn't been processed yet
    if (dataset.status !== 'uploaded') {
      return false;
    }

    // Verify access rights
    if (!await this.canAccessDataset(datasetId, userId)) {
      return false;
    }
    
    await DatasetModel.deleteOne({ datasetId });
    return true;
  }

  /**
   * Starts the processing of a dataset by sending a job to the processing queue
   * 
   * @param datasetId - The ID of the dataset to process
   * @param userId - The ID of the user making the request
   * @returns The updated dataset object if processing was initiated, null otherwise
   */
  async processDataset(datasetId: string, userId: string): Promise<DatasetType | null> {
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

  /**
   * Retrieves records from a dataset with pagination
   * 
   * @param datasetId - The ID of the dataset
   * @param userId - The ID of the user making the request
   * @param limit - Maximum number of records to return (default: 10)
   * @param offset - Number of records to skip (default: 0)
   * @returns Array of record objects with transformation data or null if access denied
   */
  async getRecords(
    datasetId: string, 
    userId: string, 
    limit = 10, 
    offset = 0
  ): Promise<RecordResponse[] | null> {
    // Verify dataset access rights
    if (!await this.canAccessDataset(datasetId, userId)) {
      return null;
    }

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

  /**
   * Submits a review decision for a specific record in a dataset
   * 
   * @param datasetId - The ID of the dataset
   * @param userId - The ID of the user submitting the review
   * @param index - The index of the record being reviewed
   * @param approved - Whether the record is approved or rejected
   * @param comments - Optional comments for the review decision
   * @returns Boolean indicating success or failure
   */
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

  /**
   * Gets the progress of the review process for a dataset
   * 
   * @param datasetId - The ID of the dataset
   * @param userId - The ID of the user requesting progress
   * @returns Object with progress statistics or null if access is denied
   */
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

  /**
   * Completes the review process for a dataset if all records have been reviewed
   * 
   * @param datasetId - The ID of the dataset
   * @param userId - The ID of the user completing the review
   * @returns Boolean indicating success or failure
   */
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

  /**
   * Creates a readable stream for downloading a dataset file
   * 
   * @param datasetId - The ID of the dataset
   * @param userId - The ID of the user requesting the download
   * @returns A readable stream of the dataset file
   * @throws Error if access is denied or dataset is not found
   */
  async getDatasetStream(datasetId: string, userId: string): Promise<NodeJS.ReadableStream> {
    if (!await this.canAccessDataset(datasetId, userId)) {
      throw new Error('Unauthorized access to dataset');
    }

    const dataset = await DatasetModel.findOne({ datasetId });
    if (!dataset) {
      throw new Error('Dataset not found');
    }

    // Get stream from S3
    return await getFileStreamFromS3(dataset.link);
  }
}