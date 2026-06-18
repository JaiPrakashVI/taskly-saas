"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTask = exports.updateTask = exports.getTaskById = exports.createTask = exports.getTasks = void 0;
const db_1 = __importDefault(require("../../config/db"));
const response_1 = require("../../utils/response");
// GET /api/tasks
// Retrieves tasks belonging to the projects owned by the authenticated freelancer.
// Supports filtering by projectId, status, priority, name search, sorting, and pagination (10 per page).
const getTasks = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            (0, response_1.sendError)(res, 'Unauthorized.', 401);
            return;
        }
        const { projectId, search, status, priority, page = 1, sortBy = 'newest' } = req.query;
        // Build the query filters
        const whereClause = {
            deletedAt: null, // Filter out soft-deleted tasks
            project: {
                ownerId,
                deletedAt: null, // Ensure parent project is not soft-deleted either
            },
        };
        // If specific project requested, scope to that project
        if (projectId) {
            whereClause.projectId = projectId;
        }
        if (status) {
            whereClause.status = status;
        }
        if (priority) {
            whereClause.priority = priority;
        }
        if (search) {
            whereClause.name = {
                contains: search,
                mode: 'insensitive',
            };
        }
        // Set up sorting
        // NOTE FOR INTERVIEW: For database-independence (e.g. SQLite compatibility), priority is stored as a string.
        // Sorting by priority here is alphabetical ('HIGH', 'LOW', 'MEDIUM').
        // In a production app, we would use a PostgreSQL Enum or maps/integers to sort HIGH > MEDIUM > LOW.
        let orderBy = { createdAt: 'desc' };
        if (sortBy === 'dueDate') {
            orderBy = { dueDate: 'asc' }; // Closest due dates first
        }
        else if (sortBy === 'priority') {
            orderBy = { priority: 'asc' }; // Alphabetical: HIGH, LOW, MEDIUM
        }
        const limit = 10;
        const skip = (Number(page) - 1) * limit;
        const [tasks, totalTasks] = await db_1.default.$transaction([
            db_1.default.task.findMany({
                where: whereClause,
                include: {
                    project: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy,
                skip,
                take: limit,
            }),
            db_1.default.task.count({
                where: whereClause,
            }),
        ]);
        const totalPages = Math.ceil(totalTasks / limit);
        (0, response_1.sendSuccess)(res, {
            tasks,
            pagination: {
                total: totalTasks,
                page: Number(page),
                pages: totalPages || 1,
                limit,
            },
        });
    }
    catch (error) {
        console.error('Get tasks error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch tasks.', 500);
    }
};
exports.getTasks = getTasks;
// POST /api/tasks
// Creates a new task under a project, validating project ownership.
const createTask = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        const { name, description, priority, status, dueDate, projectId } = req.body;
        // Verify parent project ownership before creating the task
        const project = await db_1.default.project.findFirst({
            where: {
                id: projectId,
                ownerId,
                deletedAt: null,
            },
        });
        if (!project) {
            (0, response_1.sendError)(res, 'Project not found.', 404);
            return;
        }
        const task = await db_1.default.task.create({
            data: {
                name,
                description,
                priority,
                status,
                dueDate,
                projectId,
            },
        });
        (0, response_1.sendSuccess)(res, task, 201);
    }
    catch (error) {
        console.error('Create task error:', error);
        (0, response_1.sendError)(res, 'Failed to create task.', 500);
    }
};
exports.createTask = createTask;
// GET /api/tasks/:id
// Retrieves a single task, validating ownership.
const getTaskById = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        const { id } = req.params;
        const task = await db_1.default.task.findUnique({
            where: { id },
            include: {
                project: true,
            },
        });
        // Verify task existence, soft-delete state, and user's project ownership
        if (!task || task.deletedAt || task.project.ownerId !== ownerId || task.project.deletedAt) {
            (0, response_1.sendError)(res, 'Task not found.', 404);
            return;
        }
        // Exclude full project details from raw response to optimize payload size
        const { project, ...taskDetails } = task;
        (0, response_1.sendSuccess)(res, taskDetails);
    }
    catch (error) {
        console.error('Get task by ID error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch task.', 500);
    }
};
exports.getTaskById = getTaskById;
// PUT /api/tasks/:id
// Updates a task, validating ownership.
const updateTask = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        const { id } = req.params;
        const { name, description, priority, status, dueDate, projectId } = req.body;
        const task = await db_1.default.task.findUnique({
            where: { id },
            include: {
                project: true,
            },
        });
        if (!task || task.deletedAt || task.project.ownerId !== ownerId || task.project.deletedAt) {
            (0, response_1.sendError)(res, 'Task not found.', 404);
            return;
        }
        // If changing projectId, verify new project is also owned by the user
        if (projectId && projectId !== task.projectId) {
            const newProject = await db_1.default.project.findFirst({
                where: {
                    id: projectId,
                    ownerId,
                    deletedAt: null,
                },
            });
            if (!newProject) {
                (0, response_1.sendError)(res, 'New project not found.', 404);
                return;
            }
        }
        const updatedTask = await db_1.default.task.update({
            where: { id },
            data: {
                name,
                description,
                priority,
                status,
                dueDate,
                projectId,
            },
        });
        (0, response_1.sendSuccess)(res, updatedTask);
    }
    catch (error) {
        console.error('Update task error:', error);
        (0, response_1.sendError)(res, 'Failed to update task.', 500);
    }
};
exports.updateTask = updateTask;
// DELETE /api/tasks/:id
// Soft deletes a task, validating ownership.
const deleteTask = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        const { id } = req.params;
        const task = await db_1.default.task.findUnique({
            where: { id },
            include: {
                project: true,
            },
        });
        if (!task || task.deletedAt || task.project.ownerId !== ownerId || task.project.deletedAt) {
            (0, response_1.sendError)(res, 'Task not found.', 404);
            return;
        }
        // Perform soft delete
        const softDeletedTask = await db_1.default.task.update({
            where: { id },
            data: {
                deletedAt: new Date(),
            },
        });
        (0, response_1.sendSuccess)(res, { message: 'Task deleted successfully.', id: softDeletedTask.id });
    }
    catch (error) {
        console.error('Delete task error:', error);
        (0, response_1.sendError)(res, 'Failed to delete task.', 500);
    }
};
exports.deleteTask = deleteTask;
