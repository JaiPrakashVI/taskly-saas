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
// All calculations are done at the database level using Prisma.
const getDashboardData = async (req, res) => {
    try {
        const ownerId = req.user?.id;
        if (!ownerId) {
            (0, response_1.sendError)(res, 'Unauthorized.', 401);
            return;
        }
        // Run parallel counts for projects and tasks to minimize database roundtrips
        const [totalProjects, projectsInProgress, totalTasks, completedTasks, pendingTasks, // Tasks with PENDING status
        inProgressTasks, // Tasks with IN_PROGRESS status
        recentTasks,] = await db_1.default.$transaction([
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
            // 7. Recent Tasks (Latest 5 active tasks for widget)
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
                    createdAt: 'desc',
                },
                take: 5,
            }),
        ]);
        // Calculate Completion Percentage
        // Handles case where totalTasks is 0 to avoid division by zero
        const completionPercentage = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;
        (0, response_1.sendSuccess)(res, {
            totalProjects,
            projectsInProgress,
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks,
            completionPercentage,
            recentTasks,
        });
    }
    catch (error) {
        console.error('Dashboard aggregation error:', error);
        (0, response_1.sendError)(res, 'Failed to fetch dashboard data.', 500);
    }
};
exports.getDashboardData = getDashboardData;
