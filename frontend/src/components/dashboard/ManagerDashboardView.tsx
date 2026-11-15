import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  FileText,
  Building2,
  Users,
  AlertTriangle,
  TrendingUp,
  Plus,
  ArrowRight,
  BarChart3,
  Activity
} from 'lucide-react';
import {
  TrendAreaChart,
  DistributionBar,
  SimpleBarChart
} from './DashboardCharts';

interface ManagerDashboardProps {
  metrics: {
    activeContracts: number;
    clientFacilities: number;
    activeTechnicians: number;
    scheduledVisits: number;
    pendingServiceRequests: number;
    overdueMaintenance: number;
    slaPerformance: number;
  };
}

export const ManagerDashboardView: React.FC<ManagerDashboardProps> = ({ metrics }) => {
  const navigate = useNavigate();

  const slaTrendData = [
    { label: 'Jun', value: 97.4 },
    { label: 'Jul', value: 98.1 },
    { label: 'Aug', value: 98.9 },
    { label: 'Sep', value: 99.2 },
    { label: 'Oct', value: 98.8 },
    { label: 'Nov', value: metrics.slaPerformance || 98.5 }
  ];

  const requestStatusSegments = [
    { label: 'Resolved', count: 18, color: 'bg-emerald-500', pct: 67 },
    { label: 'In Progress', count: 4, color: 'bg-blue-600', pct: 15 },
    { label: 'Scheduled', count: 3, color: 'bg-amber-500', pct: 11 },
    { label: 'Submitted', count: 2, color: 'bg-indigo-500', pct: 7 }
  ];

  const techWorkloadData = [
    { label: 'Tech Field', value: 14, secondaryValue: 12 },
    { label: 'James M.', value: 11, secondaryValue: 11 },
    { label: 'Elena R.', value: 8, secondaryValue: 7 },
    { label: 'David K.', value: 6, secondaryValue: 6 }
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Contracts */}
        <Card className="p-5 border-l-4 border-l-blue-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active AMCs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.activeContracts}</p>
              <p className="text-xs text-slate-500 mt-0.5">Recurring maintenance contracts</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Client Facilities */}
        <Card className="p-5 border-l-4 border-l-emerald-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Facilities</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.clientFacilities}</p>
              <p className="text-xs text-slate-500 mt-0.5">Managed commercial buildings</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Active Technicians */}
        <Card className="p-5 border-l-4 border-l-indigo-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Field Technicians</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.activeTechnicians}</p>
              <p className="text-xs text-slate-500 mt-0.5">Available for dispatch</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* SLA Performance */}
        <Card className="p-5 border-l-4 border-l-teal-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SLA Adherence</p>
              <p className="text-2xl font-bold text-teal-700 mt-1">{metrics.slaPerformance}%</p>
              <p className="text-xs text-slate-500 mt-0.5">On-time inspection rate</p>
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Analytics & Operational Dispatch Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Trendline Curve */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
              <Activity className="w-4 h-4 text-teal-600" />
              <span>SLA Adherence & On-Time Performance Trend</span>
            </h3>
            <Badge variant="success">Target: &gt;95%</Badge>
          </div>

          <p className="text-xs text-slate-500">
            6-month contractual SLA on-time inspection and defect resolution compliance.
          </p>

          <TrendAreaChart
            data={slaTrendData}
            strokeColor="#0d9488"
            fillColor="rgba(13, 148, 136, 0.12)"
            unit="%"
          />

          <div className="pt-2 border-t border-slate-100">
            <DistributionBar
              title="Customer Maintenance Complaints by Status"
              segments={requestStatusSegments}
              totalLabel="27 Service Requests"
            />
          </div>
        </Card>

        {/* Field Technician Dispatch Load Bar Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Technician Workload & Completed Checklists</span>
            </h3>
            <span className="text-xs text-slate-500">Active Month Route Load</span>
          </div>

          <p className="text-xs text-slate-500">
            Assigned facilities vs. completed verification visits across current shift roster.
          </p>

          <SimpleBarChart
            data={techWorkloadData}
            barColor="bg-blue-600"
            secondaryColor="bg-teal-500"
            primaryLabel="Assigned Sites"
            secondaryLabel="Completed Audits"
            height={135}
          />
        </Card>
      </div>

      {/* Operational Dispatch Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-900">Contractor Operational Dispatch</h3>
            {metrics.pendingServiceRequests > 0 && (
              <Badge variant="warning">{metrics.pendingServiceRequests} Pending Requests</Badge>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Monitor technician routes, assign incoming customer maintenance complaints, and enforce SLA deadlines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => navigate('/requests')}>
            <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500" />
            Review Requests
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/sites')}>
            <Plus className="w-4 h-4 mr-1.5" />
            Schedule New Visit
          </Button>
        </div>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Managed Client Sites Overview */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Contract Facilities Under Scope</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/sites')}>
              View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">Apex Headquarters Tower</p>
                <p className="text-xs text-slate-500">1000 Commercial Plaza, Suite 400 • Houston</p>
              </div>
              <Badge variant="info">AMC Monthly</Badge>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">Westside Logistics Distribution Hub</p>
                <p className="text-xs text-slate-500">450 Industrial Parkway • Katy</p>
              </div>
              <Badge variant="info">AMC Quarterly</Badge>
            </div>
          </div>
        </Card>

        {/* Technician Deployment & Dispatch */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Field Technician Manifests</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/team')}>
              Manage Team <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                  TF
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Tech Field (Lead Technician)</p>
                  <p className="text-xs text-slate-500">License: FP-CERT-9921 • Active</p>
                </div>
              </div>
              <Badge variant="success">On Route</Badge>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                  JM
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">James Miller (Technician)</p>
                  <p className="text-xs text-slate-500">License: FP-CERT-8842 • Available</p>
                </div>
              </div>
              <Badge variant="neutral">Available</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
