"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProject = exports.updateProject = exports.getProjectById = exports.createProject = exports.getProjects = void 0;
const db_1 = __importDefault(require("../../config/db"));
const response_1 = require("../../utils/response");
// GET /api/projects
// Fetches client projects owned by the authenticated freelancer.
// Supports status filtering, name search, sorting, and pagination (10 projects per page).
const getProjects = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            (0, response_1.sendError)(res, 'Unauthorized.', 401);
            return;
        }
        const { search, status, page = 1, sortBy = 'newest' } = req.query;
        // Build the query filters
        const whereClause = {
            ownerId,
            deletedAt: null, // Filter out soft-deleted projects
        };
        if (status) {
            whereClause.status = status;
        }
        if (search) {
            whereClause.name = {
                contains: search,
                mode: 'insensitive', // Case-insensitive search
            };
        }
        // Set up sorting
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'oldest') {
            orderBy = { createdAt: 'asc' };
        }
        else if (sortBy === 'name') {
            orderBy = { name: 'asc' };
        }
        // Setup pagination (10 projects per page)
        const limit = 10;
        const skip = (Number(page) - 1) * limit;
        // Query database for both projects and total count matching the criteria
        const [projects, totalProjects] = await db_1.default.$transaction([
            db_1.default.project.findMany({
                where: whereClause,
                include: {
                    tasks: {
                        where: { deletedAt: null },
                        select: {
                            status: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            db_1.default.project.count({
                where: whereClause,
            }),
        ]);
        // Compute progress rates for each project card in-memory
        const projectsWithStats = projects.map((project) => {
            const activeTasks = project.tasks || [];
            const totalTasksCount = activeTasks.length;
            const completedTasksCount = activeTasks.filter((t) => t.status === 'COMPLETED').length;
            const percentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
            const { tasks, ...projectDetails } = project;
            return {
                ...projectDetails,
                totalTasks: totalTasksCount,
                completedTasks: completedTasksCount,
                completionPercentage: percentage,
            };
        });
        const totalPages = Math.ceil(totalProjects / limit);
        (0, response_1.sendSuccess)(res, {
            projects: projectsWithStats,
            pagination: {
                total: totalProjects,
                page: Number(page),
                pages: totalPages || 1, // Ensure it returns at least 1 page
                limit,
            },
        });
    }
    catch (error) {
        console.error('Get projects error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch projects.', 500);
    }
};
exports.getProjects = getProjects;
// POST /api/projects
// Creates a new project owned by the authenticated freelancer.
const createProject = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            (0, response_1.sendError)(res, 'Unauthorized.', 401);
            return;
        }
        const { name, description, status, startDate, endDate } = req.body;
        const project = await db_1.default.project.create({
            data: {
                name,
                description,
                status,
                startDate,
                endDate,
                ownerId,
            },
        });
        (0, response_1.sendSuccess)(res, project, 201);
    }
    catch (error) {
        console.error('Create project error:', error);
        (0, response_1.sendError)(res, 'Failed to create project.', 500);
    }
};
exports.createProject = createProject;
// GET /api/projects/:id
// Fetches details of a single project, verifying ownership.
const getProjectById = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        const { id } = req.params;
        const project = await db_1.default.project.findUnique({
            where: { id },
        });
        // If the project doesn't exist, is soft-deleted, or is owned by another user, return 404.
        // Returning 404 instead of 403 prevents malicious users from scanning/enumerating project IDs.
        if (!project || project.deletedAt || project.ownerId !== ownerId) {
            (0, response_1.sendError)(res, 'Project not found.', 404);
            return;
        }
        (0, response_1.sendSuccess)(res, project);
    }
    catch (error) {
        console.error('Get project by ID error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch project details.', 500);
    }
};
exports.getProjectById = getProjectById;
// PUT /api/projects/:id
// Updates an existing project, verifying ownership.
const updateProject = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        const { id } = req.params;
        const { name, description, status, startDate, endDate } = req.body;
        const project = await db_1.default.project.findUnique({
            where: { id },
        });
        if (!project || project.deletedAt || project.ownerId !== ownerId) {
            (0, response_1.sendError)(res, 'Project not found.', 404);
            return;
        }
        const updatedProject = await db_1.default.project.update({
            where: { id },
            data: {
                name,
                description,
                status,
                startDate,
                endDate,
            },
        });
        (0, response_1.sendSuccess)(res, updatedProject);
    }
    catch (error) {
        console.error('Update project error:', error);
        (0, response_1.sendError)(res, 'Failed to update project.', 500);
    }
};
exports.updateProject = updateProject;
// DELETE /api/projects/:id
// Soft deletes a project, verifying ownership.
// Soft delete updates the deletedAt timestamp rather than purging the row.
const deleteProject = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        const { id } = req.params;
        const project = await db_1.default.project.findUnique({
            where: { id },
        });
        if (!project || project.deletedAt || project.ownerId !== ownerId) {
            (0, response_1.sendError)(res, 'Project not found.', 404);
            return;
        }
        // Perform soft delete by setting deletedAt
        const softDeletedProject = await db_1.default.project.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
        (0, response_1.sendSuccess)(res, { message: 'Project deleted successfully.', id: softDeletedProject.id });
    }
    catch (error) {
        console.error('Delete project error:', error);
        (0, response_1.sendError)(res, 'Failed to delete project.', 500);
    }
};
exports.deleteProject = deleteProject;
