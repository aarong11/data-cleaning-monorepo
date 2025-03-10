import * as sinon from 'sinon';
import { Response } from 'express';
import { expect } from '../../test-config'; // Use our configured chai with sinon-chai
import { OrganizationController } from '../../../src/controllers/organization.controller';
import { OrganizationService, UserResponse, OrganizationResponse } from '../../../src/services/organization.service';
import { AuthRequest } from '../../../src/middleware/auth.middleware';

describe('OrganizationController', () => {
  let controller: OrganizationController;
  let serviceMock: sinon.SinonStubbedInstance<OrganizationService>;
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    // Create a stubbed instance of the OrganizationService
    serviceMock = sinon.createStubInstance(OrganizationService);
    
    // Replace the real service with our mock in the controller
    // @ts-ignore: Using private property for testing
    controller = new OrganizationController();
    // @ts-ignore: Directly replacing the service instance for testing
    controller['organizationService'] = serviceMock;
    
    // Setup request and response objects with proper user type including role
    req = {
      user: { 
        userId: 'test-user-id', 
        email: 'test@example.com',
        role: 'admin' // Adding the required role property
      },
      body: {},
      params: {}
    };
    
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createOrganization', () => {
    it('should return 401 if user is not authenticated', async () => {
      // Setup
      req.user = undefined;
      
      // Execute
      await controller.createOrganization(req as AuthRequest, res as Response);
      
      // Verify
      expect(res.status).to.have.been.calledWith(401);
      expect(res.json).to.have.been.calledWith({ 
        message: 'Unauthorized - User not found in request' 
      });
    });

    it('should create organization and return 201 on success', async () => {
      // Setup
      const organizationData = {
        organizationName: 'Test Org',
        organizationDescription: 'Test Description'
      };
      
      // Create a properly typed OrganizationResponse using the service's types
      const expectedOrg: OrganizationResponse = {
        organizationId: 'test-org-id',
        organizationName: 'Test Org',
        organizationDescription: 'Test Description',
        createdAt: new Date(),
        members: [{
          userId: 'test-user-id',
          email: 'test@example.com',
          role: 'admin',
          organizationRole: 'admin'
        }]
      };
      
      req.body = organizationData;
      serviceMock.createOrganization.resolves(expectedOrg);
      
      // Execute
      await controller.createOrganization(req as AuthRequest, res as Response);
      
      // Verify
      expect(serviceMock.createOrganization).to.have.been.calledWith(
        organizationData, 
        'test-user-id'
      );
      expect(res.status).to.have.been.calledWith(201);
      expect(res.json).to.have.been.calledWith(expectedOrg);
    });

    it('should return 500 on error', async () => {
      // Setup
      const error = new Error('Database error');
      serviceMock.createOrganization.rejects(error);
      
      // Execute
      await controller.createOrganization(req as AuthRequest, res as Response);
      
      // Verify
      expect(res.status).to.have.been.calledWith(500);
      expect(res.json).to.have.been.calledWith({ 
        message: 'Error creating organization',
        error: error.message 
      });
    });
  });

  describe('getOrganization', () => {
    it('should return organization on success', async () => {
      // Setup
      const organizationId = 'test-org-id';
      const expectedOrg: OrganizationResponse = {
        organizationId,
        organizationName: 'Test Org',
        organizationDescription: 'Test Description',
        createdAt: new Date(),
        members: [] // Empty members array
      };
      
      req.params = { organizationId };
      serviceMock.getOrganizationById.resolves(expectedOrg);
      
      // Execute
      await controller.getOrganization(req as AuthRequest, res as Response);
      
      // Verify
      expect(serviceMock.getOrganizationById).to.have.been.calledWith(organizationId);
      expect(res.json).to.have.been.calledWith(expectedOrg);
    });

    it('should return 404 when organization not found', async () => {
      // Setup
      const error = new Error('Organization not found');
      req.params = { organizationId: 'non-existent-id' };
      serviceMock.getOrganizationById.rejects(error);
      
      // Execute
      await controller.getOrganization(req as AuthRequest, res as Response);
      
      // Verify
      expect(res.status).to.have.been.calledWith(404);
      expect(res.json).to.have.been.calledWith({
        message: 'Organization not found',
        error: error.message
      });
    });
  });

  describe('getAllOrganizations', () => {
    it('should return all organizations on success', async () => {
      // Setup
      const expectedOrgs = [
        {
          organizationId: 'org-1',
          organizationName: 'Org 1',
          organizationDescription: 'Description 1',
          createdAt: new Date(),
          members: []
        },
        {
          organizationId: 'org-2',
          organizationName: 'Org 2',
          organizationDescription: 'Description 2',
          createdAt: new Date(),
          members: []
        }
      ];
      
      serviceMock.getAllOrganizations.resolves(expectedOrgs);
      
      // Execute
      await controller.getAllOrganizations(req as AuthRequest, res as Response);
      
      // Verify
      expect(serviceMock.getAllOrganizations).to.have.been.called;
      expect(res.json).to.have.been.calledWith(expectedOrgs);
    });

    it('should return 500 on error', async () => {
      // Setup
      const error = new Error('Database error');
      serviceMock.getAllOrganizations.rejects(error);
      
      // Execute
      await controller.getAllOrganizations(req as AuthRequest, res as Response);
      
      // Verify
      expect(res.status).to.have.been.calledWith(500);
      expect(res.json).to.have.been.calledWith({
        message: 'Error fetching organizations',
        error: error.message
      });
    });
  });

  describe('addUserToOrganization', () => {
    it('should add a user to organization and return updated organization', async () => {
      // Setup
      const organizationId = 'test-org-id';
      const memberData = {
        email: 'newmember@example.com',
        role: 'editor' as const
      };
      
      const expectedOrg: OrganizationResponse = {
        organizationId,
        organizationName: 'Test Org',
        organizationDescription: 'Test Description',
        createdAt: new Date(),
        members: [
          {
            userId: 'test-user-id',
            email: 'test@example.com',
            role: 'admin',
            organizationRole: 'admin'
          },
          {
            userId: 'new-user-id',
            email: 'newmember@example.com',
            role: 'editor',
            organizationRole: 'editor'
          }
        ]
      };
      
      req.params = { organizationId };
      req.body = memberData;
      serviceMock.addUserToOrganization.resolves(expectedOrg);
      
      // Execute
      await controller.addUserToOrganization(req as AuthRequest, res as Response);
      
      // Verify
      expect(serviceMock.addUserToOrganization).to.have.been.calledWith(organizationId, memberData);
      expect(res.json).to.have.been.calledWith(expectedOrg);
    });

    it('should return 400 on error', async () => {
      // Setup
      const error = new Error('User not found');
      req.params = { organizationId: 'test-org-id' };
      req.body = { email: 'nonexistent@example.com', role: 'editor' };
      serviceMock.addUserToOrganization.rejects(error);
      
      // Execute
      await controller.addUserToOrganization(req as AuthRequest, res as Response);
      
      // Verify
      expect(res.status).to.have.been.calledWith(400);
      expect(res.json).to.have.been.calledWith({
        message: 'Error adding user to organization',
        error: error.message
      });
    });
  });

  describe('removeUserFromOrganization', () => {
    it('should remove a user from organization and return updated organization', async () => {
      // Setup
      const organizationId = 'test-org-id';
      const userId = 'user-to-remove';
      
      const expectedOrg: OrganizationResponse = {
        organizationId,
        organizationName: 'Test Org',
        organizationDescription: 'Test Description',
        createdAt: new Date(),
        members: [
          {
            userId: 'test-user-id',
            email: 'test@example.com',
            role: 'admin',
            organizationRole: 'admin'
          }
        ]
      };
      
      req.params = { organizationId, userId };
      serviceMock.removeUserFromOrganization.resolves(expectedOrg);
      
      // Execute
      await controller.removeUserFromOrganization(req as AuthRequest, res as Response);
      
      // Verify
      expect(serviceMock.removeUserFromOrganization).to.have.been.calledWith(organizationId, userId);
      expect(res.json).to.have.been.calledWith(expectedOrg);
    });

    it('should return 400 on error', async () => {
      // Setup
      const error = new Error('User not found in organization');
      req.params = { organizationId: 'test-org-id', userId: 'non-member-id' };
      serviceMock.removeUserFromOrganization.rejects(error);
      
      // Execute
      await controller.removeUserFromOrganization(req as AuthRequest, res as Response);
      
      // Verify
      expect(res.status).to.have.been.calledWith(400);
      expect(res.json).to.have.been.calledWith({
        message: 'Error removing user from organization',
        error: error.message
      });
    });
  });

  describe('updateMemberRole', () => {
    it('should update a member role and return updated organization', async () => {
      // Setup
      const organizationId = 'test-org-id';
      const userId = 'member-to-update';
      const newRole = 'editor' as const;
      
      const expectedOrg: OrganizationResponse = {
        organizationId,
        organizationName: 'Test Org',
        organizationDescription: 'Test Description',
        createdAt: new Date(),
        members: [
          {
            userId: 'test-user-id',
            email: 'test@example.com',
            role: 'admin',
            organizationRole: 'admin'
          },
          {
            userId: 'member-to-update',
            email: 'member@example.com',
            role: 'editor',
            organizationRole: 'editor'
          }
        ]
      };
      
      req.params = { organizationId, userId };
      req.body = { role: newRole };
      serviceMock.updateMemberRole.resolves(expectedOrg);
      
      // Execute
      await controller.updateMemberRole(req as AuthRequest, res as Response);
      
      // Verify
      expect(serviceMock.updateMemberRole).to.have.been.calledWith(organizationId, userId, newRole);
      expect(res.json).to.have.been.calledWith(expectedOrg);
    });

    it('should return 400 when invalid role is specified', async () => {
      // Setup
      req.params = { organizationId: 'test-org-id', userId: 'member-id' };
      req.body = { role: 'invalid-role' };
      
      // Execute
      await controller.updateMemberRole(req as AuthRequest, res as Response);
      
      // Verify
      expect(res.status).to.have.been.calledWith(400);
      expect(res.json).to.have.been.calledWith({
        message: 'Invalid role specified'
      });
      expect(serviceMock.updateMemberRole).not.to.have.been.called;
    });

    it('should return 400 on error', async () => {
      // Setup
      const error = new Error('User is not a member of this organization');
      req.params = { organizationId: 'test-org-id', userId: 'non-member-id' };
      req.body = { role: 'viewer' };
      serviceMock.updateMemberRole.rejects(error);
      
      // Execute
      await controller.updateMemberRole(req as AuthRequest, res as Response);
      
      // Verify
      expect(res.status).to.have.been.calledWith(400);
      expect(res.json).to.have.been.calledWith({
        message: 'Error updating member role',
        error: error.message
      });
    });
  });
});