import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  CalendarCheck2,
  Building2,
  UserCheck,
  Wrench,
  RefreshCw,
  Activity
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || 'CUSTOMER';

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors touch-target ${
      isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
    }`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 flex items-center justify-around h-16 shadow-lg">
      <NavLink to="/dashboard" className={linkClass}>
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Dashboard</span>
      </NavLink>

      {role === 'CUSTOMER' && (
        <>
          <NavLink to="/sites" className={linkClass}>
            <Building2 className="w-5 h-5 mb-0.5" />
            <span>Facilities</span>
          </NavLink>
          <NavLink to="/requests" className={linkClass}>
            <Wrench className="w-5 h-5 mb-0.5" />
            <span>Requests</span>
          </NavLink>
        </>
      )}

      {role === 'SERVICE_PROVIDER' && (
        <>
          <NavLink to="/visits" className={linkClass}>
            <CalendarCheck2 className="w-5 h-5 mb-0.5" />
            <span>Manifest</span>
          </NavLink>
          <NavLink to="/sync" className={linkClass}>
            <RefreshCw className="w-5 h-5 mb-0.5" />
            <span>Sync</span>
          </NavLink>
        </>
      )}

      {role === 'SERVICE_MANAGER' && (
        <>
          <NavLink to="/sites" className={linkClass}>
            <Building2 className="w-5 h-5 mb-0.5" />
            <span>Facilities</span>
          </NavLink>
          <NavLink to="/visits" className={linkClass}>
            <CalendarCheck2 className="w-5 h-5 mb-0.5" />
            <span>Dispatch</span>
          </NavLink>
        </>
      )}

      {role === 'ADMIN' && (
        <>
          <NavLink to="/sites" className={linkClass}>
            <Building2 className="w-5 h-5 mb-0.5" />
            <span>Facilities</span>
          </NavLink>
          <NavLink to="/admin/audit-logs" className={linkClass}>
            <Activity className="w-5 h-5 mb-0.5" />
            <span>Audits</span>
          </NavLink>
        </>
      )}

      <NavLink to="/profile" className={linkClass}>
        <UserCheck className="w-5 h-5 mb-0.5" />
        <span>Profile</span>
      </NavLink>
    </nav>
  );
};
