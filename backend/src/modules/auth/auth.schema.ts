import { z } from 'zod';

// Registration validator with password requirements
export const registerSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email({ message: 'Invalid email address format.' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' }),
});

// Login validator
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email({ message: 'Invalid email address format.' }),
  password: z.string()
    .min(1, { message: 'Password is required.' }),
});
