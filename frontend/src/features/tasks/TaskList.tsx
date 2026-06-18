import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Plus, Search, CheckSquare, Square, Edit3, Trash2, ArrowLeft, ArrowRight, Loader2, X, FolderKanban } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Project } from '../projects/ProjectsList';
import type { Task } from '../projects/ProjectDetails';

// Zod schema for task creation/update on standalone page
const standaloneTaskFormSchema = z.object({
  name: z.string().trim().min(1, 'Task name is required.').max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED']),
  dueDate: z.string().optional().nullable(),
  projectId: z.string().uuid('Please select a valid project.'),
});

type StandaloneTaskFormFields = z.infer<typeof standaloneTaskFormSchema>;

const TaskList: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StandaloneTaskFormFields>({
    resolver: zodResolver(standaloneTaskFormSchema),
    defaultValues: {
      priority: 'MEDIUM',
      status: 'PENDING',
    }
  });

  // Query: Get all active projects (for project filters and create/edit project dropdown)
  const { data: projectsData, refetch: refetchProjects } = useQuery({
    queryKey: ['projects', { limit: 100 }], // Fetch all for dropdown
    queryFn: async () => {
      const response = await api.get('/projects', { params: { limit: 100 } });
      return response.data.data;
    },
    staleTime: 60000,
  });
  const projectsList: Project[] = projectsData?.projects || [];

  // Query: Fetch all tasks with current filters
  const { data: tasksData, isLoading, isError, refetch: refetchTasks } = useQuery({
    queryKey: ['all-tasks', { search, statusFilter, priorityFilter, projectFilter, sortBy, page }],
    queryFn: async () => {
      const response = await api.get('/tasks', {
        params: {
          search,
          status: statusFilter,
          priority: priorityFilter,
          projectId: projectFilter || undefined,
          sortBy,
          page,
        },
      });
      return response.data.data;
    },
    staleTime: 30000,
  });

  // Mutation: Toggle Task Status (WITH OPTIMISTIC UI)
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' }) => {
      const response = await api.put(`/tasks/${id}`, { status });
      return response.data.data;
    },
    onMutate: async (updatedTaskInfo) => {
      const queryKey = ['all-tasks', { search, statusFilter, priorityFilter, projectFilter, sortBy, page }];
      await queryClient.cancelQueries({ queryKey });

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

      return { previousTasksData, queryKey };
    },
    onError: (_err, _newTodo, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousTasksData);
      }
      alert('Failed to update task status. Changes rolled back.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  // Mutation: Create Task
  const createTaskMutation = useMutation({
    mutationFn: async (fields: StandaloneTaskFormFields) => {
      const response = await api.post('/tasks', fields);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
  });

  // Mutation: Update Task
  const updateTaskMutation = useMutation({
    mutationFn: async (fields: StandaloneTaskFormFields & { id: string }) => {
      const response = await api.put(`/tasks/${fields.id}`, fields);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
  });

  // Mutation: Soft Delete Task
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const openCreateModal = () => {
    setEditingTask(null);
    reset({
      name: '',
      description: '',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '',
      projectId: projectsList[0]?.id || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    reset({
      name: task.name,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      projectId: task.projectId,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleFormSubmit = (fields: StandaloneTaskFormFields) => {
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

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      deleteTaskMutation.mutate(id);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-700 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'LOW': return 'text-slate-600 bg-slate-50 border-slate-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">All Deliverables</h1>
          <p className="text-sm text-slate-500">Track task statuses and deadlines across all client projects.</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={projectsList.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 focus:outline-none disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> New Task
        </button>
      </div>

      {/* Filter and search controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks by name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 py-1.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder:text-slate-400"
          />
        </div>

        <select
          value={projectFilter}
          onChange={(e) => {
            setProjectFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition-all focus:border-brand-500 focus:ring-1 focus:ring-brand-500 max-w-[180px]"
        >
          <option value="">All Projects</option>
          {projectsList.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

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

      {/* Main Task List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 h-14 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="h-5 w-5 rounded bg-slate-100" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                  <div className="h-3 w-1/4 rounded bg-slate-100" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-5 w-14 rounded bg-slate-100" />
                <div className="h-5 w-20 rounded bg-slate-100" />
                <div className="h-5 w-8 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center space-y-3 max-w-md mx-auto shadow-sm my-12">
          <div className="text-red-800 font-semibold text-sm">Failed to load tasks database.</div>
          <p className="text-xs text-red-600">Please check your internet connection and try again.</p>
          <button
            onClick={() => {
              refetchTasks();
              refetchProjects();
            }}
            className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Retry Connection
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No deliverables found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            {projectsList.length === 0
              ? "You need to create a project first before you can add deliverables."
              : "No deliverables match the filters. Try adding a new task to organize your workspace."}
          </p>
          {projectsList.length === 0 ? (
            <Link
              to="/projects"
              className="mt-6 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
            >
              Create a project
            </Link>
          ) : (
            <button
              onClick={openCreateModal}
              className="mt-6 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
            >
              Add first task
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <ul className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const isCompleted = task.status === 'COMPLETED';
                const dateBadge = getDueDateBadge(task.dueDate, task.status);
                // Find parent project name in projectsList
                const parentProjectName = (task as any).project?.name || 'Project';

                return (
                  <li
                    key={task.id}
                    className={`flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 p-4 transition-colors hover:bg-slate-50/50 ${
                      isCompleted ? 'bg-slate-50/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 w-full md:w-auto">
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
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <FolderKanban className="h-2.5 w-2.5" /> {parentProjectName}
                          </span>
                          {task.description && (
                            <span className={`text-xs text-slate-400 block line-clamp-1 ${isCompleted ? 'text-slate-300' : ''}`}>
                              {task.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-3.5 ml-8 md:ml-0 md:shrink-0 text-xs">
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
                          onClick={() => openEditModal(task)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
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

      {/* Task Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingTask ? 'Edit Deliverable' : 'Add Client Deliverable'}
              </h2>
              <button onClick={closeModal} className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Parent Project</label>
                <select
                  disabled={!!editingTask} // Lock project selection during edits
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-brand-500 disabled:bg-slate-50"
                  {...register('projectId')}
                >
                  {projectsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {errors.projectId && <p className="mt-1 text-xs text-red-600">{errors.projectId.message}</p>}
              </div>

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
                  onClick={closeModal}
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

export default TaskList;
