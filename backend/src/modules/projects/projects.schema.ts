import { z } from 'zod';

// Schema for creating projects
export const createProjectSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Project name is required.')
    .max(100, 'Project name must not exceed 100 characters.'),
  description: z.string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters.')
    .optional()
    .nullable(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
    .default('NOT_STARTED'),
  // We use z.preprocess to convert empty strings from frontend forms to null.
  // Then we use z.coerce.date() to convert date strings (e.g. "2026-06-18") to JavaScript Date objects.
  startDate: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.coerce.date().optional().nullable()
  ),
  endDate: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.coerce.date().optional().nullable()
  ),
});

// Schema for updating projects (all fields optional)
export const updateProjectSchema = z.object({
  name: z.string()
    .trim()
    .min(1, 'Project name is required.')
    .max(100, 'Project name must not exceed 100 characters.')
    .optional(),
  description: z.string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters.')
    .optional()
    .nullable(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
    .optional(),
  startDate: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.coerce.date().optional().nullable()
  ),
  endDate: z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    z.coerce.date().optional().nullable()
  ),
});

// Query validation schema for searching, filtering, and paging projects
export const projectQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.preprocess((val) => (val ? Number(val) : 1), z.number().int().min(1).default(1)),
  sortBy: z.enum(['newest', 'oldest', 'name']).default('newest'),
});
