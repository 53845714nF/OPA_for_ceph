import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRegister } from '../hooks/useAuthApi';

export function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('user');
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    registerMutation.mutate(
      { username, password, role },
      {
        onSuccess: () => {
          // Automatically navigate to login after successful registration
          navigate('/login', { replace: true });
        },
        onError: (err: any) => {
          setError(err.message || 'Registration failed. Please try a different username.');
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
              <span className="material-symbols-outlined text-primary text-4xl">person_add</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-display-lg text-on-background">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-on-surface-variant font-body-md">
            Register to access the decision service dashboard.
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
                  placeholder="New Username"
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

            <div>
              <label className="block text-sm font-label-md text-on-surface mb-1">Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-on-surface-variant text-sm">badge</span>
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="pl-10 appearance-none rounded-xl relative block w-full px-3 py-3 border border-outline-variant bg-surface-container-lowest text-on-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 sm:text-sm"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-label-lg rounded-xl text-on-primary bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {registerMutation.isPending ? (
                <span className="flex items-center">
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  Registering...
                </span>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-on-surface-variant">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:text-primary/80 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
