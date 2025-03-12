import { Router } from 'express';
import { DatasetController, upload } from '../controllers/dataset.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const datasetController = new DatasetController();

// All routes require authentication
router.use(authMiddleware as any);

// Upload a new dataset
router.post('/upload', upload.single('file'), datasetController.uploadDataset.bind(datasetController));

// List user's datasets
router.get('/', datasetController.listDatasets.bind(datasetController));

// Get dataset details
router.get('/:datasetId', datasetController.getDatasetDetails.bind(datasetController));

// Delete a dataset
router.delete('/:datasetId', datasetController.deleteDataset.bind(datasetController));

// Process a dataset
router.post('/:datasetId/process', datasetController.processDataset.bind(datasetController));

// List records for review
router.get('/:datasetId/records', datasetController.listRecords.bind(datasetController));

// Submit review decision
router.post('/:datasetId/records/:index/review', datasetController.submitReviewDecision.bind(datasetController));

// Get review progress
router.get('/:datasetId/progress', datasetController.getReviewProgress.bind(datasetController));

// Complete review
router.post('/:datasetId/complete', datasetController.completeReview.bind(datasetController));

// Download dataset
router.get('/:datasetId/download', datasetController.downloadDataset.bind(datasetController));

export default router;