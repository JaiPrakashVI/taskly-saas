import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../config/db';
import { sendSuccess, sendError } from '../../utils/response';

const JWT_SECRET = process.env.JWT_SECRET || 'taskly_default_secret_key';
const SALT_ROUNDS = 10;

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      sendError(res, 'Email is already registered.', 400);
      return;
    }

    // Hash the password before saving to the database
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    // Generate JWT token containing user identity details
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '24h',
    });

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    }, 201);
  } catch (error) {
    // Keep error logs secure on the server side
    console.error('Registration error:', error);
    sendError(res, 'An error occurred during registration.', 500);
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Retrieve user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      sendError(res, 'Invalid email or password.', 401);
      return;
    }

    // Compare provided password with hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      sendError(res, 'Invalid email or password.', 401);
      return;
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '24h',
    });

    sendSuccess(res, {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'An error occurred during login.', 500);
  }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  // Client is responsible for deleting the JWT token from localStorage.
  // Standard token-based logout responds with a message that the logout was successful.
  sendSuccess(res, { message: 'Logged out successfully.' });
};
