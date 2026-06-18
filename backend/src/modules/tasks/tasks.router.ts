import { Router } from 'express';
import {
  createTask,
  deleteTask,
  getTaskById,
  getTasks,
  updateTask,
} from './tasks.controller';
import {
  createTaskSchema,
  taskQuerySchema,
  updateTaskSchema,
} from './tasks.schema';
import { authenticateToken } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validate';

const router = Router();

// Get tasks (supports filters, paging, sorting)
router.get(
  '/',
  authenticateToken as any,
  validateQuery(taskQuerySchema),
  getTasks as any
);

// Create task
router.post(
  '/',
  authenticateToken as any,
  validateBody(createTaskSchema),
  createTask as any
);

// Get task details
router.get(
  '/:id',
  authenticateToken as any,
  getTaskById as any
);

// Update task
router.put(
  '/:id',
  authenticateToken as any,
  validateBody(updateTaskSchema),
  updateTask as any
);

// Soft delete task
router.delete(
  '/:id',
  authenticateToken as any,
  deleteTask as any
);

export default router;
