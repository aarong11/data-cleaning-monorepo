import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DatasetService } from '../services/dataset.service';
import { uploadToS3, ensureUploadDir, generateUniqueFilename } from '../utils/file.utils';
import path from 'path';
import fs from 'fs';
import config from '../config';
import multer from 'multer';
import { DatasetStatus } from 'shared';

/**
 * Service instance for dataset operations
 */
const datasetService = new DatasetService();

// Configure multer for file uploads
ensureUploadDir();
/**
 * Storage configuration for multer
 */
const storage = multer.diskStorage({
  /**
   * Sets destination directory for uploaded files
   * @param _req - Express request object
   * @param _file - Uploaded file information
   * @param cb - Callback function
   */
  destination: (_req: Express.Request, _file: Express.Multer.File, cb) => {
    ensureUploadDir();
    cb(null, config.UPLOAD_DIR);
  },
  /**
   * Generates a unique filename for uploaded files
   * @param req - Express request object
   * @param file - Uploaded file information
   * @param cb - Callback function
   */
  filename: (req: Express.Request, file: Express.Multer.File, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  },
});

/**
 * Multer middleware configured for file uploads
 */
export const upload = multer({ storage });

/**
 * Controller for handling dataset-related operations
 */
export class DatasetController {
  /**
   * Uploads a new dataset file
   * @param req - Authenticated request containing user info and uploaded file
   * @param res - Express response object
   * @returns JSON response with dataset details or error message
   */
  async uploadDataset(req: AuthRequest, res: Response) {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      const { filename, path: filePath, size } = req.file;
      const { organizationId } = req.body;
      
      if (!organizationId) {
        res.status(400).json({ message: 'Organization ID is required' });
        return;
      }
      
      // Read file into buffer and upload to S3
      const fileBuffer = fs.readFileSync(filePath);
      const s3Link = await uploadToS3(fileBuffer, filename);

      // Create dataset record
      const dataset = await datasetService.createDataset(
        req.user.userId,
        organizationId,
        filename,
        size,
        s3Link
      );
      
      res.status(200).json({
        datasetId: dataset.datasetId,
        status: dataset.status,
        filename: dataset.filename,
        size: dataset.size,
        link: dataset.link,
        uploadedAt: dataset.uploadedAt.toISOString(),
        organizationId: dataset.organizationId
      });
    } catch (error) {
      console.error('Error uploading dataset:', error);
      res.status(500).json({ message: 'Failed to upload dataset' });
    }
  }

  /**
   * Lists datasets belonging to the authenticated user
   * @param req - Authenticated request containing user info and pagination parameters
   * @param res - Express response object
   * @returns JSON response with paginated list of datasets or error message
   */
  async listDatasets(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const datasets = await datasetService.getDatasetsByUserId(
        req.user.userId,
        limit,
        offset
      );
      
      res.status(200).json({
        datasets: datasets.map(dataset => ({
          datasetId: dataset.datasetId,
          status: dataset.status,
          filename: dataset.filename,
          size: dataset.size,
          link: dataset.link,
          uploadedAt: dataset.uploadedAt.toISOString(),
        })),
      });
    } catch (error) {
      console.error('Error listing datasets:', error);
      res.status(500).json({ message: 'Failed to list datasets' });
    }
  }

  /**
   * Retrieves detailed information about a specific dataset
   * @param req - Authenticated request containing user info and dataset ID
   * @param res - Express response object
   * @returns JSON response with dataset details or error message
   */
  async getDatasetDetails(req: AuthRequest, res: Response) {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { datasetId } = req.params;
      
      const dataset = await datasetService.getDatasetById(datasetId, req.user.userId);
      
      if (!dataset) {
        res.status(404).json({ message: 'Dataset not found' });
        return;
      }
      
      res.status(200).json({
        datasetId: dataset.datasetId,
        status: dataset.status,
        filename: dataset.filename,
        size: dataset.size,
        link: dataset.link,
        uploadedAt: dataset.uploadedAt.toISOString(),
        organizationId: dataset.organizationId
      });
    } catch (error) {
      console.error('Error getting dataset details:', error);
      res.status(500).json({ message: 'Failed to get dataset details' });
    }
  }

  /**
   * Deletes a dataset if it belongs to the authenticated user and hasn't been processed
   * @param req - Authenticated request containing user info and dataset ID
   * @param res - Express response object
   * @returns JSON response confirming deletion or error message
   */
  async deleteDataset(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { datasetId } = req.params;
      
      const success = await datasetService.deleteDatasetById(
        datasetId,
        req.user.userId
      );
      
      if (!success) {
        res.status(404).json({ 
          message: 'Dataset not found or cannot be deleted after processing' 
        });
        return;
      }
      
      res.status(200).json({ message: 'Dataset deleted successfully.' });
    } catch (error) {
      console.error('Error deleting dataset:', error);
      res.status(500).json({ message: 'Failed to delete dataset' });
    }
  }

  /**
   * Initiates data cleaning process for a dataset
   * @param req - Authenticated request containing user info and dataset ID
   * @param res - Express response object
   * @returns JSON response with processing status or error message
   */
  async processDataset(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { datasetId } = req.params;
      
      const dataset = await datasetService.processDataset(
        datasetId,
        req.user.userId
      );
      
      if (!dataset) {
        res.status(404).json({ 
          message: 'Dataset not found or already processed' 
        });
        return;
      }
      
      res.status(200).json({
        datasetId: dataset.datasetId,
        status: dataset.status,
        message: 'Dataset cleaning has started.',
      });
    } catch (error) {
      console.error('Error processing dataset:', error);
      res.status(500).json({ message: 'Failed to process dataset' });
    }
  }

  /**
   * Lists records from a dataset for review
   * @param req - Authenticated request containing user info, dataset ID, and pagination parameters
   * @param res - Express response object
   * @returns JSON response with paginated list of records or error message
   */
  async listRecords(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { datasetId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const records = await datasetService.getRecords(
        datasetId,
        req.user.userId,
        limit,
        offset
      );
      
      if (!records) {
        res.status(404).json({ message: 'Dataset not found' });
        return;
      }
      
      res.status(200).json({ records });
    } catch (error) {
      console.error('Error listing records:', error);
      res.status(500).json({ message: 'Failed to list records' });
    }
  }

  /**
   * Submits a review decision for a specific record in a dataset
   * @param req - Authenticated request containing user info, dataset ID, record index, and review decision
   * @param res - Express response object
   * @returns JSON response confirming submission or error message
   */
  async submitReviewDecision(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { datasetId, index } = req.params;
      const { approved, comments } = req.body;
      
      const success = await datasetService.submitReviewDecision(
        datasetId,
        req.user.userId,
        parseInt(index),
        approved,
        comments
      );
      
      if (!success) {
        res.status(404).json({ message: 'Dataset or record not found' });
        return;
      }
      
      res.status(200).json({ message: 'Review submitted successfully.' });
    } catch (error) {
      console.error('Error submitting review decision:', error);
      res.status(500).json({ message: 'Failed to submit review decision' });
    }
  }

  /**
   * Retrieves progress information about the dataset review process
   * @param req - Authenticated request containing user info and dataset ID
   * @param res - Express response object
   * @returns JSON response with review progress statistics or error message
   */
  async getReviewProgress(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { datasetId } = req.params;
      
      const progress = await datasetService.getReviewProgress(
        datasetId,
        req.user.userId
      );
      
      if (!progress) {
        res.status(404).json({ message: 'Dataset not found' });
        return;
      }
      
      res.status(200).json({
        datasetId,
        ...progress,
      });
    } catch (error) {
      console.error('Error getting review progress:', error);
      res.status(500).json({ message: 'Failed to get review progress' });
    }
  }

  /**
   * Completes the review process for a dataset if all records have been reviewed
   * @param req - Authenticated request containing user info and dataset ID
   * @param res - Express response object
   * @returns JSON response confirming completion or error message
   */
  async completeReview(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { datasetId } = req.params;
      
      const success = await datasetService.completeReview(
        datasetId,
        req.user.userId
      );
      
      if (!success) {
        res.status(400).json({ 
          message: 'Cannot complete review - some records are not reviewed yet' 
        });
        return;
      }
      
      res.status(200).json({ message: 'Review process completed successfully.' });
    } catch (error) {
      console.error('Error completing review:', error);
      res.status(500).json({ message: 'Failed to complete review' });
    }
  }

  /**
   * Downloads the dataset file
   * @param req - Authenticated request containing user info and dataset ID
   * @param res - Express response object
   * @returns File stream of the dataset for download or error message
   */
  async downloadDataset(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { datasetId } = req.params;
      
      const dataset = await datasetService.getDatasetById(datasetId, req.user.userId);
      
      if (!dataset) {
        res.status(404).json({ message: 'Dataset not found' });
        return;
      }

      // Set the appropriate headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${dataset.filename}"`);

      // Stream the file from S3
      try {
        const fileStream = await datasetService.getDatasetStream(datasetId, req.user.userId);
        fileStream.pipe(res);
      } catch (error) {
        console.error('Error streaming dataset:', error);
        res.status(500).json({ message: 'Failed to download dataset' });
      }
    } catch (error) {
      console.error('Error downloading dataset:', error);
      res.status(500).json({ message: 'Failed to download dataset' });
    }
  }
}