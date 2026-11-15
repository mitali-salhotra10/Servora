import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';
import { LogOut, User as UserIcon, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabel = {
    CUSTOMER: 'Customer',
    SERVICE_PROVIDER: 'Technician',
    SERVICE_MANAGER: 'Service Manager',
    ADMIN: 'Administrator',
  }[user?.role || 'CUSTOMER'];

  const roleBadgeVariant: 'info' | 'warning' | 'success' | 'neutral' = {
    CUSTOMER: 'info',
    SERVICE_PROVIDER: 'warning',
    SERVICE_MANAGER: 'success',
    ADMIN: 'neutral',
  }[user?.role || 'CUSTOMER'] as any;

  return (
    <header className="bg-slate-900 text-white h-16 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-white tracking-wider">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-base tracking-tight text-white leading-tight">SERVORA</span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Field Compliance</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {user && (
          <div className="hidden sm:flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200">
                {user.customerProfile?.contactPersonName ||
                 user.providerProfile?.businessName ||
                 user.email}
              </span>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <Badge variant={roleBadgeVariant}>{roleLabel}</Badge>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Sign out"
          aria-label="Sign out"
          className="text-slate-300 hover:text-white p-2 rounded-md hover:bg-slate-800 transition-colors touch-target flex items-center justify-center"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
