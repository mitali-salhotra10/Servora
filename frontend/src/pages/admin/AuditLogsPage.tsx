import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { apiClient } from '../../api/client';
import { ShieldCheck, Hash, RefreshCw, Activity } from 'lucide-react';

interface AuditLogItem {
  id: string;
  action: string;
  actorEmail: string;
  targetResource: string;
  ipAddress: string;
  timestamp: string;
  recordHash: string;
}

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<{ success: boolean; data: AuditLogItem[] }>('/admin/audit-logs');
      setLogs(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve audit trail');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Security Audit Trail & Evidence Log</h1>
            <Badge variant="success">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Live PostgreSQL Trail
            </Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Immutable, append-only security log tracking every authentication event, inspection signature, and compliance mutation.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchAuditLogs}>
          <RefreshCw className="w-4 h-4 mr-1.5" />
          Refresh Audit Trail
        </Button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <LoadingSpinner message="Querying live audit trail from PostgreSQL..." />
      ) : logs.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          <Activity className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="font-semibold text-slate-700">No audit events recorded yet</p>
          <p className="text-xs text-slate-400 mt-1">Login events, inspection submissions, and certificate creations will be recorded here.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event Action</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Cryptographic Seal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <Badge variant={log.action.includes('FAIL') ? 'danger' : 'info'}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{log.actorEmail}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.targetResource}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{log.ipAddress}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      {log.recordHash && log.recordHash !== 'N/A' ? (
                        <div className="flex items-center space-x-1 font-mono text-[10px] text-slate-400">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span title={log.recordHash}>{log.recordHash.slice(0, 16)}...</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
