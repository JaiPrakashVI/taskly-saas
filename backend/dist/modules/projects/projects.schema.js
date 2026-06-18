"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectQuerySchema = exports.updateProjectSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
// Schema for creating projects
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.string()
        .trim()
        .min(1, 'Project name is required.')
        .max(100, 'Project name must not exceed 100 characters.'),
    description: zod_1.z.string()
        .trim()
        .max(1000, 'Description must not exceed 1000 characters.')
        .optional()
        .nullable(),
    status: zod_1.z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
        .default('NOT_STARTED'),
    // We use z.preprocess to convert empty strings from frontend forms to null.
    // Then we use z.coerce.date() to convert date strings (e.g. "2026-06-18") to JavaScript Date objects.
    startDate: zod_1.z.preprocess((val) => (val === '' || val === undefined ? null : val), zod_1.z.coerce.date().optional().nullable()),
    endDate: zod_1.z.preprocess((val) => (val === '' || val === undefined ? null : val), zod_1.z.coerce.date().optional().nullable()),
});
// Schema for updating projects (all fields optional)
exports.updateProjectSchema = zod_1.z.object({
    name: zod_1.z.string()
        .trim()
        .min(1, 'Project name is required.')
        .max(100, 'Project name must not exceed 100 characters.')
        .optional(),
    description: zod_1.z.string()
        .trim()
        .max(1000, 'Description must not exceed 1000 characters.')
        .optional()
        .nullable(),
    status: zod_1.z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'])
        .optional(),
    startDate: zod_1.z.preprocess((val) => (val === '' || val === undefined ? null : val), zod_1.z.coerce.date().optional().nullable()),
    endDate: zod_1.z.preprocess((val) => (val === '' || val === undefined ? null : val), zod_1.z.coerce.date().optional().nullable()),
});
// Query validation schema for searching, filtering, and paging projects
exports.projectQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    page: zod_1.z.preprocess((val) => (val ? Number(val) : 1), zod_1.z.number().int().min(1).default(1)),
    sortBy: zod_1.z.enum(['newest', 'oldest', 'name']).default('newest'),
});
