import { Request, Response, NextFunction } from 'express';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: 'admin' | 'manager' | 'editor' | 'viewer' | 'dataCleaner';
      };
    }
  }
}

type RoleType = 'admin' | 'manager' | 'editor' | 'viewer' | 'dataCleaner';
const roleHierarchy: Record<RoleType, number> = {
  'admin': 4,
  'manager': 3,
  'editor': 2,
  'dataCleaner': 1,
  'viewer': 0
};

export const checkRole = (requiredRole: RoleType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || 'viewer';
    
    if (roleHierarchy[userRole as RoleType] >= roleHierarchy[requiredRole]) {
      next();
    } else {
      res.status(403).json({
        message: 'Insufficient permissions to access this resource'
      });
    }
  };
};

export const requireRoles = (roles: RoleType[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role || 'viewer';
    
    if (roles.includes(userRole as RoleType)) {
      next();
    } else {
      res.status(403).json({
        message: 'Insufficient permissions to access this resource'
      });
    }
  };
};