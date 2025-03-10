import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
}