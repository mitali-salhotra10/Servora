import React from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Download } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">SLA Adherence & Operational Analytics</h1>
            <Badge variant="success">98.5% Adherence</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Contractor performance metrics, on-time inspection completion rates, and equipment failure trends.
          </p>
        </div>

        <Button variant="outline" onClick={() => alert('Exporting CSV reports...')}>
          <Download className="w-4 h-4 mr-2" />
          Export Reports
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase">On-Time SLA</p>
          <p className="text-3xl font-extrabold text-teal-700 mt-2">98.5%</p>
          <p className="text-xs text-slate-500 mt-1">Target threshold: 95.0%</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase">Avg Resolution Time</p>
          <p className="text-3xl font-extrabold text-blue-700 mt-2">4.2 hrs</p>
          <p className="text-xs text-slate-500 mt-1">From ticket submission to dispatch</p>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold text-slate-500 uppercase">Equipment First-Pass Rate</p>
          <p className="text-3xl font-extrabold text-emerald-700 mt-2">96.8%</p>
          <p className="text-xs text-slate-500 mt-1">Passed inspection without defect</p>
        </Card>
      </div>
    </div>
  );
};
