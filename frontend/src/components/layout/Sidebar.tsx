import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  UserCheck,
  Wrench,
  CalendarCheck2,
  ShieldCheck,
  FileCheck,
  History,
  RefreshCw,
  Users,
  FileText,
  TrendingUp,
  Activity,
  Server
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'CUSTOMER';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors touch-target ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 space-y-6">
      {/* Role Header Badge */}
      <div className="px-3 pt-2 pb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
          {role === 'SERVICE_PROVIDER'
            ? 'Technician Workspace'
            : role === 'SERVICE_MANAGER'
            ? 'Manager Workspace'
            : role === 'ADMIN'
            ? 'Platform Admin'
            : 'Facility Customer'}
        </span>
      </div>

      <div className="space-y-1">
        <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Operations
        </div>

        {/* Dashboard — for everyone */}
        <NavLink to="/dashboard" className={linkClass}>
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          <span>Dashboard</span>
        </NavLink>

        {/* 1. CUSTOMER Specific Navigation */}
        {role === 'CUSTOMER' && (
          <>
            <NavLink to="/sites" className={linkClass}>
              <Building2 className="w-5 h-5 flex-shrink-0" />
              <span>My Facilities</span>
            </NavLink>
            <NavLink to="/requests" className={linkClass}>
              <Wrench className="w-5 h-5 flex-shrink-0" />
              <span>Service Requests</span>
            </NavLink>
            <NavLink to="/history" className={linkClass}>
              <History className="w-5 h-5 flex-shrink-0 text-slate-400" />
              <span>Service History</span>
            </NavLink>
            <NavLink to="/certificates" className={linkClass}>
              <FileCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>Certificates</span>
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              <UserCheck className="w-5 h-5 flex-shrink-0" />
              <span>Account Profile</span>
            </NavLink>
          </>
        )}

        {/* 2. FIELD TECHNICIAN Specific Navigation */}
        {role === 'SERVICE_PROVIDER' && (
          <>
            <NavLink to="/visits" className={linkClass}>
              <CalendarCheck2 className="w-5 h-5 flex-shrink-0 text-sky-400" />
              <span>Assigned Manifest</span>
            </NavLink>
            <NavLink to="/sync" className={linkClass}>
              <RefreshCw className="w-5 h-5 flex-shrink-0 text-purple-400" />
              <span>Offline Sync</span>
            </NavLink>
            <NavLink to="/history" className={linkClass}>
              <History className="w-5 h-5 flex-shrink-0 text-slate-400" />
              <span>Inspection History</span>
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              <UserCheck className="w-5 h-5 flex-shrink-0" />
              <span>Technician Profile</span>
            </NavLink>
          </>
        )}

        {/* 3. SERVICE MANAGER Specific Navigation */}
        {role === 'SERVICE_MANAGER' && (
          <>
            <NavLink to="/sites" className={linkClass}>
              <Building2 className="w-5 h-5 flex-shrink-0" />
              <span>Client Facilities</span>
            </NavLink>
            <NavLink to="/visits" className={linkClass}>
              <CalendarCheck2 className="w-5 h-5 flex-shrink-0 text-sky-400" />
              <span>Dispatch Schedules</span>
            </NavLink>
            <NavLink to="/requests" className={linkClass}>
              <Wrench className="w-5 h-5 flex-shrink-0" />
              <span>Service Requests</span>
            </NavLink>
            <NavLink to="/team" className={linkClass}>
              <Users className="w-5 h-5 flex-shrink-0 text-indigo-400" />
              <span>Technicians</span>
            </NavLink>
            <NavLink to="/contracts" className={linkClass}>
              <FileText className="w-5 h-5 flex-shrink-0" />
              <span>Contracts & AMC</span>
            </NavLink>
            <NavLink to="/reports" className={linkClass}>
              <TrendingUp className="w-5 h-5 flex-shrink-0 text-teal-400" />
              <span>SLA & Analytics</span>
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              <UserCheck className="w-5 h-5 flex-shrink-0" />
              <span>Organization Profile</span>
            </NavLink>
          </>
        )}

        {/* 4. PLATFORM ADMINISTRATOR Specific Navigation */}
        {role === 'ADMIN' && (
          <>
            <NavLink to="/sites" className={linkClass}>
              <Building2 className="w-5 h-5 flex-shrink-0" />
              <span>All Facilities</span>
            </NavLink>
            <NavLink to="/requests" className={linkClass}>
              <Wrench className="w-5 h-5 flex-shrink-0" />
              <span>Service Requests</span>
            </NavLink>
            <NavLink to="/certificates" className={linkClass}>
              <FileCheck className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <span>Certificates</span>
            </NavLink>
            <NavLink to="/admin/tenants" className={linkClass}>
              <Building2 className="w-5 h-5 flex-shrink-0 text-blue-400" />
              <span>Tenants & Orgs</span>
            </NavLink>
            <NavLink to="/admin/audit-logs" className={linkClass}>
              <Activity className="w-5 h-5 flex-shrink-0 text-purple-400" />
              <span>Audit Trail</span>
            </NavLink>
            <NavLink to="/admin/health" className={linkClass}>
              <Server className="w-5 h-5 flex-shrink-0 text-teal-400" />
              <span>System Diagnostics</span>
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              <UserCheck className="w-5 h-5 flex-shrink-0" />
              <span>Admin Profile</span>
            </NavLink>
          </>
        )}
      </div>

      {/* Trust & Verified Badges Footer */}
      <div className="mt-auto pt-4 border-t border-slate-800 text-xs text-slate-500 space-y-2">
        <div className="flex items-center space-x-2 text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">SHA-256 Sealed Platform</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-tight">
          Life-Safety Maintenance & Digital Trust Chain
        </p>
      </div>
    </aside>
  );
};
