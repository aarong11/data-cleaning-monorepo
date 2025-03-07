import { Router } from 'express';
import datasetRoutes from './dataset.routes';
import authRoutes from './auth.routes';

const router = Router();

// API Routes
router.use('/api/auth', authRoutes);
router.use('/api/datasets', datasetRoutes);

export default router;