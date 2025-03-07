import { Router, RequestHandler } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { AuthRequest } from '../middleware/auth.middleware';

const router = Router();
const controller = new OrganizationController();

// Apply auth middleware to all organization routes
router.use(authMiddleware);

// Organization CRUD routes
router.post('/', controller.createOrganization.bind(controller) as RequestHandler);
router.get('/', controller.getAllOrganizations.bind(controller) as RequestHandler);
router.get('/:organizationId', controller.getOrganization.bind(controller) as RequestHandler);

// Organization member management
router.post('/:organizationId/members', controller.addUserToOrganization.bind(controller) as RequestHandler);
router.delete('/:organizationId/members/:userId', controller.removeUserFromOrganization.bind(controller) as RequestHandler);

export default router;