import { Request, Response, NextFunction } from 'express';
import { OrganizationModel } from 'shared';
import { AuthRequest } from './auth.middleware';

type OrgRoleType = 'admin' | 'editor' | 'viewer';

export const checkOrgRole = (requiredRole: OrgRoleType) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { organizationId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const organization = await OrganizationModel.findOne({ organizationId });
      if (!organization) {
        res.status(404).json({ message: 'Organization not found' });
        return;
      }

      const member = organization.members.find(m => m.userId === userId);
      if (!member) {
        res.status(403).json({ message: 'User is not a member of this organization' });
        return;
      }

      const roleHierarchy: Record<OrgRoleType, number> = {
        'admin': 2,
        'editor': 1,
        'viewer': 0
      };

      if (roleHierarchy[member.role] >= roleHierarchy[requiredRole]) {
        next();
        return;
      } 

      res.status(403).json({
        message: 'Insufficient permissions in this organization'
      });
      return;
    } catch (error) {
      res.status(500).json({ message: 'Error checking organization role', error: (error as Error).message });
      return;
    }
  };
};