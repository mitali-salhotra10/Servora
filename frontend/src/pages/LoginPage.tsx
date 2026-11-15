import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }

    setIsLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Sign in to Servora</h2>
        <p className="mt-2 text-sm text-slate-400">
          Field-Service Maintenance & Life-Safety Compliance Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10 border border-slate-200">
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-6" />}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <Input
                label="Email address"
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tech@contractor.com"
              />
            </div>

            <div>
              <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Pilot Accounts Helper */}
          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 text-center">
              Pilot Testing Accounts (Click to Fill)
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setEmail('facilities@apexcommerce.com');
                  setPassword('Password123!');
                }}
                className="p-2 border border-slate-200 rounded hover:bg-slate-50 text-left transition"
              >
                <div className="font-semibold text-slate-800">Customer (Facility Mgr)</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">facilities@apexcommerce.com</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('tech.davis@redshieldfire.com');
                  setPassword('Password123!');
                }}
                className="p-2 border border-slate-200 rounded hover:bg-slate-50 text-left transition"
              >
                <div className="font-semibold text-blue-700">Technician (Field)</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">tech.davis@redshieldfire.com</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('manager@redshieldfire.com');
                  setPassword('Password123!');
                }}
                className="p-2 border border-slate-200 rounded hover:bg-slate-50 text-left transition"
              >
                <div className="font-semibold text-emerald-700">Service Manager</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">manager@redshieldfire.com</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@servora.app');
                  setPassword('Password123!');
                }}
                className="p-2 border border-slate-200 rounded hover:bg-slate-50 text-left transition"
              >
                <div className="font-semibold text-purple-700">Administrator</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">admin@servora.app</div>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Default password: <code className="font-mono text-slate-600 bg-slate-100 px-1 py-0.5 rounded">Password123!</code>
            </p>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-5 text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Register as Customer or Contractor
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
