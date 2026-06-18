import { Router } from 'express';
import {
  createProject,
  deleteProject,
  getProjectById,
  getProjects,
  updateProject,
} from './projects.controller';
import {
  createProjectSchema,
  projectQuerySchema,
  updateProjectSchema,
} from './projects.schema';
import { authenticateToken } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validate';

const router = Router();

// Get all projects for authenticated user (supports filters and paging)
router.get(
  '/',
  authenticateToken as any,
  validateQuery(projectQuerySchema),
  getProjects as any
);

// Create a new project for authenticated user
router.post(
  '/',
  authenticateToken as any,
  validateBody(createProjectSchema),
  createProject as any
);

// Get specific project details (verifies owner)
router.get(
  '/:id',
  authenticateToken as any,
  getProjectById as any
);

// Update a project (verifies owner)
router.put(
  '/:id',
  authenticateToken as any,
  validateBody(updateProjectSchema),
  updateProject as any
);

// Soft delete a project (verifies owner)
router.delete(
  '/:id',
  authenticateToken as any,
  deleteProject as any
);

export default router;
