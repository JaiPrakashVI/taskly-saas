import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response';

// Custom interface that explicitly represents a request with a verified user payload
export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
  };
}

// Middleware to authenticate JWT tokens in the request authorization headers.
// Expects: "Authorization: Bearer <token>"
export const authenticateToken = (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  // The token is typically formatted as "Bearer <JWT_TOKEN>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    sendError(res, 'Access denied. No authentication token provided.', 401);
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'taskly_default_secret_key';
    const decoded = jwt.verify(token, jwtSecret) as { id: string; email: string };
    
    // Attach the decoded token payload to the request for subsequent handlers
    req.user = decoded;
    next();
  } catch (error) {
    sendError(res, 'Authentication failed. Invalid or expired token.', 401);
  }
};
