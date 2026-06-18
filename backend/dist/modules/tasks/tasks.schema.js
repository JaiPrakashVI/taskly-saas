"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskQuerySchema = exports.updateTaskSchema = exports.createTaskSchema = void 0;
const zod_1 = require("zod");
// Schema for creating tasks
exports.createTaskSchema = zod_1.z.object({
    name: zod_1.z.string()
        .trim()
        .min(1, 'Task name is required.')
        .max(100, 'Task name must not exceed 100 characters.'),
    description: zod_1.z.string()
        .trim()
        .max(1000, 'Description must not exceed 1000 characters.')
        .optional()
        .nullable(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH'])
        .default('MEDIUM'),
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
        .default('PENDING'),
    dueDate: zod_1.z.preprocess((val) => (val === '' || val === undefined ? null : val), zod_1.z.coerce.date().optional().nullable()),
    projectId: zod_1.z.string().uuid('Invalid project ID format.'),
});
// Schema for updating tasks (all fields optional)
exports.updateTaskSchema = zod_1.z.object({
    name: zod_1.z.string()
        .trim()
        .min(1, 'Task name is required.')
        .max(100, 'Task name must not exceed 100 characters.')
        .optional(),
    description: zod_1.z.string()
        .trim()
        .max(1000, 'Description must not exceed 1000 characters.')
        .optional()
        .nullable(),
    priority: zod_1.z.enum(['LOW', 'MEDIUM', 'HIGH'])
        .optional(),
    status: zod_1.z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED'])
        .optional(),
    dueDate: zod_1.z.preprocess((val) => (val === '' || val === undefined ? null : val), zod_1.z.coerce.date().optional().nullable()),
    projectId: zod_1.z.string().uuid('Invalid project ID format.').optional(),
});
// Query validation schema for searching, filtering, and paging tasks
exports.taskQuerySchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid('Invalid project ID format.').optional(),
    search: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    priority: zod_1.z.string().optional(),
    page: zod_1.z.preprocess((val) => (val ? Number(val) : 1), zod_1.z.number().int().min(1).default(1)),
    sortBy: zod_1.z.enum(['dueDate', 'priority', 'newest']).default('newest'),
});
