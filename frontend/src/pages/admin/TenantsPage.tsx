import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { apiClient } from '../../api/client';
import { Plus, RefreshCw, Building2 } from 'lucide-react';

interface TenantItem {
  id: string;
  name: string;
  type: 'CUSTOMER' | 'SERVICE_PROVIDER';
  contactPerson: string;
  email: string;
  phone: string;
  facilitiesCount: number;
  contractsCount: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

export const TenantsPage: React.FC = () => {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<{ success: boolean; data: TenantItem[] }>('/admin/tenants');
      setTenants(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tenant organizations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Platform Tenants & Organizations</h1>
            <Badge variant="info">{tenants.length} Registered</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Live database registry of customer corporations and verified fire safety service providers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchTenants}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => alert('Tenant onboarding is managed via administrator console')}>
            <Plus className="w-4 h-4 mr-1.5" />
            Onboard Tenant
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <LoadingSpinner message="Querying live tenant organizations from PostgreSQL..." />
      ) : tenants.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          <Building2 className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="font-semibold text-slate-700">No organizations found</p>
          <p className="text-xs text-slate-400 mt-1">New customer and provider accounts will appear here once registered.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{tenant.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Contact: {tenant.contactPerson}</p>
                  {tenant.email && <p className="text-xs text-slate-400 font-mono mt-0.5">{tenant.email}</p>}
                </div>
                <Badge variant={tenant.type === 'CUSTOMER' ? 'info' : 'success'}>
                  {tenant.type}
                </Badge>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span>{tenant.facilitiesCount} Linked Facilities • {tenant.contractsCount} Contracts</span>
                <Badge variant="neutral">ACTIVE</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
