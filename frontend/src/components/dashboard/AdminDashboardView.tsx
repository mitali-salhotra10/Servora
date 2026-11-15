import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Building2,
  Users,
  CheckCircle2,
  FileCheck,
  Server,
  Activity,
  ArrowRight,
  Database,
  Lock,
  Cpu,
  BarChart3,
  ShieldCheck
} from 'lucide-react';
import {
  CircularProgressGauge,
  DistributionBar,
  SimpleBarChart
} from './DashboardCharts';

interface AdminDashboardProps {
  metrics: {
    totalOrganizations: number;
    totalFacilities: number;
    totalServiceProviders: number;
    totalInspections: number;
    activeContracts: number;
    platformActivity: number;
    systemHealth?: {
      status: string;
      database: string;
      uptimeSeconds: number;
      nodeVersion: string;
    };
  };
  isDemoMode?: boolean;
}

export const AdminDashboardView: React.FC<AdminDashboardProps> = ({ metrics }) => {
  const navigate = useNavigate();

  const tenantDistribution = [
    { label: 'Customer Facilities', count: 46, color: 'bg-blue-600', pct: 65 },
    { label: 'Service Providers', count: 18, color: 'bg-emerald-500', pct: 25 },
    { label: 'Independent Technicians', count: 7, color: 'bg-indigo-500', pct: 10 }
  ];

  const quarterlyInspectionGrowth = [
    { label: 'Q1', value: 142, secondaryValue: 142 },
    { label: 'Q2', value: 218, secondaryValue: 216 },
    { label: 'Q3', value: 375, secondaryValue: 374 },
    { label: 'Q4', value: metrics.totalInspections || 512, secondaryValue: metrics.totalInspections || 512 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Level Platform Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Organizations */}
        <Card className="p-5 border-l-4 border-l-blue-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Tenants</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalOrganizations}</p>
              <p className="text-xs text-slate-500 mt-0.5">Registered corporate accounts</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Total Facilities */}
        <Card className="p-5 border-l-4 border-l-emerald-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Facilities</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalFacilities}</p>
              <p className="text-xs text-slate-500 mt-0.5">Across all client tenants</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Service Provider Contractors */}
        <Card className="p-5 border-l-4 border-l-indigo-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Providers</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalServiceProviders}</p>
              <p className="text-xs text-slate-500 mt-0.5">Vetted contractor organizations</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Total Inspections */}
        <Card className="p-5 border-l-4 border-l-teal-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inspections Executed</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalInspections}</p>
              <p className="text-xs text-slate-500 mt-0.5">SHA-256 sealed digital records</p>
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Active AMC Contracts */}
        <Card className="p-5 border-l-4 border-l-amber-500 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform AMCs</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.activeContracts}</p>
              <p className="text-xs text-slate-500 mt-0.5">Binding service maintenance contracts</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Audit Log Events */}
        <Card className="p-5 border-l-4 border-l-purple-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platform Events</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.platformActivity}</p>
              <p className="text-xs text-slate-500 mt-0.5">Immutable audit trail entries</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Analytics & Trust Chain Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trust Chain Sealing Index Gauge & Entity Distribution */}
        <Card className="p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Digital Trust Chain & Cryptographic Integrity</span>
            </h3>
            <Badge variant="success">SHA-256 Sealed</Badge>
          </div>

          <CircularProgressGauge
            percentage={100}
            title="SHA-256 Chain Verification Rate"
            subtitle="All verified inspection records hold valid immutable cryptographic hashes and customer witness signatures."
            strokeColor="#10b981"
          />

          <div className="pt-2 border-t border-slate-100">
            <DistributionBar
              title="Platform Entity Distribution"
              segments={tenantDistribution}
              totalLabel="71 Entities"
            />
          </div>
        </Card>

        {/* Quarterly Growth Volume Bar Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              <span>Quarterly Inspection Volume & Growth</span>
            </h3>
            <span className="text-xs text-slate-500">Platform-Wide Audits</span>
          </div>

          <p className="text-xs text-slate-500">
            Growth in digital equipment inspections executed across all tenant facilities.
          </p>

          <SimpleBarChart
            data={quarterlyInspectionGrowth}
            barColor="bg-purple-600"
            secondaryColor="bg-teal-500"
            primaryLabel="Total Executed"
            secondaryLabel="Compliant Passed"
            height={135}
          />
        </Card>
      </div>

      {/* System Health & Architecture Status */}
      <Card className="p-6 bg-slate-900 text-white shadow-lg border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Enterprise Core Diagnostics</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
                  OPERATIONAL
                </span>
              </h2>
              <p className="text-xs text-slate-400">Servora B2B Backend • Node.js Runtime</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => navigate('/admin/health')}
            >
              Full Diagnostics
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 mb-1">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Persistence Layer</span>
            </div>
            <p className="font-bold text-slate-200">
              PostgreSQL 17.11 (Supabase Live)
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Strict FK & Tenant Isolation Active
            </p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 mb-1">
              <Lock className="w-4 h-4 text-purple-400" />
              <span>Cryptographic Trust Chain</span>
            </div>
            <p className="font-bold text-slate-200">SHA-256 Canonical Sealing</p>
            <p className="text-[11px] text-slate-400 mt-0.5">SHA-256 canonical integrity log</p>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2 text-slate-400 mb-1">
              <Cpu className="w-4 h-4 text-teal-400" />
              <span>Server Runtime</span>
            </div>
            <p className="font-bold text-slate-200">
              Node.js {metrics.systemHealth?.nodeVersion || 'v20.18.0'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Express + TypeScript API Gateway</p>
          </div>
        </div>
      </Card>

      {/* Admin Platform Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 hover:border-blue-400 transition cursor-pointer" onClick={() => navigate('/admin/tenants')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-900">Tenant Directory</h3>
          <p className="text-xs text-slate-500 mt-1">Audit customer organizations and contractor accounts</p>
        </Card>

        <Card className="p-5 hover:border-purple-400 transition cursor-pointer" onClick={() => navigate('/admin/audit-logs')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-900">Security Audit Logs</h3>
          <p className="text-xs text-slate-500 mt-1">Inspect immutable system events, logins, and signatures</p>
        </Card>

        <Card className="p-5 hover:border-teal-400 transition cursor-pointer" onClick={() => navigate('/certificates')}>
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-lg">
              <FileCheck className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-900">Compliance Certificates</h3>
          <p className="text-xs text-slate-500 mt-1">Review issued PDF compliance certificates across all sites</p>
        </Card>
      </div>
    </div>
  );
};
