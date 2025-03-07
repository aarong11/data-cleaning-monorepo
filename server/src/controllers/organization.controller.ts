import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { OrganizationService, CreateOrganizationRequest } from '../services/organization.service';

const organizationService = new OrganizationService();

export class OrganizationController {
  async createOrganization(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized - User not found in request' });
      }
      const organizationData: CreateOrganizationRequest = req.body;
      const organization = await organizationService.createOrganization(organizationData, req.user.userId);
      res.status(201).json(organization);
    } catch (error) {
      res.status(500).json({ message: 'Error creating organization', error: (error as Error).message });
    }
  }

  async getOrganization(req: AuthRequest, res: Response) {
    try {
      const { organizationId } = req.params;
      const organization = await organizationService.getOrganizationById(organizationId);
      res.json(organization);
    } catch (error) {
      res.status(404).json({ message: 'Organization not found', error: (error as Error).message });
    }
  }

  async getAllOrganizations(_req: AuthRequest, res: Response) {
    try {
      const organizations = await organizationService.getAllOrganizations();
      res.json(organizations);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching organizations', error: (error as Error).message });
    }
  }

  async addUserToOrganization(req: AuthRequest, res: Response) {
    try {
      const { organizationId } = req.params;
      const { email } = req.body;
      const organization = await organizationService.addUserToOrganization(organizationId, email);
      res.json(organization);
    } catch (error) {
      res.status(400).json({ message: 'Error adding user to organization', error: (error as Error).message });
    }
  }

  async removeUserFromOrganization(req: AuthRequest, res: Response) {
    try {
      const { organizationId, userId } = req.params;
      const organization = await organizationService.removeUserFromOrganization(organizationId, userId);
      res.json(organization);
    } catch (error) {
      res.status(400).json({ message: 'Error removing user from organization', error: (error as Error).message });
    }
  }
}