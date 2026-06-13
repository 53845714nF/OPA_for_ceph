import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useLogin } from '../hooks/useAuthApi';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const loginMutation = useLogin();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    loginMutation.mutate(
      { username, password },
      {
        onSuccess: () => {
          navigate(from, { replace: true });
        },
        onError: () => {
          setError('Login failed. Please check your username and password.');
        }
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-container-low px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-surface p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-outline-variant/30">
        <div>
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-4xl">admin_panel_settings</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-display-lg text-on-background">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-on-surface-variant font-body-md">
            Sign in to access the decision service dashboard.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-error/10 border-l-4 border-error p-4 rounded-md">
              <div className="flex items-center">
                <span className="material-symbols-outlined text-error mr-3">error</span>
                <p className="text-sm text-error font-medium">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-label-md text-on-surface mb-1">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">person</span>
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 appearance-none rounded-xl relative block w-full px-3 py-3 border border-outline-variant bg-surface-container-lowest placeholder-on-surface-variant/50 text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-label-md text-on-surface mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">lock</span>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 appearance-none rounded-xl relative block w-full px-3 py-3 border border-outline-variant bg-surface-container-lowest placeholder-on-surface-variant/50 text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-label-lg rounded-xl text-on-primary bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loginMutation.isPending ? (
                <span className="flex items-center">
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-on-surface-variant">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
