import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi, DashboardMetricsResponse } from '../api/dashboard.api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { CustomerDashboardView } from '../components/dashboard/CustomerDashboardView';
import { TechnicianDashboardView } from '../components/dashboard/TechnicianDashboardView';
import { ManagerDashboardView } from '../components/dashboard/ManagerDashboardView';
import { AdminDashboardView } from '../components/dashboard/AdminDashboardView';
import {
  Wrench,
  Plus,
  Calendar,
  RefreshCw
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = user?.role || 'CUSTOMER';

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await dashboardApi.getMetrics();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend service');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const displayName =
    user?.customerProfile?.contactPersonName ||
    user?.providerProfile?.businessName ||
    user?.email;

  const currentMetrics = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Welcome, {displayName}</h1>
            <Badge variant="info">{role}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {role === 'CUSTOMER'
              ? 'Monitor your facilities, track life-safety equipment, view compliance analytics, and submit service requests.'
              : role === 'SERVICE_PROVIDER'
              ? 'Review assigned inspection manifests, GPS geofenced check-in, and equipment QR checklists.'
              : role === 'SERVICE_MANAGER'
              ? 'Manage maintenance contracts, dispatch technician schedules, and monitor SLA performance analytics.'
              : 'Platform governance, tenant registry, system diagnostics, and cryptographic trust chain logs.'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {role === 'CUSTOMER' && (
            <>
              <Link to="/requests">
                <Button variant="primary">
                  <Wrench className="w-4 h-4 mr-1.5" />
                  Report Issue / Defect
                </Button>
              </Link>
              <Link to="/sites/new">
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Register Facility
                </Button>
              </Link>
            </>
          )}

          {role === 'SERVICE_PROVIDER' && (
            <Link to="/visits">
              <Button variant="primary">
                <Calendar className="w-4 h-4 mr-1.5" />
                Open Field Manifest
              </Button>
            </Link>
          )}

          {role === 'SERVICE_MANAGER' && (
            <Link to="/visits">
              <Button variant="primary">
                <Calendar className="w-4 h-4 mr-1.5" />
                Dispatch Visits
              </Button>
            </Link>
          )}

          {role === 'ADMIN' && (
            <Link to="/sites/new">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-1.5" />
                Register New Facility
              </Button>
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
          <ErrorMessage message={error} onDismiss={() => setError(null)} />
          <Button variant="outline" size="sm" onClick={fetchDashboardData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <LoadingSpinner message="Loading live operational metrics..." />
      ) : (
        <>
          {role === 'CUSTOMER' && <CustomerDashboardView metrics={currentMetrics as any} />}
          {role === 'SERVICE_PROVIDER' && <TechnicianDashboardView metrics={currentMetrics as any} />}
          {role === 'SERVICE_MANAGER' && <ManagerDashboardView metrics={currentMetrics as any} />}
          {role === 'ADMIN' && <AdminDashboardView metrics={currentMetrics as any} />}
        </>
      )}
    </div>
  );
};
