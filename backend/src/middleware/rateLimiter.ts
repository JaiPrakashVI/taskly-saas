import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiter for Login attempts (10 attempts per 15 minutes per IP)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for Register attempts (5 attempts per 15 minutes per IP)
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.',
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});
