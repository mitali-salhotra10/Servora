import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { visitsApi } from '../../api/visits.api';
import {
  FileCheck,
  ShieldCheck,
  Clock,
  User
} from 'lucide-react';

interface HistoryItem {
  id: string;
  checkInTimestamp: string;
  checkOutTimestamp: string | null;
  recordHash: string;
  isGeofenceVerified: boolean;
  customerSignerName: string | null;
  technicianNotes: string | null;
  visitSchedule?: {
    id: string;
    visitType: string;
    status: string;
    site?: {
      id: string;
      siteName: string;
      address: string;
      city: string;
    };
    assignedTechnician?: {
      id: string;
      email: string;
      phone: string;
    };
    contract?: {
      id: string;
      contractNumber: string;
    };
  };
  checklistResponses?: Array<{
    id: string;
    passedInspection: boolean;
  }>;
}

export const ServiceHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await visitsApi.getHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load inspection history');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Completed Inspection History & Sealed Audits</h1>
            <Badge variant="success">Immutable Audit Trail</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Historical life-safety inspections with cryptographic SHA-256 seal proofs, GPS geofence checks, and signed records.
          </p>
        </div>
        <div>
          <Badge variant="info">{history.length} Sealed Records</Badge>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <LoadingSpinner message="Querying sealed inspection records..." />
      ) : history.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No Inspection History Yet"
          description="Completed field visits and certified inspection records will appear here once executed and sealed."
        />
      ) : (
        <div className="space-y-4">
          {history.map((record) => {
            const siteName = record.visitSchedule?.site?.siteName || 'Facility';
            const techEmail = record.visitSchedule?.assignedTechnician?.email || 'Certified Field Technician';
            const completedDate = new Date(record.checkInTimestamp).toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            const totalItems = record.checklistResponses?.length ?? 0;
            const passedItems = record.checklistResponses?.filter(r => r.passedInspection).length ?? 0;
            const hasDefects = totalItems > passedItems;

            return (
              <Card key={record.id} className="p-5 hover:border-slate-300 transition">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {record.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge variant={hasDefects ? 'warning' : 'success'}>
                        {hasDefects ? 'DEFECTS NOTED' : 'PASS'}
                      </Badge>
                      {record.isGeofenceVerified && (
                        <Badge variant="info">GPS GEOFENCE VERIFIED</Badge>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">{siteName}</h3>
                    <p className="text-xs text-slate-500 flex items-center space-x-3">
                      <span className="flex items-center">
                        <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {techEmail}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {completedDate}
                      </span>
                      {record.customerSignerName && (
                        <>
                          <span>•</span>
                          <span>Signed by: {record.customerSignerName}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center space-x-6 text-xs text-slate-600">
                    <div className="text-center">
                      <div className="font-bold text-slate-900 text-sm">{totalItems}</div>
                      <div className="text-[11px] text-slate-400">Items Inspected</div>
                    </div>

                    <div className="text-left font-mono text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
                      <div className="text-slate-400 text-[10px] flex items-center mb-0.5">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 mr-1" />
                        SHA-256 RECORD HASH
                      </div>
                      <span className="text-slate-700 select-all" title={record.recordHash}>
                        {record.recordHash.slice(0, 24)}...
                      </span>
                    </div>
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
