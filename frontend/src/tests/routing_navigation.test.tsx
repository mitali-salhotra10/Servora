import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RoleRoute } from '../routes/RoleRoute';
import * as AuthContextModule from '../context/AuthContext';

describe('Routing, Role Guarding & Layout Components', () => {
  it('renders 404 Not Found page for invalid routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-path']}>
        <Routes>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('404 — Page Not Found')).toBeTruthy();
    expect(screen.getByText('Return to Dashboard')).toBeTruthy();
  });

  it('restricts RoleRoute access to unauthorized roles', () => {
    // Spy on useAuth to return a CUSTOMER role
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user-1',
        email: 'customer@example.com',
        role: 'CUSTOMER',
        phone: null,
        isActive: true,
      },
      token: 'valid-token',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin-only']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin-only" element={<div>Admin Exclusive Panel</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Fallback Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Customer should be redirected to /dashboard and NOT see Admin Exclusive Panel
    expect(screen.queryByText('Admin Exclusive Panel')).toBeNull();
    expect(screen.getByText('Fallback Dashboard')).toBeTruthy();
  });

  it('permits RoleRoute access to authorized roles', () => {
    // Spy on useAuth to return an ADMIN role
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin@servora.com',
        role: 'ADMIN',
        phone: null,
        isActive: true,
      },
      token: 'valid-admin-token',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin-only']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin-only" element={<div>Admin Exclusive Panel</div>} />
          </Route>
          <Route path="/dashboard" element={<div>Fallback Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Exclusive Panel')).toBeTruthy();
  });
});
