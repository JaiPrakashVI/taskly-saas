import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Compass, Loader2, Mail, Lock } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

type LoginFields = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if redirected because of expired session
  const isSessionExpired = searchParams.get('expired') === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/login', data);
      const { token, user } = response.data.data;
      login(token, user);
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed. Please verify credentials.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-8 animate-fadeIn">
      <div className="w-full max-w-md space-y-6">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
            <Compass className="h-5.5 w-5.5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Welcome back to Taskly
            </h2>
            <p className="text-sm text-slate-500">
              Project & Task Management for Freelancers
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
          {isSessionExpired && (
            <div className="rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-800 border border-amber-200">
              Your login session has expired. Please log in again.
            </div>
          )}

          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-800 border border-red-200">
              {serverError}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Email field */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  disabled={isSubmitting}
                  className={`block w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                  }`}
                  placeholder="name@company.com"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password field */}
            <div className="space-y-1">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  disabled={isSubmitting}
                  className={`block w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                  }`}
                  placeholder="Enter password"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Logging in...
                </>
              ) : (
                'Log in'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-500 transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
