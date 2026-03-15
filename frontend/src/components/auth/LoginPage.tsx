/**
 * LoginPage - User authentication page
 *
 * Features:
 * - Email/password login
 * - Third-party login placeholders
 * - Error handling and loading states
 * - Remember me option
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { User } from '@/types/global';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // For demo purposes, accept any valid-looking credentials
    if (email.includes('@') && password.length >= 6) {
      const user: User = {
        id: crypto.randomUUID(),
        name: email.split('@')[0],
        email: email,
        preferences: {
          theme: 'system',
          defaultGranularity: 'daily',
          defaultIndex: 'time',
        },
        coldStartCompleted: false,
      };
      onLogin(user);
    } else {
      setError('Invalid email or password. Password must be at least 6 characters.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/20 rounded-2xl border border-blue-500/30 mb-4"
          >
            <Activity className="w-8 h-8 text-blue-500" />
          </motion.div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Welcome to MemoryLib
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            Sign in to continue to your memory space
          </p>
        </div>

        {/* Login form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-8"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500/30"
                />
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Remember me</span>
              </label>
              <button
                type="button"
                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200 dark:border-zinc-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Third-party login */}
          <div className="grid grid-cols-3 gap-3">
            <button
              disabled
              className="py-2.5 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-400 text-sm font-medium opacity-50 cursor-not-allowed"
            >
              Google
            </button>
            <button
              disabled
              className="py-2.5 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-400 text-sm font-medium opacity-50 cursor-not-allowed"
            >
              GitHub
            </button>
            <button
              disabled
              className="py-2.5 px-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-400 text-sm font-medium opacity-50 cursor-not-allowed"
            >
              WeChat
            </button>
          </div>
          <p className="text-xs text-zinc-400 text-center mt-3">
            Third-party login coming soon
          </p>

          {/* Sign up link */}
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
            Don't have an account?{' '}
            <button className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
              Sign up
            </button>
          </p>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-400 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}