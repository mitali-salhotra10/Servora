import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Shield, Key, CheckCircle } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const roleLabels = {
    CUSTOMER: 'Customer / Property Owner',
    SERVICE_PROVIDER: 'Field Technician / Service Provider',
    SERVICE_MANAGER: 'Service Manager',
    ADMIN: 'System Administrator',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Account & Profile Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          View your organizational profile, tenant permissions, and security parameters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Account */}
        <div className="md:col-span-2 space-y-6">
          <Card title="Account Identity">
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Email Address</span>
                  <p className="font-medium text-slate-900 mt-0.5">{user.email}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Account Status</span>
                  <div className="mt-1">
                    <Badge variant={user.isActive ? 'success' : 'danger'}>
                      {user.isActive ? 'Active' : 'Suspended'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Assigned Role</span>
                  <p className="font-medium text-slate-900 mt-0.5">{roleLabels[user.role]}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Phone Number</span>
                  <p className="font-medium text-slate-900 mt-0.5">{user.phone || 'Not configured'}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Profile Details */}
          {user.customerProfile && (
            <Card title="Customer Organization Profile">
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Contact Person</span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {user.customerProfile.contactPersonName}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Company Name</span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {user.customerProfile.companyName || 'Not specified'}
                    </p>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Billing Address</span>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {user.customerProfile.billingAddress || 'Not specified'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {user.providerProfile && (
            <Card title="Provider & Technician Profile">
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Business Name</span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {user.providerProfile.businessName}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">License Number</span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {user.providerProfile.licenseNumber}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Verification Status</span>
                    <div className="mt-1">
                      <Badge variant="warning">{user.providerProfile.verificationStatus}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase">Service Radius</span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {user.providerProfile.serviceRadiusKm} km
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Security / Tenant Sidebar */}
        <div className="space-y-6">
          <Card title="Tenant Isolation & Security">
            <div className="space-y-4 text-xs">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800">Active Tenant Scope</span>
                  <p className="text-slate-500 mt-0.5">
                    Your queries are scoped to your customer profile ID via AsyncLocalStorage context.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800">JWT Token Version</span>
                  <p className="text-slate-500 mt-0.5">
                    Stateless 15-minute token lifecycle. Logging out revokes active session credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Key className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-slate-800">RBAC Enforcement</span>
                  <p className="text-slate-500 mt-0.5">
                    Server-side authorization boundaries strictly enforce endpoint accessibility.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
