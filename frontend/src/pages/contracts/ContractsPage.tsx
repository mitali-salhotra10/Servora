import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { contractsApi, ContractItem } from '../../api/contracts.api';
import {
  FileText,
  CheckCircle2,
  Plus
} from 'lucide-react';

export const ContractsPage: React.FC = () => {
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await contractsApi.getMyContracts();
      setContracts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load maintenance contracts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Maintenance Contracts & AMCs</h1>
            <Badge variant="info">{contracts.length} Active Contracts</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Service level agreements, recurring inspection frequencies, and contractual life-safety maintenance scope.
          </p>
        </div>

        <Button variant="primary" onClick={() => alert('New Contract onboarding')}>
          <Plus className="w-4 h-4 mr-2" />
          Create Contract
        </Button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <LoadingSpinner message="Loading maintenance contracts..." />
      ) : contracts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Contracts Found"
          description="There are currently no active maintenance contracts registered for your organization."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {contracts.map((c) => {
            const customerName = c.customer?.companyName || 'Corporate Client';
            const siteName = c.site?.siteName || 'Facility';
            const providerName = c.provider?.businessName || 'Service Provider';
            const startDate = new Date(c.startDate).toLocaleDateString();
            const endDate = new Date(c.endDate).toLocaleDateString();

            return (
              <Card key={c.id} className="p-6 border-t-4 border-t-blue-600 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded">
                      {c.contractNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 mt-2 text-base">{siteName}</h3>
                    <p className="text-xs text-slate-500">{customerName}</p>
                  </div>
                  <Badge variant={c.status === 'ACTIVE' ? 'success' : 'warning'}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {c.status}
                  </Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned Provider:</span>
                    <span className="font-medium text-slate-800">{providerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Inspection Frequency:</span>
                    <span className="font-semibold text-blue-700">{c.frequency}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Contract Term:</span>
                    <span>{startDate} – {endDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Scheduled Visits:</span>
                    <span className="font-medium text-slate-800">{c._count?.visitSchedules ?? 0}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
