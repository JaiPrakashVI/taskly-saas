import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { ArrowLeft, ArrowRight, Plus, Search, CheckSquare, Square, Edit3, Trash2, Loader2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Project } from './ProjectsList';

// Zod schema for task forms matching backend constraints
const taskFormSchema = z.object({
  name: z.string().trim().min(1, 'Task name is required.').max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  dueDate: z.string().optional().nullable(),
});

type TaskFormFields = z.infer<typeof taskFormSchema>;

interface Task {
  id: string;
  name: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string | null;
  createdAt: string;
  projectId: string;
}

const ProjectDetails: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // Task listing filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskFormFields>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      priority: 'MEDIUM',
      status: 'PENDING',
    }
  });

  // Query: Get Project Metadata
  const { data: project, isLoading: isProjectLoading, isError: isProjectError, refetch: refetchProject } = useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.data;
    },
    enabled: !!projectId,
    staleTime: 60000,
  });

  // Query: Get Tasks within this Project
  const { data: tasksData, isLoading: isTasksLoading, isError: isTasksError, refetch: refetchTasks } = useQuery({
    queryKey: ['tasks', { projectId, search, statusFilter, priorityFilter, sortBy, page }],
    queryFn: async () => {
      const response = await api.get('/tasks', {
        params: { projectId, search, status: statusFilter, priority: priorityFilter, sortBy, page },
      });
      return response.data.data;
    },
    enabled: !!projectId,
    staleTime: 30000,
  });

  // Query: Get ALL Tasks within this Project (unfiltered/unpaginated-ish for progress calculations)
  const { data: allTasksData, isLoading: isAllTasksLoading, isError: isAllTasksError, refetch: refetchAllTasks } = useQuery({
    queryKey: ['all-tasks', projectId],
    queryFn: async () => {
      const response = await api.get('/tasks', {
        params: { projectId },
      });
      return response.data.data;
    },
    enabled: !!projectId,
    staleTime: 30000,
  });

  // Mutation: Toggle Task Status (WITH OPTIMISTIC UI)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' }) => {
      const response = await api.put(`/tasks/${id}`, { status });
      return response.data.data;
    },
    // Optimistic Update configuration
    onMutate: async (updatedTaskInfo) => {
      const queryKey = ['tasks', { projectId, search, statusFilter, priorityFilter, sortBy, page }];
      
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousTasksData = queryClient.getQueryData(queryKey);

      // Optimistically update the cache list
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: Task) =>
            t.id === updatedTaskInfo.id ? { ...t, status: updatedTaskInfo.status } : t
          ),
        };
      });

      // Return context containing previous data to rollback if request fails
      return { previousTasksData, queryKey };
    },
    onError: (_err, _newTodo, context) => {
      // Rollback cache to snapshot if request fails
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousTasksData);
      }
      alert('Failed to update task status. Changes rolled back.');
    },
    onSuccess: () => {
      // Invalidate queries to get verified database state
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Mutation: Create Task
  const createTaskMutation = useMutation({
    mutationFn: async (fields: TaskFormFields) => {
      const response = await api.post('/tasks', { ...fields, projectId });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeTaskModal();
    },
  });

  // Mutation: Update Task
  const updateTaskMutation = useMutation({
    mutationFn: async (fields: TaskFormFields & { id: string }) => {
      const response = await api.put(`/tasks/${fields.id}`, fields);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeTaskModal();
    },
  });

  // Mutation: Soft Delete Task
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const openCreateTaskModal = () => {
    setEditingTask(null);
    reset({
      name: '',
      description: '',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '',
    });
    setIsTaskModalOpen(true);
  };

  const openEditTaskModal = (task: Task) => {
    setEditingTask(task);
    reset({
      name: task.name,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
    });
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleFormSubmit = (fields: TaskFormFields) => {
    if (editingTask) {
      updateTaskMutation.mutate({ ...fields, id: editingTask.id });
    } else {
      createTaskMutation.mutate(fields);
    }
  };

  const handleToggleComplete = (task: Task) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    toggleStatusMutation.mutate({ id: task.id, status: nextStatus });
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(id);
    }
  };

  // Badge logic for task parameters
  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-700 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LOW': return 'text-slate-600 bg-slate-50 border-slate-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  // Dynamic date badges based on status and due dates
  const getDueDateBadge = (dueDateString: string | null, status: string) => {
    if (status === 'COMPLETED') {
      return { label: 'Completed', style: 'text-green-700 bg-green-50 border-green-200' };
    }
    if (!dueDateString) {
      return { label: 'No due date', style: 'text-slate-400 border-dashed border-slate-200' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dueDateString);
    dueDate.setHours(0, 0, 0, 0);

    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const formattedDate = new Date(dueDateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    if (daysDiff < 0) {
      return { label: `Overdue (${formattedDate})`, style: 'text-red-700 bg-red-50 border-red-200 font-semibold' };
    } else if (daysDiff === 0) {
      return { label: `Due Today`, style: 'text-amber-700 bg-amber-50 border-amber-200 font-semibold' };
    } else if (daysDiff === 1) {
      return { label: `Due Tomorrow`, style: 'text-brand-700 bg-brand-50 border-brand-200' };
    } else {
      return { label: `Due ${formattedDate}`, style: 'text-slate-600 bg-white border-slate-200' };
    }
  };

  const tasks: Task[] = tasksData?.tasks || [];
  const pagination = tasksData?.pagination || { total: 0, page: 1, pages: 1 };

  // Calculate metrics based on ALL project tasks (unfiltered)
  const allTasks: Task[] = allTasksData?.tasks || [];
  const totalTasksCount = allTasks.length;
  const completedTasksCount = allTasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasksCount = allTasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const overdueTasksCount = allTasks.filter(t => {
    if (t.status === 'COMPLETED' || !t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() < todayDate.getTime();
  }).length;

  const progressPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  if (isProjectLoading || isAllTasksLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Back button skeleton */}
        <div className="h-4 w-32 rounded bg-slate-100" />
        
        {/* Project Meta Information Card skeleton */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3 flex-1 min-w-[300px]">
              <div className="flex items-center gap-3">
                <div className="h-7 w-48 rounded bg-slate-100" />
                <div className="h-5 w-24 rounded-full bg-slate-100" />
              </div>
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
            </div>
            <div className="flex items-center gap-4 border-l border-slate-100 pl-4">
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="h-4 w-20 rounded bg-slate-100" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-16 rounded bg-slate-100" />
                <div className="h-4 w-20 rounded bg-slate-100" />
              </div>
            </div>
          </div>
          {/* Progress Widget skeleton inside header */}
          <div className="pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-slate-50 border border-slate-100" />
            ))}
          </div>
        </div>

        {/* Deliverables header skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div className="space-y-1">
            <div className="h-5 w-40 rounded bg-slate-100" />
            <div className="h-3 w-64 rounded bg-slate-100" />
          </div>
          <div className="h-9 w-32 rounded-lg bg-slate-100" />
        </div>

        {/* Filters skeleton */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 h-16 shadow-sm" />

        {/* Tasks list skeleton */}
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 h-14" />
          ))}
        </div>
      </div>
    );
  }

  if (isProjectError || isAllTasksError || isTasksError || !project) {
    return (
      <div className="space-y-4">
        <Link to="/projects" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4" /> Back to projects
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center space-y-3 max-w-md mx-auto shadow-sm my-12">
          <div className="text-red-800 font-semibold text-sm">Failed to load project database.</div>
          <p className="text-xs text-red-600">Please check your internet connection and try again.</p>
          <button
            onClick={() => {
              refetchProject();
              refetchTasks();
              refetchAllTasks();
            }}
            className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link to="/projects" className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      {/* Project Meta Information Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 animate-fadeIn">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                project.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-200' :
                project.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {project.status === 'COMPLETED' ? 'Completed' : project.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
              </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
              {project.description || 'No description provided.'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 border-l border-slate-100 pl-4">
            <div>
              <span className="block font-semibold uppercase tracking-wider text-slate-400">Start Date</span>
              <span className="mt-1 block font-medium text-slate-700">
                {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
              </span>
            </div>
            <div>
              <span className="block font-semibold uppercase tracking-wider text-slate-400">End Date</span>
              <span className="mt-1 block font-medium text-slate-700">
                {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Tracker Widget */}
        <div className="pt-6 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Progress</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-bold text-slate-950">{progressPercentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-200/30">
              <div 
                className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Completed</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-slate-950">{completedTasksCount}</span>
              <span className="text-xs text-slate-400">/ {totalTasksCount} tasks</span>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pending</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-slate-950">{pendingTasksCount}</span>
              <span className="text-xs text-slate-400">remaining</span>
            </div>
          </div>

          <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-100 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Overdue</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-2xl font-bold ${overdueTasksCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overdueTasksCount}</span>
              <span className="text-xs text-slate-400">tasks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks listing header */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Project Deliverables</h2>
          <p className="text-xs text-slate-500">Milestones and client requirements for this contract.</p>
        </div>
        <button
          onClick={openCreateTaskModal}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 focus:outline-none"
        >
          <Plus className="h-4 w-4" /> Add Deliverable
        </button>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search deliverables by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 py-1.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => {
            setPriorityFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          <option value="">All Priorities</option>
          <option value="HIGH">High Priority</option>
          <option value="MEDIUM">Medium Priority</option>
          <option value="LOW">Low Priority</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          <option value="newest">Newest First</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {/* Task List Content */}
      {isTasksLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 h-14" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-12 px-4 text-center">
          <CheckSquare className="h-8 w-8 text-slate-300" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900">No deliverables found</h3>
          <p className="mt-1 text-xs text-slate-500">Create a task to structure your client deliverables.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                const dateBadge = getDueDateBadge(task.dueDate, task.status);

                return (
                  <li
                    key={task.id}
                    className={`flex items-center justify-between gap-4 p-4 transition-colors hover:bg-slate-50/50 ${
                      isCompleted ? 'bg-slate-50/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Checkbox completing task */}
                      <button
                        onClick={() => handleToggleComplete(task)}
                        className="mt-0.5 rounded text-slate-400 hover:text-brand-500 focus:outline-none transition-colors"
                      >
                        {isCompleted ? (
                          <CheckSquare className="h-5 w-5 text-brand-600 fill-brand-50" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-300" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <span className={`text-sm font-semibold text-slate-900 block ${isCompleted ? 'line-through text-slate-400' : ''}`}>
                          {task.name}
                        </span>
                        {task.description && (
                          <span className={`text-xs text-slate-400 block mt-0.5 line-clamp-1 ${isCompleted ? 'text-slate-300' : ''}`}>
                            {task.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 shrink-0 text-xs">
                      {/* Priority badge */}
                      <span className={`rounded border px-2 py-0.5 font-medium ${getPriorityStyle(task.priority)}`}>
                        {task.priority}
                      </span>

                      {/* Due date badge */}
                      <span className={`rounded border px-2 py-0.5 font-medium ${dateBadge.style}`}>
                        {dateBadge.label}
                      </span>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditTaskModal(task)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-xs text-slate-500">
                Showing page {pagination.page} of {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className="flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <ArrowLeft className="h-3 w-3" /> Previous
                </button>
                <button
                  disabled={page === pagination.pages}
                  onClick={() => setPage(p => Math.min(p + 1, pagination.pages))}
                  className="flex items-center gap-1 rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Creation/Editing Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingTask ? 'Edit Deliverable' : 'Add Client Deliverable'}
              </h2>
              <button onClick={closeTaskModal} className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Deliverable Name</label>
                <input
                  type="text"
                  placeholder="e.g. Design homepage responsive wireframes"
                  className={`mt-1.5 block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 outline-none transition-all ${
                    errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500'
                  }`}
                  {...register('name')}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Description</label>
                <textarea
                  placeholder="Notes, specs, asset links, or checklist items..."
                  rows={3}
                  className={`mt-1.5 block w-full rounded-lg border px-3.5 py-2 text-sm text-slate-900 outline-none transition-all ${
                    errors.description ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-brand-500 focus:ring-brand-500'
                  }`}
                  {...register('description')}
                />
                {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Priority Level</label>
                  <select
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-brand-500"
                    {...register('priority')}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Due Date</label>
                  <input
                    type="date"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-brand-500"
                    {...register('dueDate')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Status</label>
                <select
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-brand-500"
                  {...register('status')}
                >
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeTaskModal}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
                >
                  {(createTaskMutation.isPending || updateTaskMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
export type { Task };
