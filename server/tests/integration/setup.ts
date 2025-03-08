import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/index';
import supertest from 'supertest';
import * as rabbitmq from '../../src/config/rabbitmq';

// Mock RabbitMQ functions
jest.mock('../../src/config/rabbitmq', () => ({
  initRabbitMQ: jest.fn().mockResolvedValue(undefined),
  closeRabbitMQ: jest.fn().mockResolvedValue(undefined),
  publishToQueue: jest.fn().mockResolvedValue(undefined),
}));

// Create a supertest client
export const request = supertest(app);

let mongoServer: MongoMemoryServer;

// Setup before all tests
export const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
};

// Cleanup after all tests
export const teardownTestDB = async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
};

// Create a test user and return auth token
export const createTestUser = async (userData = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
}) => {
  // Register user
  const registerResponse = await request.post('/api/auth/register')
    .send(userData);
  
  // Return token from registration or login if needed
  return {
    user: registerResponse.body.user,
    token: registerResponse.body.token
  };
};

// Helper to create authenticated request
export const authenticatedRequest = (token: string) => {
  return {
    get: (url: string) => request.get(url).set('Authorization', `Bearer ${token}`),
    post: (url: string) => request.post(url).set('Authorization', `Bearer ${token}`),
    put: (url: string) => request.put(url).set('Authorization', `Bearer ${token}`),
    delete: (url: string) => request.delete(url).set('Authorization', `Bearer ${token}`)
  };
};

// Helper for creating test organizations
export const createTestOrganization = async (token: string, orgData = {
  name: 'Test Organization',
  description: 'Test Organization Description'
}) => {
  const response = await request
    .post('/api/organizations')
    .set('Authorization', `Bearer ${token}`)
    .send(orgData);
    
  return response.body;
};