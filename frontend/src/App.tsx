import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { SitesPage } from './pages/SitesPage';
import { CreateSitePage } from './pages/CreateSitePage';
import { SiteDetailPage } from './pages/SiteDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { MyVisitsPage } from './pages/visits/MyVisitsPage';
import { VisitExecutionPage } from './pages/visits/VisitExecutionPage';
import { CertificateVerificationPage } from './pages/public/CertificateVerificationPage';
import { ServiceRequestsPage } from './pages/requests/ServiceRequestsPage';
import { ServiceHistoryPage } from './pages/history/ServiceHistoryPage';
import { CertificatesListPage } from './pages/certificates/CertificatesListPage';
import { OfflineSyncPage } from './pages/sync/OfflineSyncPage';
import { TeamManagementPage } from './pages/team/TeamManagementPage';
import { ContractsPage } from './pages/contracts/ContractsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { TenantsPage } from './pages/admin/TenantsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { SystemHealthPage } from './pages/admin/SystemHealthPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Public Verification Routes (SEC-006) */}
          <Route path="/verify" element={<CertificateVerificationPage />} />
          <Route path="/verify/:certificateNumber" element={<CertificateVerificationPage />} />

          {/* Protected Application Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/sites" element={<SitesPage />} />
              <Route path="/sites/:id" element={<SiteDetailPage />} />
              <Route path="/requests" element={<ServiceRequestsPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Site Creation restricted to Customers and Administrators */}
              <Route element={<RoleRoute allowedRoles={['CUSTOMER', 'ADMIN']} />}>
                <Route path="/sites/new" element={<CreateSitePage />} />
              </Route>

              {/* Technician and Manager Field Routes */}
              <Route element={<RoleRoute allowedRoles={['SERVICE_PROVIDER', 'SERVICE_MANAGER', 'ADMIN']} />}>
                <Route path="/visits" element={<MyVisitsPage />} />
                <Route path="/visits/:id" element={<VisitExecutionPage />} />
              </Route>

              {/* Offline Sync for Field Technicians */}
              <Route element={<RoleRoute allowedRoles={['SERVICE_PROVIDER', 'ADMIN']} />}>
                <Route path="/sync" element={<OfflineSyncPage />} />
              </Route>

              {/* Inspection History for Customer & Technician */}
              <Route element={<RoleRoute allowedRoles={['CUSTOMER', 'SERVICE_PROVIDER', 'ADMIN']} />}>
                <Route path="/history" element={<ServiceHistoryPage />} />
              </Route>

              {/* Certificates List for Customer, Manager, Admin */}
              <Route element={<RoleRoute allowedRoles={['CUSTOMER', 'SERVICE_MANAGER', 'ADMIN']} />}>
                <Route path="/certificates" element={<CertificatesListPage />} />
              </Route>

              {/* Service Manager & Admin Operational Management */}
              <Route element={<RoleRoute allowedRoles={['SERVICE_MANAGER', 'ADMIN']} />}>
                <Route path="/team" element={<TeamManagementPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>

              {/* Platform Administrator Governance */}
              <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
                <Route path="/admin/tenants" element={<TenantsPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                <Route path="/admin/health" element={<SystemHealthPage />} />
              </Route>
            </Route>
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
};

export default App;
