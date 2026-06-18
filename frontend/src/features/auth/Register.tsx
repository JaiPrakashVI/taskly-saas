import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Compass, Loader2, Check, X, Mail, Lock } from 'lucide-react';

const registerSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ['confirmPassword'],
});

type RegisterFields = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { login, viewDemo } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDemoSubmitting, setIsDemoSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
  });

  const passwordVal = watch('password', '');

  // Validation feedback indicators
  const validations = {
    length: passwordVal.length >= 8,
    upper: /[A-Z]/.test(passwordVal),
    lower: /[a-z]/.test(passwordVal),
    number: /[0-9]/.test(passwordVal),
  };

  const onSubmit = async (data: RegisterFields) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const response = await api.post('/auth/register', {
        email: data.email,
        password: data.password,
      });
      const { token, user } = response.data.data;
      login(token, user);
      navigate('/dashboard');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Registration failed. Please check inputs.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setServerError(null);
    setIsDemoSubmitting(true);
    try {
      await viewDemo();
      navigate('/dashboard');
    } catch (error: any) {
      setServerError('Failed to connect to the demo account. Please try again.');
    } finally {
      setIsDemoSubmitting(false);
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
              Create your Taskly account
            </h2>
            <p className="text-sm text-slate-500">
              Project & Task Management for Freelancers
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
          {serverError && (
            <div className="rounded-lg bg-red-50 p-3 text-xs font-medium text-red-800 border border-red-200">
              {serverError}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {/* Email field */}
            <div className="space-y-1">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  disabled={isSubmitting || isDemoSubmitting}
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
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  disabled={isSubmitting || isDemoSubmitting}
                  className={`block w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                  }`}
                  placeholder="••••••••"
                  {...register('password')}
                />
              </div>
              
              {/* Visual checklist feedback for password strength */}
              {passwordVal.length > 0 && (
                <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password requirements</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      {validations.length ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-slate-300" />
                      )}
                      <span className={validations.length ? 'text-green-700 font-medium' : 'text-slate-500'}>8+ Characters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {validations.upper ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-slate-300" />
                      )}
                      <span className={validations.upper ? 'text-green-700 font-medium' : 'text-slate-500'}>1 Uppercase</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {validations.lower ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-slate-300" />
                      )}
                      <span className={validations.lower ? 'text-green-700 font-medium' : 'text-slate-500'}>1 Lowercase</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {validations.number ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-slate-300" />
                      )}
                      <span className={validations.number ? 'text-green-700 font-medium' : 'text-slate-500'}>1 Number</span>
                    </div>
                  </div>
                </div>
              )}
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password field */}
            <div className="space-y-1">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  id="confirmPassword"
                  type="password"
                  disabled={isSubmitting || isDemoSubmitting}
                  className={`block w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                      : 'border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                  }`}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isDemoSubmitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Registering...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <span className="relative bg-white px-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Or explore instantly
            </span>
          </div>

          <button
            onClick={handleDemoLogin}
            disabled={isSubmitting || isDemoSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-100 disabled:opacity-50"
          >
            {isDemoSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" /> Loading Demo...
              </>
            ) : (
              'View Demo Workspace'
            )}
          </button>
        </div>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500 transition-colors">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
