import { z } from 'zod';

// Schema for creating tasks
export const createTaskSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Task name is required.')
    .max(100, 'Task name must not exceed 100 characters.'),
  description: z.string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters.')
    .optional()
    .nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'])
    .default('MEDIUM'),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
    .default('PENDING'),
  dueDate: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.coerce.date().optional().nullable()
  ),
  projectId: z.string().uuid('Invalid project ID format.'),
});

// Schema for updating tasks (all fields optional)
export const updateTaskSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Task name is required.')
    .max(100, 'Task name must not exceed 100 characters.')
    .optional(),
  description: z.string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters.')
    .optional()
    .nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'])
    .optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
    .optional(),
  dueDate: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.coerce.date().optional().nullable()
  ),
  projectId: z.string().uuid('Invalid project ID format.').optional(),
});

// Query validation schema for searching, filtering, and paging tasks
export const taskQuerySchema = z.object({
  projectId: z.string().uuid('Invalid project ID format.').optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  sortBy: z.enum(['dueDate', 'priority', 'newest']).default('newest'),
});
