// filepath: /Users/a/projects/data-cleaning-monorepo/server/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginRequest, RegisterRequest } from 'shared';
import { AuthRequest } from '../middleware/auth.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;

      // Validate input
      if (!loginData.email || !loginData.password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }

      // Attempt to login
      const auth = await this.authService.login(loginData);
      if (!auth) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      res.status(200).json(auth);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Register new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: RegisterRequest = req.body;

      // Validate input
      if (!userData.email || !userData.password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }

      // Attempt to register
      const auth = await this.authService.register(userData);
      if (!auth) {
        res.status(409).json({ message: 'User already exists' });
        return;
      }

      res.status(201).json(auth);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      console.log('Get profile for user:', userId);

      const user = await this.authService.getUserById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.status(200).json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}