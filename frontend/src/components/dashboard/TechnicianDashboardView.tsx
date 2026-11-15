import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  QrCode,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  ArrowRight,
  ClipboardList,
  BarChart3,
  PieChart
} from 'lucide-react';
import {
  CircularProgressGauge,
  DistributionBar,
  SimpleBarChart
} from './DashboardCharts';

interface TechnicianDashboardProps {
  metrics: {
    todayVisits: number;
    pendingInspections: number;
    completedInspections: number;
    failedOrFlaggedInspections: number;
    pendingSyncCount: number;
    nextAssignedVisit: {
      id: string;
      siteName: string;
      address: string;
      scheduledDate: string;
      status: string;
    } | null;
    recentVisits?: Array<{
      id: string;
      siteName: string;
      scheduledDate: string;
      status: string;
    }>;
  };
}

export const TechnicianDashboardView: React.FC<TechnicianDashboardProps> = ({ metrics }) => {
  const navigate = useNavigate();

  const inspectionVerdicts = [
    { label: 'Verified Pass', count: 48, color: 'bg-emerald-500', pct: 92 },
    { label: 'Pass w/ Remarks', count: 3, color: 'bg-amber-500', pct: 6 },
    { label: 'Defect Flagged', count: 1, color: 'bg-rose-500', pct: 2 }
  ];

  const weeklyExecution = [
    { label: 'Mon', value: 8, secondaryValue: 8 },
    { label: 'Tue', value: 12, secondaryValue: 11 },
    { label: 'Wed', value: 9, secondaryValue: 9 },
    { label: 'Thu', value: 14, secondaryValue: 14 },
    { label: 'Fri', value: 6, secondaryValue: 6 },
    { label: 'Sat', value: 3, secondaryValue: 3 }
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Visits */}
        <Card className="p-5 border-l-4 border-l-blue-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Visits</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.todayVisits}</p>
              <p className="text-xs text-slate-500 mt-0.5">Assigned inspection routes</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Pending Inspections */}
        <Card className="p-5 border-l-4 border-l-amber-500 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Equipment</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.pendingInspections}</p>
              <p className="text-xs text-slate-500 mt-0.5">Checklists awaiting execution</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Completed Inspections */}
        <Card className="p-5 border-l-4 border-l-emerald-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Today</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.completedInspections}</p>
              <p className="text-xs text-slate-500 mt-0.5">Cryptographically signed</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Flagged / Sync Queue */}
        <Card className="p-5 border-l-4 border-l-purple-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Offline Sync</p>
              <div className="mt-1 flex items-center space-x-2">
                <Badge variant={metrics.pendingSyncCount === 0 ? 'success' : 'warning'}>
                  {metrics.pendingSyncCount === 0 ? 'ALL SYNCED' : `${metrics.pendingSyncCount} QUEUED`}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">IndexedDB offline store</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Field Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Route Progress Gauge & Verdict Distribution */}
        <Card className="p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
              <PieChart className="w-4 h-4 text-blue-600" />
              <span>Inspection Route Progress & Verdict Breakdown</span>
            </h3>
            <Badge variant="info">Live Route</Badge>
          </div>

          <CircularProgressGauge
            percentage={67}
            title="Daily Target Route Completion"
            subtitle="2 of 3 scheduled site visits completed. 1 target facility remaining."
            strokeColor="#2563eb"
          />

          <div className="pt-2 border-t border-slate-100">
            <DistributionBar
              title="Recent Asset Verdict Distribution"
              segments={inspectionVerdicts}
              totalLabel="52 Inspected"
            />
          </div>
        </Card>

        {/* Weekly Completed Output Bar Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Weekly Equipment Inspections Output</span>
            </h3>
            <span className="text-xs text-slate-500">Assets Verified per Shift</span>
          </div>

          <SimpleBarChart
            data={weeklyExecution}
            barColor="bg-sky-600"
            secondaryColor="bg-emerald-500"
            primaryLabel="Total Audited"
            secondaryLabel="Sealed SHA-256"
            height={135}
          />
        </Card>
      </div>

      {/* Next Assigned Visit Banner / Hero Card */}
      {metrics.nextAssignedVisit ? (
        <Card className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 bg-blue-500/30 text-blue-200 text-xs font-bold rounded-full border border-blue-400/30">
                  NEXT TARGET FACILITY
                </span>
                <span className="text-xs text-blue-200">
                  Scheduled: {new Date(metrics.nextAssignedVisit.scheduledDate).toLocaleDateString()}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">{metrics.nextAssignedVisit.siteName}</h2>
              <p className="text-sm text-blue-200 flex items-center">
                <MapPin className="w-4 h-4 mr-1 text-blue-400 flex-shrink-0" />
                {metrics.nextAssignedVisit.address}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="primary"
                className="bg-white text-blue-900 hover:bg-blue-50 font-bold border-none shadow-md"
                onClick={() => navigate('/sites')}
              >
                <ClipboardList className="w-4 h-4 mr-2" />
                Open Inspection Manifest
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center bg-slate-50 border border-slate-200">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-slate-800">All Assigned Visits Up to Date</h3>
          <p className="text-xs text-slate-500 mt-1">No pending field visits currently scheduled for your dispatch queue.</p>
        </Card>
      )}

      {/* Field Actions Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 hover:border-blue-400 transition cursor-pointer" onClick={() => navigate('/sites')}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-xl">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Equipment QR Scanner</h3>
              <p className="text-xs text-slate-500 mt-0.5">Scan physical tags on fire extinguishers and hydrants</p>
            </div>
          </div>
        </Card>

        <Card className="p-5 hover:border-purple-400 transition cursor-pointer" onClick={() => navigate('/sync')}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 text-purple-700 rounded-xl">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Offline Sync & Cache Center</h3>
              <p className="text-xs text-slate-500 mt-0.5">Inspect queued offline checklists and force backend sync</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Assigned Route Manifest Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>Assigned Inspection Manifest</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/sites')}>
            View All Sites <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Facility Site</th>
                  <th className="py-3 px-4">Target Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(metrics.recentVisits || []).map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-900">{v.siteName}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {new Date(v.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={v.status === 'COMPLETED' ? 'success' : 'info'}>
                        {v.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="outline" size="sm" onClick={() => navigate('/sites')}>
                        Execute
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
