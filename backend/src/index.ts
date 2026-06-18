import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import authRouter from './modules/auth/auth.router';
import projectsRouter from './modules/projects/projects.router';
import tasksRouter from './modules/tasks/tasks.router';
import dashboardRouter from './modules/dashboard/dashboard.router';
import { sendError } from './utils/response';

// Load environment configurations
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Optimization Middlewares
app.use(helmet());
app.use(compression());
app.use(cors({
  // In production, we'd lock this down, but for development and demo builds, allow cross-origin requests
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parsers
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/dashboard', dashboardRouter);

// Basic Health Check / Root endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'Taskly API is running.' });
});

// Catch-all route for unhandled requests (404)
app.use((req: Request, res: Response) => {
  sendError(res, 'Requested resource not found.', 404);
});

// Global Error Handling Middleware
// This acts as a final safety net, shielding the frontend from database exceptions or raw stack traces.
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  sendError(res, 'Internal server error occurred.', 500);
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`[Taskly Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
