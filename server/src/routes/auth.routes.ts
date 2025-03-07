// filepath: /Users/a/projects/data-cleaning-monorepo/server/src/routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes (no authentication required)
router.post('/login', authController.login.bind(authController));
router.post('/register', authController.register.bind(authController));

// Protected routes (authentication required)
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));

export default router;