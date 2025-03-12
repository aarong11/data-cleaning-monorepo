import { Router, RequestHandler } from 'express';
import { OrganizationController } from '../controllers/organization.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { checkOrgRole } from '../middleware/organization-role.middleware';
import { checkRole } from '../middleware/role.middleware';

const router = Router();
const controller = new OrganizationController();

// Apply auth middleware to all organization routes
router.use(authMiddleware);

// Admin-only routes
router.post('/', 
  checkRole('admin'),
  controller.createOrganization.bind(controller) as RequestHandler
);

// Public organization routes (just need to be authenticated)
router.get('/', controller.getAllOrganizations.bind(controller) as RequestHandler);

// Protected organization routes (need specific roles)
router.get('/:organizationId', 
  checkOrgRole('viewer'),
  controller.getOrganization.bind(controller) as RequestHandler
);

// Admin-only organization routes
router.post('/:organizationId/members',
  checkOrgRole('admin'),
  controller.addUserToOrganization.bind(controller) as RequestHandler
);

router.delete('/:organizationId/members/:userId',
  checkOrgRole('admin'),
  controller.removeUserFromOrganization.bind(controller) as RequestHandler
);

router.put('/:organizationId/members/:userId/role',
  checkOrgRole('admin'),
  controller.updateMemberRole.bind(controller) as RequestHandler
);

export default router;