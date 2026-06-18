import { Response } from 'express';
import { RequestWithUser } from '../../middleware/auth';
import prisma from '../../config/db';
import { sendSuccess, sendError } from '../../utils/response';

// GET /api/tasks
// Retrieves tasks belonging to the projects owned by the authenticated freelancer.
// Supports filtering by projectId, status, priority, name search, sorting, and pagination (10 per page).
export const getTasks = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    if (!ownerId) {
      sendError(res, 'Unauthorized.', 401);
      return;
    }

    const { projectId, search, status, priority, page = 1, sortBy = 'newest' } = req.query as any;

    // Build the query filters
    const whereClause: any = {
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
    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'dueDate') {
      orderBy = { dueDate: 'asc' }; // Closest due dates first
    } else if (sortBy === 'priority') {
      orderBy = { priority: 'asc' }; // Alphabetical: HIGH, LOW, MEDIUM
    }

    const limit = 10;
    const skip = (Number(page) - 1) * limit;

    const [tasks, totalTasks] = await prisma.$transaction([
      prisma.task.findMany({
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
      prisma.task.count({
        where: whereClause,
      }),
    ]);

    const totalPages = Math.ceil(totalTasks / limit);

    sendSuccess(res, {
      tasks,
      pagination: {
        total: totalTasks,
        page: Number(page),
        pages: totalPages || 1,
        limit,
      },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    sendError(res, 'Failed to fetch tasks.', 500);
  }
};

// POST /api/tasks
// Creates a new task under a project, validating project ownership.
export const createTask = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    const { name, description, priority, status, dueDate, projectId } = req.body;

    // Verify parent project ownership before creating the task
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId,
        deletedAt: null,
      },
    });

    if (!project) {
      sendError(res, 'Project not found.', 404);
      return;
    }

    const task = await prisma.task.create({
      data: {
        name,
        description,
        priority,
        status,
        dueDate,
        projectId,
      },
    });

    sendSuccess(res, task, 201);
  } catch (error) {
    console.error('Create task error:', error);
    sendError(res, 'Failed to create task.', 500);
  }
};

// GET /api/tasks/:id
// Retrieves a single task, validating ownership.
export const getTaskById = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    // Verify task existence, soft-delete state, and user's project ownership
    if (!task || task.deletedAt || task.project.ownerId !== ownerId || task.project.deletedAt) {
      sendError(res, 'Task not found.', 404);
      return;
    }

    // Exclude full project details from raw response to optimize payload size
    const { project, ...taskDetails } = task;
    sendSuccess(res, taskDetails);
  } catch (error) {
    console.error('Get task by ID error:', error);
    sendError(res, 'Failed to fetch task.', 500);
  }
};

// PUT /api/tasks/:id
// Updates a task, validating ownership.
export const updateTask = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    const { id } = req.params;
    const { name, description, priority, status, dueDate, projectId } = req.body;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!task || task.deletedAt || task.project.ownerId !== ownerId || task.project.deletedAt) {
      sendError(res, 'Task not found.', 404);
      return;
    }

    // If changing projectId, verify new project is also owned by the user
    if (projectId && projectId !== task.projectId) {
      const newProject = await prisma.project.findFirst({
        where: {
          id: projectId,
          ownerId,
          deletedAt: null,
        },
      });
      if (!newProject) {
        sendError(res, 'New project not found.', 404);
        return;
      }
    }

    const updatedTask = await prisma.task.update({
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

    sendSuccess(res, updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    sendError(res, 'Failed to update task.', 500);
  }
};

// DELETE /api/tasks/:id
// Soft deletes a task, validating ownership.
export const deleteTask = async (req: RequestWithUser, res: Response): Promise<void> => {
  try {
    const ownerId = req.user?.id;
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!task || task.deletedAt || task.project.ownerId !== ownerId || task.project.deletedAt) {
      sendError(res, 'Task not found.', 404);
      return;
    }

    // Perform soft delete
    const softDeletedTask = await prisma.task.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    sendSuccess(res, { message: 'Task deleted successfully.', id: softDeletedTask.id });
  } catch (error) {
    console.error('Delete task error:', error);
    sendError(res, 'Failed to delete task.', 500);
  }
};
