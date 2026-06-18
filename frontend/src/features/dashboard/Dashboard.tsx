import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Folder, CheckSquare, Clock, AlertCircle, Percent, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Task } from '../projects/ProjectDetails';

interface Activity {
  id: string;
  type: 'TASK_COMPLETED' | 'TASK_CREATED' | 'TASK_UPDATED' | 'PROJECT_CREATED' | 'PROJECT_UPDATED';
  message: string;
  projectName: string;
  timestamp: string;
}

interface DashboardStats {
  totalProjects: number;
  projectsInProgress: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completionPercentage: number;
  recentTasks: Task[];
  recentActivities?: Activity[];
}

const Dashboard: React.FC = () => {
  // Query dashboard statistics with 60 seconds staleTime
  const { data: stats, isLoading, isError, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard');
      return response.data.data;
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Welcome header skeleton */}
        <div>
          <div className="h-7 w-48 rounded bg-slate-100" />
          <div className="h-4 w-96 rounded bg-slate-100 mt-2" />
        </div>

        {/* Stats Cards Grid skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-24 rounded bg-slate-100" />
                <div className="h-7 w-7 rounded bg-slate-100 animate-pulse" />
              </div>
              <div className="h-8 w-16 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        {/* Chart and Activity Grid skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Doughnut Chart Card skeleton */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-[360px] space-y-4">
            <div className="space-y-1.5">
              <div className="h-4.5 w-48 rounded bg-slate-100" />
              <div className="h-3.5 w-64 rounded bg-slate-100" />
            </div>
            <div className="flex items-center justify-center h-[220px]">
              <div className="h-36 w-36 rounded-full border-12 border-slate-100 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          </div>

          {/* Recent Activity Card skeleton */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm min-h-[360px] space-y-4">
            <div className="space-y-1.5">
              <div className="h-4.5 w-48 rounded bg-slate-100" />
              <div className="h-3.5 w-64 rounded bg-slate-100" />
            </div>
            <div className="space-y-3 mt-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                    <div className="h-3 w-16 rounded bg-slate-100" />
                  </div>
                  <div className="h-3 w-12 rounded bg-slate-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 text-center space-y-3 max-w-md mx-auto shadow-sm my-12">
        <div className="text-red-800 font-semibold text-sm">Failed to load dashboard metrics.</div>
        <p className="text-xs text-red-600">Please check your internet connection and try again.</p>
        <button
          onClick={() => refetch()}
          className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Cards layout for stats
  const statCards = [
    { title: 'Total Projects', value: stats.totalProjects, icon: Folder, color: 'text-slate-600 bg-slate-50 border-slate-200' },
    { title: 'Projects In Progress', value: stats.projectsInProgress, icon: Clock, color: 'text-blue-600 bg-blue-50/50 border-blue-100' },
    { title: 'Total Deliverables', value: stats.totalTasks, icon: CheckSquare, color: 'text-slate-600 bg-slate-50 border-slate-200' },
    { title: 'Completed Tasks', value: stats.completedTasks, icon: CheckSquare, color: 'text-green-600 bg-green-50/50 border-green-100' },
    { title: 'Pending Tasks', value: stats.pendingTasks, icon: AlertCircle, color: 'text-amber-600 bg-amber-50/50 border-amber-100' },
    { title: 'Completion Rate', value: `${stats.completionPercentage}%`, icon: Percent, color: 'text-brand-600 bg-brand-50/50 border-brand-100' },
  ];

  // Recharts Doughnut configuration for Task Status Distribution
  const chartData = [
    { name: 'Completed', value: stats.completedTasks, color: '#10b981' },    // Green-500
    { name: 'Pending', value: stats.pendingTasks, color: '#f59e0b' },       // Amber-500
    { name: 'In Progress', value: stats.inProgressTasks, color: '#3b82f6' }, // Blue-500
  ].filter(item => item.value > 0);

  const totalTasksForChart = stats.pendingTasks + stats.inProgressTasks + stats.completedTasks;
  const isChartEmpty = chartData.length === 0;

  // Custom legend items calculating absolute counts and relative percentages
  const legendData = [
    {
      name: 'Completed',
      value: stats.completedTasks,
      percentage: totalTasksForChart > 0 ? Math.round((stats.completedTasks / totalTasksForChart) * 100) : 0,
      color: '#10b981',
    },
    {
      name: 'Pending',
      value: stats.pendingTasks,
      percentage: totalTasksForChart > 0 ? Math.round((stats.pendingTasks / totalTasksForChart) * 100) : 0,
      color: '#f59e0b',
    },
    {
      name: 'In Progress',
      value: stats.inProgressTasks,
      percentage: totalTasksForChart > 0 ? Math.round((stats.inProgressTasks / totalTasksForChart) * 100) : 0,
      color: '#3b82f6',
    },
  ];

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const secondsDiff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsDiff < 0) return 'Just now';
    if (secondsDiff < 60) return `${secondsDiff}s ago`;
    const minutesDiff = Math.floor(secondsDiff / 60);
    if (minutesDiff < 60) return `${minutesDiff}m ago`;
    const hoursDiff = Math.floor(minutesDiff / 60);
    if (hoursDiff < 24) return `${hoursDiff}h ago`;
    const daysDiff = Math.floor(hoursDiff / 24);
    if (daysDiff === 1) return 'Yesterday';
    if (daysDiff < 7) return `${daysDiff}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const getSubtleInsight = () => {
    if (stats.completedTasks === stats.totalTasks && stats.totalTasks > 0) {
      return "All deliverables have been completed successfully.";
    }
    if (stats.completionPercentage >= 50) {
      return `More than half of deliverables (${stats.completionPercentage}%) have been completed.`;
    }
    if (stats.inProgressTasks > 0) {
      return `${stats.inProgressTasks} task${stats.inProgressTasks > 1 ? 's remain' : ' remains'} in progress across active client projects.`;
    }
    return "Tasks are defined. Ready to begin development progress.";
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Freelancer Workspace</h1>
        <p className="text-sm text-slate-500">Overview of client commitments, progress rates, and tasks.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.title}</span>
                <div className={`rounded-lg border p-1.5 ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-950">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Aggregated Doughnut Chart and Recent Activity Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Doughnut Chart Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-slate-400">Deliverable Status Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ratio of completed vs pending client tasks.</p>
          </div>

          <div className="flex-1 flex flex-col justify-center mt-2">
            {isChartEmpty ? (
              <div className="text-center text-sm text-slate-400 space-y-1 py-12">
                <p>No deliverables recorded.</p>
                <p className="text-xs">Create tasks inside your projects to populate analytics.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Left: Donut Chart with center label */}
                <div className="w-full sm:w-1/2 flex justify-center">
                  <div className="relative flex items-center justify-center h-[180px] w-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={78}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                          itemStyle={{ fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Center Label */}
                    <div className="absolute flex flex-col items-center justify-center pointer-events-none select-none">
                      <span className="text-2xl font-bold tracking-tight text-slate-900 leading-none">{stats.completionPercentage}%</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">Completed</span>
                    </div>
                  </div>
                </div>

                {/* Right: Legend & Summary Section */}
                <div className="w-full sm:w-1/2 space-y-4">
                  {/* Custom Legend */}
                  <div className="space-y-1.5">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Status Breakdowns</h4>
                    <div className="space-y-1.5">
                      {legendData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs pb-1 border-b border-slate-50 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="font-medium text-slate-700">{item.name}</span>
                          </div>
                          <span className="text-slate-500 font-semibold">
                            {item.value} ({item.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Compact Task Summary */}
                  <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                    <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Task Summary</h4>
                    <ul className="grid grid-cols-3 gap-1.5 text-center text-xs font-semibold text-slate-600">
                      <li className="bg-slate-50 rounded p-1 border border-slate-100">
                        <span className="block text-green-600 font-bold text-sm">{stats.completedTasks}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-medium">Done</span>
                      </li>
                      <li className="bg-slate-50 rounded p-1 border border-slate-100">
                        <span className="block text-amber-600 font-bold text-sm">{stats.pendingTasks}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-medium">Pend</span>
                      </li>
                      <li className="bg-slate-50 rounded p-1 border border-slate-100">
                        <span className="block text-blue-600 font-bold text-sm">{stats.inProgressTasks}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-medium">Actv</span>
                      </li>
                    </ul>
                  </div>

                  {/* Subtle Insight Text */}
                  <div className="bg-slate-50/50 rounded-lg p-2 border border-slate-100 text-[10px] text-slate-500 italic font-medium leading-normal">
                    💡 {getSubtleInsight()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between min-h-[360px]">
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider text-slate-400">Recent Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Chronological updates from your projects and tasks.</p>
          </div>

          <div className="flex-1 mt-4">
            {(!stats.recentActivities || stats.recentActivities.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-8">
                <p className="text-sm text-slate-400">No activity yet</p>
                <p className="text-xs text-slate-300">Updates will show up here as you work on tasks.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {stats.recentActivities.map((activity) => (
                  <li key={activity.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-800 truncate block">
                        {activity.message}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mt-0.5">
                        {activity.projectName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatTimeAgo(activity.timestamp)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 mt-auto">
            <Link
              to="/tasks"
              className="flex items-center justify-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-500 transition-colors"
            >
              Go to all deliverables <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
