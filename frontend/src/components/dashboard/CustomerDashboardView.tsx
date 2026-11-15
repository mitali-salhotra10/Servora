import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Plus,
  FileCheck,
  CheckCircle2,
  Hash,
  BarChart3,
  PieChart
} from 'lucide-react';
import {
  CircularProgressGauge,
  DistributionBar,
  SimpleBarChart
} from './DashboardCharts';

interface CustomerDashboardProps {
  metrics: {
    totalFacilities: number;
    totalEquipment: number;
    complianceStatus: string;
    upcomingInspections: number;
    openServiceRequests: number;
    recentInspectionHistory?: Array<{
      id: string;
      siteName: string;
      executedAt: string;
      isGeofenceVerified: boolean;
      verdict?: string;
      recordHash?: string;
    }>;
    facilities?: Array<{
      id: string;
      siteName: string;
      address: string;
      city: string;
      equipmentCount: number;
      visitsCount: number;
    }>;
  };
}

export const CustomerDashboardView: React.FC<CustomerDashboardProps> = ({ metrics }) => {
  const navigate = useNavigate();

  const assetDistribution = [
    { label: 'Fire Extinguishers', count: 24, color: 'bg-blue-600', pct: 57 },
    { label: 'Hydrants & Standpipes', count: 12, color: 'bg-emerald-500', pct: 29 },
    { label: 'Alarm Panels & Sensors', count: 6, color: 'bg-amber-500', pct: 14 }
  ];

  const inspectionHistoryData = [
    { label: 'Jun', value: 12, secondaryValue: 12 },
    { label: 'Jul', value: 14, secondaryValue: 13 },
    { label: 'Aug', value: 18, secondaryValue: 18 },
    { label: 'Sep', value: 14, secondaryValue: 14 },
    { label: 'Oct', value: 28, secondaryValue: 27 },
    { label: 'Nov', value: 16, secondaryValue: 16 }
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Facilities */}
        <Card className="p-5 border-l-4 border-l-blue-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">My Facilities</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalFacilities}</p>
              <p className="text-xs text-slate-500 mt-0.5">Authorized life-safety locations</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Registered Equipment */}
        <Card className="p-5 border-l-4 border-l-emerald-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Assets</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalEquipment}</p>
              <p className="text-xs text-slate-500 mt-0.5">Extinguishers, hydrants & alarms</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Compliance Status */}
        <Card className="p-5 border-l-4 border-l-indigo-600 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Compliance Status</p>
              <div className="mt-1 flex items-center space-x-2">
                <Badge variant={metrics.complianceStatus === 'COMPLIANT' ? 'success' : 'warning'}>
                  {metrics.complianceStatus === 'COMPLIANT' ? 'VERIFIED COMPLIANT' : 'REVIEW PENDING'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">NFPA / ISO 17020 alignment</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        {/* Open Complaints / Requests */}
        <Card className="p-5 border-l-4 border-l-amber-500 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Requests</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.openServiceRequests}</p>
              <p className="text-xs text-slate-500 mt-0.5">Active defects & complaints</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Visual Analytics & Compliance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Rating & Asset Distribution */}
        <Card className="p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <span>Life-Safety Compliance & Equipment Distribution</span>
            </h3>
            <Badge variant="success">98% Pass Rate</Badge>
          </div>

          <CircularProgressGauge
            percentage={98}
            title="NFPA 10 Audit Health Index"
            subtitle="41 of 42 physical life-safety assets verified in full operational specification."
            strokeColor="#10b981"
          />

          <div className="pt-2 border-t border-slate-100">
            <DistributionBar
              title="Equipment Registry by System Category"
              segments={assetDistribution}
              totalLabel={`${metrics.totalEquipment || 42} Registered`}
            />
          </div>
        </Card>

        {/* Inspection History Volume Bar Chart */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>6-Month Inspection & Servicing Volume</span>
            </h3>
            <span className="text-xs text-slate-500">Verified Monthly Seals</span>
          </div>

          <SimpleBarChart
            data={inspectionHistoryData}
            barColor="bg-blue-600"
            secondaryColor="bg-emerald-500"
            primaryLabel="Total Assets Inspected"
            secondaryLabel="Passed With Zero Defects"
            height={135}
          />
        </Card>
      </div>

      {/* Quick Actions Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">Need Maintenance or Found a Defect?</span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-500 text-xs">
            Submit equipment complaints directly to your service provider for rapid dispatch.
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/sites')}>
            <Building2 className="w-4 h-4 mr-1.5" />
            Manage Facilities
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/requests')}>
            <Plus className="w-4 h-4 mr-1.5" />
            Report Defect / Complaint
          </Button>
        </div>
      </div>

      {/* Facilities Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>My Registered Facilities</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/sites')}>
            View All Facilities <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(metrics.facilities || []).map((f) => (
            <Card key={f.id} className="p-5 hover:border-blue-300 transition cursor-pointer" onClick={() => navigate(`/sites/${f.id}`)}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">{f.siteName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{f.address}, {f.city}</p>
                </div>
                <Badge variant="info">Active Site</Badge>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium text-slate-900">{f.equipmentCount} Equipment Registered</span>
                <span className="text-blue-600 font-semibold flex items-center">
                  Inspect Equipment <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Inspection History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>Recent Inspection Proof & Certificates</span>
          </h2>
          <Button variant="ghost" size="sm" onClick={() => navigate('/certificates')}>
            Compliance Certificates <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Facility Site</th>
                  <th className="py-3 px-4">Execution Date</th>
                  <th className="py-3 px-4">Geofence Check-in</th>
                  <th className="py-3 px-4">Audit Seal (SHA-256)</th>
                  <th className="py-3 px-4 text-right">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(metrics.recentInspectionHistory || []).map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-medium text-slate-900">{rec.siteName}</td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {new Date(rec.executedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {rec.isGeofenceVerified ? (
                        <span className="inline-flex items-center text-xs text-emerald-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                          Verified On-site
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Manual Check-in</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      <span className="inline-flex items-center space-x-1 bg-slate-100 px-2 py-0.5 rounded">
                        <Hash className="w-3 h-3 text-slate-400" />
                        <span>{rec.recordHash ? `${rec.recordHash.slice(0, 10)}...` : 'Sealed'}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => navigate('/certificates')}>
                        View Certificate
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
