import { Router } from 'express';
import datasetRoutes from './dataset.routes';

const router = Router();

// API Routes
router.use('/api/datasets', datasetRoutes);

export default router;