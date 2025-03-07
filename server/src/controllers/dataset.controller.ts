import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { DatasetService } from '../services/dataset.service';
import { uploadToS3, ensureUploadDir, generateUniqueFilename } from '../utils/file.utils';
import path from 'path';
import fs from 'fs';
import config from '../config';
import multer from 'multer';

const datasetService = new DatasetService();

// Configure multer for file uploads
ensureUploadDir();
const storage = multer.diskStorage({
  destination: (_req: Express.Request, _file: Express.Multer.File, cb) => {
    ensureUploadDir();
    cb(null, config.UPLOAD_DIR);
  },
  filename: (req: Express.Request, file: Express.Multer.File, cb) => {
    const uniqueName = generateUniqueFilename(file.originalname);
    cb(null, uniqueName);
  },
});

export const upload = multer({ storage });

export class DatasetController {
  // Upload a new dataset
  async uploadDataset(req: AuthRequest, res: Response): Promise<void> {
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
      
      // Read file into buffer and upload to S3
      const fileBuffer = fs.readFileSync(filePath);
      const s3Link = await uploadToS3(fileBuffer, filename);
      
      // Create dataset record
      const dataset = await datasetService.createDataset(
        req.user.userId,
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
      });
    } catch (error) {
      console.error('Error uploading dataset:', error);
      res.status(500).json({ message: 'Failed to upload dataset' });
    }
  }

  // List user's datasets
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

  // Get dataset details
  async getDatasetDetails(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const { datasetId } = req.params;
      
      const dataset = await datasetService.getDatasetById(datasetId);
      
      if (!dataset || dataset.userId !== req.user.userId) {
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
      });
    } catch (error) {
      console.error('Error getting dataset details:', error);
      res.status(500).json({ message: 'Failed to get dataset details' });
    }
  }

  // Delete a dataset
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

  // Process dataset
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

  // List records for review
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

  // Submit review decision for a record
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

  // Get review progress
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

  // Complete review process
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
}