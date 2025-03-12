import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthResponse, LoginRequest, RegisterRequest, UserResponse, UserModel, UserOrganization, OrganizationModel } from 'shared';
import config from '../config';

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse | null> {
    try {
      // Check if the user already exists
      const existingUser = await UserModel.findOne({ email: userData.email });
      if (existingUser) {
        return null;
      }

      // Create a new user
      const user = new UserModel({
        userId: uuidv4(),
        email: userData.email,
        password: userData.password,
        role: userData.role || 'viewer', // Changed from 'user' to 'viewer' to match schema enum values
        createdAt: new Date()
      });

      // Save the user to database
      await user.save();

      // Generate JWT token using userId
      const token = this.generateToken(user.userId, user.email);

      // Return user info and token
      return {
        token,
        user: {
          userId: user.userId,
          email: user.email,
          role: user.role,
          organizations: [] // New user has no organizations initially
        }
      };
    } catch (error) {
      console.error('Error registering user:', error);
      return null;
    }
  }

  /**
   * Login a user
   */
  async login(loginData: LoginRequest): Promise<AuthResponse | null> {
    try {
      // Find the user by email
      const user = await UserModel.findOne({ email: loginData.email });
      if (!user) {
        return null;
      }

      // Check if the password is correct
      const isPasswordValid = await user.comparePassword(loginData.password);
      if (!isPasswordValid) {
        return null;
      }

      // Update last login time
      user.lastLoginAt = new Date();
      await user.save();

      // Generate JWT token using userId
      const token = this.generateToken(user.userId, user.email);

      // Get user's organizations
      const userOrgs = await this.getUserOrganizations(user.userId);

      // Return user info and token
      return {
        token,
        user: {
          userId: user.userId,
          email: user.email,
          role: user.role,
          organizations: userOrgs
        }
      };
    } catch (error) {
      console.error('Error logging in user:', error);
      return null;
    }
  }

  /**
   * Generate JWT token
   */
  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      config.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse | null> {
    try {
      // Find where userId = userId
      const user = await UserModel.findOne({ userId: userId });
      if (!user) {
        return null;
      }

      // Get user's organizations
      const userOrgs = await this.getUserOrganizations(userId);

      return {
        userId: user.userId,
        email: user.email,
        role: user.role,
        organizations: userOrgs
      };
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Get organizations that a user belongs to with their roles
   */
  private async getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    try {
      // Find user to get organization IDs
      const user = await UserModel.findOne({ userId });
      if (!user || !user.organizations || user.organizations.length === 0) {
        return [];
      }

      // Find all organizations that this user is a member of
      const organizations = await OrganizationModel.find({ 
        organizationId: { $in: user.organizations }
      });

      return organizations.map(org => {
        // Find the user's role in this organization
        const memberInfo = org.members.find(m => m.userId === userId);
        return {
          organizationId: org.organizationId,
          organizationName: org.organizationName,
          organizationDescription: org.organizationDescription,
          role: memberInfo?.role || 'viewer' // Default to viewer if role not found
        };
      });
    } catch (error) {
      console.error('Error getting user organizations:', error);
      return [];
    }
  }
}