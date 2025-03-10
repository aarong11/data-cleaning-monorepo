import { assert, expect } from 'chai';
import mongoose from 'mongoose';
import { UserModel, OrganizationModel } from 'shared';
import { 
  setupTestDB, 
  teardownTestDB, 
  createTestUser, 
  authenticatedRequest 
} from '../setup';

describe('Organization Routes Integration Tests', () => {
  // Auth token and user data for testing
  let authToken: string;
  let testUserId: string;
  let secondUserId: string;
  let secondUserToken: string;
  
  before(async () => {
    // Setup test database
    await setupTestDB();
    
    // Create test users
    const testUser = await createTestUser({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });
    
    const secondUser = await createTestUser({
      email: 'another@example.com',
      password: 'password123',
      name: 'Another User'
    });
    
    authToken = testUser.token;
    testUserId = testUser.user.userId;
    secondUserId = secondUser.user.userId;
    secondUserToken = secondUser.token;
  });
  
  after(async () => {
    // Clean up test database
    await teardownTestDB();
  });
  
  beforeEach(async () => {
    // Clean organization collection before each test
    await OrganizationModel.deleteMany({});
  });
  
  describe('POST /api/organizations', () => {
    it('should create a new organization', async () => {
      const orgData = {
        organizationName: 'Test Org',
        organizationDescription: 'Test Description'
      };
      
      const response = await authenticatedRequest(authToken)
        .post('/api/organizations')
        .send(orgData);
        
      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('organizationId');
      expect(response.body.organizationName).to.equal(orgData.organizationName);
      expect(response.body.organizationDescription).to.equal(orgData.organizationDescription);
      expect(response.body.members).to.have.lengthOf(1);
      expect(response.body.members[0].userId).to.equal(testUserId);
      expect(response.body.members[0].organizationRole).to.equal('admin');
      
      // Verify user is linked to organization
      const user = await UserModel.findOne({ userId: testUserId });
      expect(user?.organizations).to.include(response.body.organizationId);
    });
    
    it('should return 401 if not authenticated', async () => {
      const orgData = {
        organizationName: 'Test Org',
        organizationDescription: 'Test Description'
      };
      
      const response = await authenticatedRequest('')
        .post('/api/organizations')
        .send(orgData);
        
      expect(response.status).to.equal(401);
    });
  });
  
  describe('GET /api/organizations/:organizationId', () => {
    let organizationId: string;
    
    beforeEach(async () => {
      // Create a test organization for each test
      const orgData = {
        organizationName: 'Get Test Org',
        organizationDescription: 'Get Test Description'
      };
      
      const response = await authenticatedRequest(authToken)
        .post('/api/organizations')
        .send(orgData);
        
      organizationId = response.body.organizationId;
    });
    
    it('should get organization by id', async () => {
      const response = await authenticatedRequest(authToken)
        .get(`/api/organizations/${organizationId}`);
        
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('organizationId', organizationId);
      expect(response.body.organizationName).to.equal('Get Test Org');
      expect(response.body.members).to.have.lengthOf(1);
    });
    
    it('should return 404 for non-existent organization', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const response = await authenticatedRequest(authToken)
        .get(`/api/organizations/${nonExistentId}`);
        
      expect(response.status).to.equal(404);
    });
  });
  
  describe('GET /api/organizations', () => {
    beforeEach(async () => {
      // Create multiple test organizations
      const orgData1 = {
        organizationName: 'Org 1',
        organizationDescription: 'Description 1'
      };
      
      const orgData2 = {
        organizationName: 'Org 2',
        organizationDescription: 'Description 2'
      };
      
      await authenticatedRequest(authToken).post('/api/organizations').send(orgData1);
      await authenticatedRequest(authToken).post('/api/organizations').send(orgData2);
    });
    
    it('should get all organizations', async () => {
      const response = await authenticatedRequest(authToken)
        .get('/api/organizations');
        
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.lengthOf(2);
      expect(response.body[0]).to.have.property('organizationName');
      expect(response.body[1]).to.have.property('organizationName');
    });
  });

  describe('POST /api/organizations/:organizationId/members', () => {
    let organizationId: string;
    
    beforeEach(async () => {
      // Create a test organization for this test suite
      const orgData = {
        organizationName: 'Member Test Org',
        organizationDescription: 'For testing member management'
      };
      
      const response = await authenticatedRequest(authToken)
        .post('/api/organizations')
        .send(orgData);
        
      organizationId = response.body.organizationId;
    });
    
    it('should add a user to organization', async () => {
      const memberData = {
        email: 'another@example.com',  // This is the second test user
        role: 'editor'
      };
      
      const response = await authenticatedRequest(authToken)
        .post(`/api/organizations/${organizationId}/members`)
        .send(memberData);
        
      expect(response.status).to.equal(200);
      expect(response.body.members).to.have.lengthOf(2);
      
      // Find the added member
      const addedMember = response.body.members.find(
        (m: any) => m.email === 'another@example.com'
      );
      expect(addedMember).to.exist;
      expect(addedMember.organizationRole).to.equal('editor');
      
      // Verify user record is updated
      const user = await UserModel.findOne({ userId: secondUserId });
      expect(user?.organizations).to.include(organizationId);
    });
    
    it('should return 400 when adding non-existent user', async () => {
      const memberData = {
        email: 'nonexistent@example.com',
        role: 'viewer'
      };
      
      const response = await authenticatedRequest(authToken)
        .post(`/api/organizations/${organizationId}/members`)
        .send(memberData);
        
      expect(response.status).to.equal(400);
    });
    
    it('should return 400 when adding user who is already a member', async () => {
      // First add the user
      const memberData = {
        email: 'another@example.com',
        role: 'editor'
      };
      
      await authenticatedRequest(authToken)
        .post(`/api/organizations/${organizationId}/members`)
        .send(memberData);
        
      // Try to add the same user again
      const response = await authenticatedRequest(authToken)
        .post(`/api/organizations/${organizationId}/members`)
        .send(memberData);
        
      expect(response.status).to.equal(400);
    });
  });
  
  describe('DELETE /api/organizations/:organizationId/members/:userId', () => {
    let organizationId: string;
    
    beforeEach(async () => {
      // Create a test organization
      const orgData = {
        organizationName: 'Remove Member Test Org',
        organizationDescription: 'For testing member removal'
      };
      
      const createResponse = await authenticatedRequest(authToken)
        .post('/api/organizations')
        .send(orgData);
        
      organizationId = createResponse.body.organizationId;
      
      // Add the second user as a member
      const memberData = {
        email: 'another@example.com',
        role: 'editor'
      };
      
      await authenticatedRequest(authToken)
        .post(`/api/organizations/${organizationId}/members`)
        .send(memberData);
    });
    
    it('should remove a user from organization', async () => {
      const response = await authenticatedRequest(authToken)
        .delete(`/api/organizations/${organizationId}/members/${secondUserId}`);
        
      expect(response.status).to.equal(200);
      expect(response.body.members).to.have.lengthOf(1);
      expect(response.body.members[0].userId).to.equal(testUserId);
      
      // Verify user is no longer associated with organization
      const user = await UserModel.findOne({ userId: secondUserId });
      expect(user?.organizations).to.not.include(organizationId);
    });
    
    it('should return 400 when removing non-member user', async () => {
      // Use a different non-existent userId
      const nonMemberId = new mongoose.Types.ObjectId().toString();
      
      const response = await authenticatedRequest(authToken)
        .delete(`/api/organizations/${organizationId}/members/${nonMemberId}`);
        
      expect(response.status).to.equal(400);
    });
  });
  
  describe('PUT /api/organizations/:organizationId/members/:userId/role', () => {
    let organizationId: string;
    
    beforeEach(async () => {
      // Create a test organization
      const orgData = {
        organizationName: 'Role Update Test Org',
        organizationDescription: 'For testing role updates'
      };
      
      const createResponse = await authenticatedRequest(authToken)
        .post('/api/organizations')
        .send(orgData);
        
      organizationId = createResponse.body.organizationId;
      
      // Add the second user as a member with 'viewer' role
      const memberData = {
        email: 'another@example.com',
        role: 'viewer'
      };
      
      await authenticatedRequest(authToken)
        .post(`/api/organizations/${organizationId}/members`)
        .send(memberData);
    });
    
    it('should update user role in organization', async () => {
      const response = await authenticatedRequest(authToken)
        .put(`/api/organizations/${organizationId}/members/${secondUserId}/role`)
        .send({ role: 'admin' });
        
      expect(response.status).to.equal(200);
      
      // Find the updated member
      const updatedMember = response.body.members.find(
        (m: any) => m.userId === secondUserId
      );
      expect(updatedMember).to.exist;
      expect(updatedMember.organizationRole).to.equal('admin');
    });
    
    it('should return 400 when updating with invalid role', async () => {
      const response = await authenticatedRequest(authToken)
        .put(`/api/organizations/${organizationId}/members/${secondUserId}/role`)
        .send({ role: 'invalid-role' });
        
      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('message', 'Invalid role specified');
    });
    
    it('should return 400 when updating role of non-member', async () => {
      // Use a different non-existent userId
      const nonMemberId = new mongoose.Types.ObjectId().toString();
      
      const response = await authenticatedRequest(authToken)
        .put(`/api/organizations/${organizationId}/members/${nonMemberId}/role`)
        .send({ role: 'admin' });
        
      expect(response.status).to.equal(400);
    });
  });
});