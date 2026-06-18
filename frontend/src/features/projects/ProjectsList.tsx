import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Plus, Search, Edit3, Trash2, Calendar, Folder, ArrowLeft, ArrowRight, Loader2, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Zod schema for project forms matching backend rules
const projectFormSchema = z.object({
  name: z.string().trim().min(1, 'Project name is required.').max(100),
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

type ProjectFormFields = z.infer<typeof projectFormSchema>;

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  totalTasks?: number;
  completedTasks?: number;
  completionPercentage?: number;
}

const ProjectsList: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Listing Query State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormFields>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      status: 'NOT_STARTED',
    }
  });

  // Query to fetch projects list
  const { data, isLoading, isError } = useQuery({
    queryKey: ['projects', { search, statusFilter, sortBy, page }],
    queryFn: async () => {
      const response = await api.get('/projects', {
        params: { search, status: statusFilter, sortBy, page },
      });
      return response.data.data;
    },
    staleTime: 60000, // Caching projects data for 60 seconds
  });

  // Create Project Mutation
  const createMutation = useMutation({
    mutationFn: async (newProject: ProjectFormFields) => {
      const response = await api.post('/projects', newProject);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
  });

  // Update Project Mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedProject: ProjectFormFields & { id: string }) => {
      const response = await api.put(`/projects/${updatedProject.id}`, updatedProject);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
  });

  // Soft Delete Project Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const openCreateModal = () => {
    setEditingProject(null);
    reset({
      name: '',
      description: '',
      status: 'NOT_STARTED',
      startDate: '',
      endDate: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation(); // Stop navigation click
    setEditingProject(project);
    reset({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleFormSubmit = (fields: ProjectFormFields) => {
    if (editingProject) {
      updateMutation.mutate({ ...fields, id: editingProject.id });
    } else {
      createMutation.mutate(fields);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this project? This will also soft-delete all its tasks.')) {
      deleteMutation.mutate(id);
    }
  };

  const projects: Project[] = data?.projects || [];
  const pagination = data?.pagination || { total: 0, page: 1, pages: 1 };

  const statusBadges = {
    NOT_STARTED: 'bg-slate-100 text-slate-700 border-slate-200',
    IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  };

  const statusLabels = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Client Projects</h1>
          <p className="text-sm text-slate-500">Track and manage client contracts, progress, and pipeline.</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 focus:outline-none"
        >
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      {/* Search and filter controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects by name..."
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
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
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
          <option value="oldest">Oldest First</option>
          <option value="name">Project Name</option>
        </select>
      </div>

      {/* Main Grid View */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
              <div className="space-y-2.5">
                <div className="h-4.5 w-2/3 rounded bg-slate-100" />
                <div className="h-3.5 w-full rounded bg-slate-100" />
                <div className="h-3.5 w-5/6 rounded bg-slate-100" />
              </div>
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between">
                  <div className="h-3 w-24 rounded bg-slate-100" />
                  <div className="h-3 w-8 rounded bg-slate-100" />
                </div>
                <div className="h-1.5 w-full rounded bg-slate-100" />
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                <div className="h-5 w-16 rounded-full bg-slate-100" />
                <div className="h-3.5 w-20 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center space-y-3 max-w-md mx-auto shadow-sm">
          <div className="text-red-800 font-semibold text-sm">Failed to load project database.</div>
          <p className="text-xs text-red-600">Please check your internet connection and try again.</p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['projects'] })}
            className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Retry Connection
          </button>
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 px-4 text-center shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
            <Folder className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-slate-900">No projects yet</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm">
            Create your first client project to start mapping deliverables and tracking pipeline details.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-6 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600"
          >
            Create your first client project
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openEditModal(project, e)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 h-10">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                {/* Project Progress bar (displayed if project has deliverables) */}
                {project.totalTasks !== undefined && project.totalTasks > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>{project.completedTasks} of {project.totalTasks} Tasks Complete</span>
                      <span className="text-brand-600">{project.completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/30">
                      <div 
                        className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${project.completionPercentage}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs">
                  <span className={`rounded-full border px-2 py-0.5 font-medium ${statusBadges[project.status]}`}>
                    {statusLabels[project.status]}
                  </span>
                  <div className="flex items-center gap-1 text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{formatDate(project.startDate)}</span>
                  </div>
                </div>
              </Link>
            ))}
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

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingProject ? 'Edit Project Settings' : 'Create Client Project'}
              </h2>
              <button onClick={closeModal} className="rounded p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Coastline Cafe Website"
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
                  placeholder="Scope of work, deliverables, or pricing agreements..."
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Start Date</label>
                  <input
                    type="date"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-brand-500"
                    {...register('startDate')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">End Date</label>
                  <input
                    type="date"
                    className="mt-1.5 block w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-brand-500"
                    {...register('endDate')}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Pipeline Status</label>
                <select
                  className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 outline-none transition-all focus:border-brand-500 focus:ring-brand-500"
                  {...register('status')}
                >
                  <option value="NOT_STARTED">Not Started</option>
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
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
export type { Project };
