import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SitesPage } from '../pages/SitesPage';
import { CreateSitePage } from '../pages/CreateSitePage';
import { SiteDetailPage } from '../pages/SiteDetailPage';
import { sitesApi } from '../api/sites.api';
import * as AuthContextModule from '../context/AuthContext';
import { Site } from '../types';

vi.mock('../api/sites.api', () => ({
  sitesApi: {
    getMySites: vi.fn(),
    getSiteById: vi.fn(),
    createSite: vi.fn(),
    updateSite: vi.fn(),
  },
}));

const mockSites: Site[] = [
  {
    id: 'site-1',
    customerId: 'cust-1',
    siteName: 'Westfield Shopping Mall',
    address: '1000 Commercial Way',
    city: 'Houston',
    postalCode: '77001',
    latitude: 29.7604,
    longitude: -95.3698,
    geofenceRadiusMeters: 150,
    onSiteContactName: 'John Facility',
    onSiteContactPhone: '555-0101',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    _count: { equipment: 12, visitSchedules: 2 },
  },
  {
    id: 'site-2',
    customerId: 'cust-1',
    siteName: 'Downtown Highrise Tower',
    address: '500 Main Street',
    city: 'Austin',
    postalCode: '78701',
    latitude: 30.2672,
    longitude: -97.7431,
    geofenceRadiusMeters: 80,
    onSiteContactName: 'Sarah Security',
    onSiteContactPhone: '555-0202',
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    _count: { equipment: 45, visitSchedules: 5 },
  },
];

describe('Sites & Facilities Management Pages', () => {
  beforeEach(() => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user-1',
        email: 'manager@apex.com',
        role: 'CUSTOMER',
        phone: '555-0199',
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
  });

  it('renders empty state when customer has no registered facilities', async () => {
    vi.mocked(sitesApi.getMySites).mockResolvedValueOnce([]);

    render(
      <MemoryRouter>
        <SitesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No facilities registered yet')).toBeTruthy();
      expect(screen.getByText('Register First Site')).toBeTruthy();
    });
  });

  it('renders facility cards and filters results based on search input', async () => {
    vi.mocked(sitesApi.getMySites).mockResolvedValueOnce(mockSites);

    render(
      <MemoryRouter>
        <SitesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Westfield Shopping Mall')).toBeTruthy();
      expect(screen.getByText('Downtown Highrise Tower')).toBeTruthy();
    });

    // Test search filter
    const searchInput = screen.getByPlaceholderText(/Search by site name/i);
    fireEvent.change(searchInput, { target: { value: 'Austin' } });

    expect(screen.queryByText('Westfield Shopping Mall')).toBeNull();
    expect(screen.getByText('Downtown Highrise Tower')).toBeTruthy();
  });

  it('validates GPS coordinate boundaries in CreateSitePage', async () => {
    render(
      <MemoryRouter>
        <CreateSitePage />
      </MemoryRouter>
    );

    const nameInput = screen.getByLabelText(/Facility \/ Site Name/i);
    const addrInput = screen.getByLabelText(/Street Address/i);
    const cityInput = screen.getByLabelText(/City/i);
    const zipInput = screen.getByLabelText(/Postal Code/i);
    const latInput = screen.getByLabelText(/Latitude/i);
    const lngInput = screen.getByLabelText(/Longitude/i);
    const contactInput = screen.getByLabelText(/Contact Person Name/i);
    const phoneInput = screen.getByLabelText(/Contact Phone/i);
    const submitBtn = screen.getByRole('button', { name: /Save Facility/i });

    fireEvent.change(nameInput, { target: { value: 'Test Site' } });
    fireEvent.change(addrInput, { target: { value: '123 Test St' } });
    fireEvent.change(cityInput, { target: { value: 'Dallas' } });
    fireEvent.change(zipInput, { target: { value: '75001' } });
    fireEvent.change(contactInput, { target: { value: 'Test Contact' } });
    fireEvent.change(phoneInput, { target: { value: '555-9999' } });

    // Invalid latitude (> 90)
    fireEvent.change(latInput, { target: { value: '120.5' } });
    fireEvent.change(lngInput, { target: { value: '-95.3' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Latitude must be a valid number between -90 and 90')).toBeTruthy();
    });
  });

  it('renders facility details and coordinates in SiteDetailPage', async () => {
    vi.mocked(sitesApi.getSiteById).mockResolvedValueOnce(mockSites[0]);

    render(
      <MemoryRouter initialEntries={['/sites/site-1']}>
        <Routes>
          <Route path="/sites/:id" element={<SiteDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Westfield Shopping Mall')).toBeTruthy();
      expect(screen.getByText('1000 Commercial Way')).toBeTruthy();
      expect(screen.getByText('29.7604')).toBeTruthy();
      expect(screen.getByText('-95.3698')).toBeTruthy();
      expect(screen.getByText('150 meters')).toBeTruthy();
    });
  });
});
