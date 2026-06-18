import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Loader2, Compass } from 'lucide-react';

const Login = React.lazy(() => import('../features/auth/Login'));
const Register = React.lazy(() => import('../features/auth/Register'));
const Dashboard = React.lazy(() => import('../features/dashboard/Dashboard'));
const ProjectsList = React.lazy(() => import('../features/projects/ProjectsList'));
const ProjectDetails = React.lazy(() => import('../features/projects/ProjectDetails'));
const TaskList = React.lazy(() => import('../features/tasks/TaskList'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000, // Default cache time: 30 seconds
    },
  },
});

// Protect routes from unauthenticated users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
};

// Redirect authenticated users trying to access login/register
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Component level loader for lazy-loaded route screens
const SuspenseLoader: React.FC = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
  </div>
);

// Main layout template with sidebar navigation
const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Projects', path: '/projects', icon: FolderKanban },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  ];

  const email = user?.email || 'demo@taskly.app';
  const isDemo = email === 'demo@taskly.app';
  const initials = isDemo ? 'JP' : email.substring(0, 2).toUpperCase();
  const displayName = isDemo ? 'Jai Prakash' : email.split('@')[0].replace(/[^a-zA-Z]/g, ' ');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc]">
      {/* Sidebar navigation */}
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6">
        <div className="flex flex-col gap-0.5 px-2 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-brand-500" />
            <span className="text-lg font-bold tracking-tight text-slate-900">Taskly</span>
          </div>
          <span className="text-[9px] font-bold tracking-wider text-slate-400 uppercase mt-1">Project & Task Management for Freelancers</span>
        </div>

        <nav className="mt-6 flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-50 text-brand-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile / Logout */}
        <div className="mt-auto flex flex-col gap-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600 border border-slate-200 uppercase">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-800 capitalize leading-tight">{displayName}</span>
              <span className="block truncate text-xs text-slate-400 leading-tight mt-0.5">{email}</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 mt-1.5 leading-none">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                Online
              </span>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4 text-slate-400 hover:text-red-500" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-10 py-8">
        <Suspense fallback={<SuspenseLoader />}>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/projects/:id" element={<ProjectDetails />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={
            <div className="flex h-screen w-screen items-center justify-center bg-[#f8fafc]">
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            </div>
          }>
            <Routes>
              {/* Public Auth routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              {/* Protected dashboard pages */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
