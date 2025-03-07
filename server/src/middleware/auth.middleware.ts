import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authorization header missing or invalid' });
      return;
    }

    const token = authHeader.split(' ')[1];
    console.log(token);
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication failed' });
    return;
  }
};