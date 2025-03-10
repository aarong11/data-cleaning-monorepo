export * from './dataset.types';
export * from './record.types';
export * from './review.types';
export * from './queue.types';
export * from './auth.types';

// Organization types
export interface Organization {
  organizationId: string;
  organizationName: string;
  organizationDescription: string;
  members: { userId: string; role: 'admin' | 'editor' | 'viewer' }[];
  createdAt: Date;
}

export interface OrganizationResponse extends Omit<Organization, 'members'> {
  members: (UserResponse & { role: 'admin' | 'editor' | 'viewer' })[];
}

export interface CreateOrganizationRequest {
  organizationName: string;
  organizationDescription: string;
}

// User related types
export interface User {
  userId: string;
  email: string;
  password: string; // Hashed password
  role: 'admin' | 'manager' | 'editor' | 'viewer' | 'dataCleaner';
  createdAt: Date;
  lastLoginAt?: Date;
  organizations: string[]; // Array of organization IDs the user belongs to
}

// Enhanced UserResponse with organization info
export interface UserOrganization {
  organizationId: string;
  organizationName: string;
  organizationDescription: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface UserResponse {
  userId: string;
  email: string;
  role: 'admin' | 'manager' | 'editor' | 'viewer' | 'dataCleaner';  // Using the strict role type from User interface
  organizations?: UserOrganization[]; // List of organizations the user belongs to
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: string;
}

// Add organizationId to Dataset interface
export interface Dataset {
  datasetId: string;
  status: string;
  filename: string;
  size: number;
  link: string;
  uploadedAt: Date;
  userId: string;
  organizationId: string;
}