"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardData = void 0;
const db_1 = __importDefault(require("../../config/db"));
const response_1 = require("../../utils/response");
// GET /api/dashboard
// Aggregates statistics for the authenticated freelancer's dashboard.
// All calculations are done in parallel at the database level using Promise.all to improve throughput.
const getDashboardData = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            (0, response_1.sendError)(res, 'Unauthorized.', 401);
            return;
        }
        // Run parallel counts and retrieval queries for projects, tasks, and recent actions.
        // Promise.all executes these queries concurrently, bypassing transaction sequential locks.
        const [totalProjects, projectsInProgress, totalTasks, completedTasks, pendingTasks, inProgressTasks, latestTasks, latestProjects,] = await Promise.all([
            // 1. Total Projects (Active)
            db_1.default.project.count({
                where: {
                    ownerId,
                    deletedAt: null,
                },
            }),
            // 2. Projects in Progress
            db_1.default.project.count({
                where: {
                    ownerId,
                    status: 'IN_PROGRESS',
                    deletedAt: null,
                },
            }),
            // 3. Total Tasks (Active across all active projects)
            db_1.default.task.count({
                where: {
                    deletedAt: null,
                    project: {
                        ownerId,
                        deletedAt: null,
                    },
                },
            }),
            // 4. Completed Tasks
            db_1.default.task.count({
                where: {
                    status: 'COMPLETED',
                    deletedAt: null,
                    project: {
                        ownerId,
                        deletedAt: null,
                    },
                },
            }),
            // 5. Pending Tasks
            db_1.default.task.count({
                where: {
                    status: 'PENDING',
                    deletedAt: null,
                    project: {
                        ownerId,
                        deletedAt: null,
                    },
                },
            }),
            // 6. In Progress Tasks
            db_1.default.task.count({
                where: {
                    status: 'IN_PROGRESS',
                    deletedAt: null,
                    project: {
                        ownerId,
                        deletedAt: null,
                    },
                },
            }),
            // 7. Fetch the 10 most recently updated tasks to compile activity feed
            db_1.default.task.findMany({
                where: {
                    deletedAt: null,
                    project: {
                        ownerId,
                        deletedAt: null,
                    },
                },
                include: {
                    project: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    updatedAt: 'desc',
                },
                take: 10,
            }),
            // 8. Fetch the 5 most recently updated projects to compile activity feed
            db_1.default.project.findMany({
                where: {
                    ownerId,
                    deletedAt: null,
                },
                orderBy: {
                    updatedAt: 'desc',
                },
                take: 5,
            }),
        ]);
        // Calculate Completion Percentage
        const completionPercentage = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;
        // Compile Recent Activity Logs in memory dynamically
        const activities = [];
        // Process task updates
        latestTasks.forEach((task) => {
            // Check if task was created vs updated (allow a 2 second buffer)
            const timeDiff = Math.abs(task.createdAt.getTime() - task.updatedAt.getTime());
            const isCreated = timeDiff < 2000;
            if (task.status === 'COMPLETED') {
                activities.push({
                    id: `task-completed-${task.id}`,
                    type: 'TASK_COMPLETED',
                    message: `✓ ${task.name} completed`,
                    projectName: task.project.name,
                    timestamp: task.updatedAt,
                });
            }
            else if (isCreated) {
                activities.push({
                    id: `task-created-${task.id}`,
                    type: 'TASK_CREATED',
                    message: `+ ${task.name} created`,
                    projectName: task.project.name,
                    timestamp: task.createdAt,
                });
            }
            else {
                const readableStatus = task.status === 'IN_PROGRESS' ? 'In Progress' : 'Pending';
                activities.push({
                    id: `task-updated-${task.id}`,
                    type: 'TASK_UPDATED',
                    message: `→ ${task.name} moved to ${readableStatus}`,
                    projectName: task.project.name,
                    timestamp: task.updatedAt,
                });
            }
        });
        // Process project updates
        latestProjects.forEach((proj) => {
            const timeDiff = Math.abs(proj.createdAt.getTime() - proj.updatedAt.getTime());
            const isCreated = timeDiff < 2000;
            if (isCreated) {
                activities.push({
                    id: `project-created-${proj.id}`,
                    type: 'PROJECT_CREATED',
                    message: `+ Project ${proj.name} created`,
                    projectName: proj.name,
                    timestamp: proj.createdAt,
                });
            }
            else {
                const readableStatus = proj.status === 'IN_PROGRESS' ? 'In Progress' :
                    proj.status === 'COMPLETED' ? 'Completed' : 'Not Started';
                activities.push({
                    id: `project-updated-${proj.id}`,
                    type: 'PROJECT_UPDATED',
                    message: `→ ${proj.name} moved to ${readableStatus}`,
                    projectName: proj.name,
                    timestamp: proj.updatedAt,
                });
            }
        });
        // Sort merged activity feed chronologically descending and take the 5 most recent activities
        const recentActivities = activities
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 5);
        (0, response_1.sendSuccess)(res, {
            totalProjects,
            projectsInProgress,
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            completionPercentage,
            recentTasks: latestTasks.slice(0, 5), // Keep backward compatibility for raw tasks widget
            recentActivities,
        });
    }
    catch (error) {
        console.error('Dashboard aggregation error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch dashboard data.', 500);
    }
};
exports.getDashboardData = getDashboardData;
