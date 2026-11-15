import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MyVisitsPage } from '../pages/visits/MyVisitsPage';
import { visitsApi } from '../api/visits.api';
import { db, CachedVisit } from '../db';
import * as AuthContextModule from '../context/AuthContext';

vi.mock('../api/visits.api', () => ({
  visitsApi: {
    getMyAssigned: vi.fn(),
    getById: vi.fn(),
    updateStatus: vi.fn(),
    submitInspection: vi.fn(),
    getChecklistTemplates: vi.fn(),
  },
}));

const mockAssignedVisits: CachedVisit[] = [
  {
    id: 'visit-1',
    siteId: 'site-1',
    assignedTechnicianId: 'tech-1',
    targetDate: '2026-06-01T09:00:00Z',
    dueDate: '2026-06-01T17:00:00Z',
    status: 'ASSIGNED',
    visitType: 'RECURRING_MAINTENANCE',
    site: {
      id: 'site-1',
      customerId: 'cust-1',
      siteName: 'City Center Complex',
      address: '200 Downtown Way',
      city: 'Austin',
      postalCode: '78701',
      latitude: 30.26,
      longitude: -97.74,
      geofenceRadiusMeters: 100,
      onSiteContactName: 'Mark Supervisor',
      onSiteContactPhone: '555-0101',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    }
  },
  {
    id: 'visit-2',
    siteId: 'site-2',
    assignedTechnicianId: 'tech-1',
    targetDate: '2026-06-02T10:00:00Z',
    dueDate: '2026-06-02T18:00:00Z',
    status: 'COMPLETED',
    visitType: 'EMERGENCY_INSPECTION',
    site: {
      id: 'site-2',
      customerId: 'cust-2',
      siteName: 'Harbor Warehouse 4',
      address: '900 Port Road',
      city: 'Houston',
      postalCode: '77001',
      latitude: 29.76,
      longitude: -95.36,
      geofenceRadiusMeters: 150,
      onSiteContactName: 'Sarah Harbor',
      onSiteContactPhone: '555-0202',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    }
  }
];

describe('Technician Field Visits & Manifest (MOD-06 & MOD-07)', () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await db.cachedVisits.clear();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'tech-1',
        email: 'tech@servora.app',
        role: 'SERVICE_PROVIDER',
        phone: '555-0199',
        isActive: true,
      },
      token: 'valid-jwt',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });
  });

  it('renders assigned visits manifest with site names and status badges', async () => {
    vi.mocked(visitsApi.getMyAssigned).mockResolvedValueOnce(mockAssignedVisits);

    render(
      <BrowserRouter>
        <MyVisitsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Technician Daily Manifest')).toBeTruthy();
      expect(screen.getByText('City Center Complex')).toBeTruthy();
      expect(screen.getByText('Harbor Warehouse 4')).toBeTruthy();
      expect(screen.getByText('Start Execution')).toBeTruthy();
      expect(screen.getByText('Review Inspection')).toBeTruthy();
    });
  });

  it('filters visits by Pending and Completed tabs', async () => {
    vi.mocked(visitsApi.getMyAssigned).mockResolvedValueOnce(mockAssignedVisits);

    render(
      <BrowserRouter>
        <MyVisitsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('City Center Complex')).toBeTruthy();
      expect(screen.getByText('Harbor Warehouse 4')).toBeTruthy();
    });

    // Click Pending filter tab
    const pendingTab = screen.getByRole('button', { name: /Pending/i });
    fireEvent.click(pendingTab);

    expect(screen.getByText('City Center Complex')).toBeTruthy();
    expect(screen.queryByText('Harbor Warehouse 4')).toBeNull();

    // Click Completed filter tab
    const completedTab = screen.getByRole('button', { name: /Completed/i });
    fireEvent.click(completedTab);

    expect(screen.queryByText('City Center Complex')).toBeNull();
    expect(screen.getByText('Harbor Warehouse 4')).toBeTruthy();
  });

  it('restores cached visits from IndexedDB when network fails or offline', async () => {
    // Populate local cache in IndexedDB
    for (const v of mockAssignedVisits) {
      await db.cachedVisits.put(v);
    }

    // Mock API failure to simulate offline state
    vi.mocked(visitsApi.getMyAssigned).mockRejectedValueOnce(new Error('Network offline'));

    render(
      <BrowserRouter>
        <MyVisitsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('City Center Complex')).toBeTruthy();
      expect(screen.getByText('Harbor Warehouse 4')).toBeTruthy();
    });
  });
});
