import { Router } from 'express';
import datasetRoutes from './dataset.routes';
import authRoutes from './auth.routes';
import organizationRoutes from './organization.routes';

const router = Router();

// API Routes
router.use('/api/auth', authRoutes);
router.use('/api/datasets', datasetRoutes);
router.use('/api/organizations', organizationRoutes);

export default router;