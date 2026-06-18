import { Router } from 'express';
import { login, logout, register } from './auth.controller';
import { loginSchema, registerSchema } from './auth.schema';
import { validateBody } from '../../middleware/validate';
import { loginLimiter, registerLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Apply rate limiting and payload validation middleware to registration
router.post('/register', registerLimiter, validateBody(registerSchema), register);

// Apply rate limiting and payload validation middleware to login
router.post('/login', loginLimiter, validateBody(loginSchema), login);

// Standard logout endpoint
router.post('/logout', logout);

export default router;
