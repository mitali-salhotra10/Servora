import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContextModule from '../context/AuthContext';
import { Sidebar } from '../components/layout/Sidebar';
import { CustomerDashboardView } from '../components/dashboard/CustomerDashboardView';
import { TechnicianDashboardView } from '../components/dashboard/TechnicianDashboardView';
import { ManagerDashboardView } from '../components/dashboard/ManagerDashboardView';
import { AdminDashboardView } from '../components/dashboard/AdminDashboardView';

describe('Role-Based Dashboards and Navigation Tests', () => {
  it('renders Customer specific navigation items in Sidebar', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'c-1',
        email: 'customer@servora.com',
        role: 'CUSTOMER',
        phone: null,
        isActive: true,
      },
      token: 'jwt-token',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('My Facilities')).toBeTruthy();
    expect(screen.getByText('Service Requests')).toBeTruthy();
    expect(screen.getByText('Certificates')).toBeTruthy();
    expect(screen.getByText('Service History')).toBeTruthy();

    // Must NOT show admin or provider operational links
    expect(screen.queryByText('Offline Sync')).toBeNull();
    expect(screen.queryByText('Audit Trail')).toBeNull();
    expect(screen.queryByText('Dispatch Schedules')).toBeNull();
  });

  it('renders Field Technician specific navigation items in Sidebar', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 't-1',
        email: 'tech@servora.com',
        role: 'SERVICE_PROVIDER',
        phone: null,
        isActive: true,
      },
      token: 'jwt-token',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Assigned Manifest')).toBeTruthy();
    expect(screen.getByText('Offline Sync')).toBeTruthy();
    expect(screen.getByText('Inspection History')).toBeTruthy();

    // Must NOT show Customer or Admin links
    expect(screen.queryByText('My Facilities')).toBeNull();
    expect(screen.queryByText('Tenants & Orgs')).toBeNull();
    expect(screen.queryByText('Contracts & AMC')).toBeNull();
  });

  it('renders Service Manager navigation with Dispatch, Team and Contracts', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'm-1',
        email: 'manager@servora.com',
        role: 'SERVICE_MANAGER',
        phone: null,
        isActive: true,
      },
      token: 'jwt-token',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Client Facilities')).toBeTruthy();
    expect(screen.getByText('Dispatch Schedules')).toBeTruthy();
    expect(screen.getByText('Technicians')).toBeTruthy();
    expect(screen.getByText('Contracts & AMC')).toBeTruthy();
    expect(screen.getByText('SLA & Analytics')).toBeTruthy();
  });

  it('renders Platform Admin navigation with Tenants, Audit Trail and Health', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'a-1',
        email: 'admin@servora.com',
        role: 'ADMIN',
        phone: null,
        isActive: true,
      },
      token: 'jwt-token',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('All Facilities')).toBeTruthy();
    expect(screen.getByText('Tenants & Orgs')).toBeTruthy();
    expect(screen.getByText('Audit Trail')).toBeTruthy();
    expect(screen.getByText('System Diagnostics')).toBeTruthy();
  });

  it('renders CustomerDashboardView metrics accurately', () => {
    const metrics = {
      totalFacilities: 3,
      totalEquipment: 45,
      complianceStatus: 'COMPLIANT',
      upcomingInspections: 2,
      openServiceRequests: 1,
      facilities: [
        {
          id: 's-1',
          siteName: 'Apex Headquarters Tower',
          address: '1000 Commercial Plaza',
          city: 'Houston',
          equipmentCount: 14,
          visitsCount: 2
        }
      ]
    };

    render(
      <MemoryRouter>
        <CustomerDashboardView metrics={metrics} />
      </MemoryRouter>
    );

    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('45')).toBeTruthy();
    expect(screen.getByText('VERIFIED COMPLIANT')).toBeTruthy();
    expect(screen.getByText('Apex Headquarters Tower')).toBeTruthy();
    expect(screen.getByText('Report Defect / Complaint')).toBeTruthy();
  });

  it('renders TechnicianDashboardView with next assigned visit', () => {
    const metrics = {
      todayVisits: 2,
      pendingInspections: 3,
      completedInspections: 1,
      failedOrFlaggedInspections: 0,
      pendingSyncCount: 0,
      nextAssignedVisit: {
        id: 'v-1',
        siteName: 'Westside Logistics Distribution Hub',
        address: '450 Industrial Parkway',
        scheduledDate: '2026-11-12T09:00:00Z',
        status: 'ASSIGNED'
      }
    };

    render(
      <MemoryRouter>
        <TechnicianDashboardView metrics={metrics} />
      </MemoryRouter>
    );

    expect(screen.getByText('Westside Logistics Distribution Hub')).toBeTruthy();
    expect(screen.getByText('ALL SYNCED')).toBeTruthy();
    expect(screen.getByText('Open Inspection Manifest')).toBeTruthy();
  });

  it('renders ManagerDashboardView with SLA performance and contract metrics', () => {
    const metrics = {
      activeContracts: 8,
      clientFacilities: 12,
      activeTechnicians: 5,
      scheduledVisits: 6,
      pendingServiceRequests: 2,
      overdueMaintenance: 0,
      slaPerformance: 98.5
    };

    render(
      <MemoryRouter>
        <ManagerDashboardView metrics={metrics} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('8').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('98.5%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Contractor Operational Dispatch')).toBeTruthy();
  });

  it('renders AdminDashboardView with total facilities and platform diagnostics', () => {
    const metrics = {
      totalOrganizations: 14,
      totalFacilities: 46,
      totalServiceProviders: 8,
      totalInspections: 512,
      activeContracts: 32,
      platformActivity: 1284,
      systemHealth: {
        status: 'HEALTHY',
        database: 'SIMULATED',
        uptimeSeconds: 7200,
        nodeVersion: 'v22.20.0'
      }
    };

    render(
      <MemoryRouter>
        <AdminDashboardView metrics={metrics} isDemoMode={true} />
      </MemoryRouter>
    );

    expect(screen.getAllByText('46').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('512').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Enterprise Core Diagnostics')).toBeTruthy();
  });
});
