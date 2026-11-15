import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { AuthProvider } from '../context/AuthContext';
import { authApi } from '../api/auth.api';

vi.mock('../api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('Authentication Pages & Form Validation', () => {
  it('renders login form and requires email and password', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Sign in to Servora')).toBeTruthy();
    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    expect(emailInput).toBeTruthy();
    expect(passwordInput).toBeTruthy();

    // Trigger validation error on empty fields
    fireEvent.change(emailInput, { target: { value: '' } });
    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
  });

  it('displays API error message when login fails', async () => {
    vi.mocked(authApi.login).mockRejectedValueOnce(new Error('Invalid email or password'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'WrongPassword123!' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeTruthy();
    });
  });

  it('validates password requirements in registration form', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Create your Servora Account')).toBeTruthy();

    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Create Customer Account/i });

    fireEvent.change(emailInput, { target: { value: 'newuser@domain.com' } });
    // Password too short (< 8 chars)
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters long')).toBeTruthy();
    });

    // Password without special character or numeral
    fireEvent.change(passwordInput, { target: { value: 'validlengthpassword' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Password must contain at least one numeral and one special character')
      ).toBeTruthy();
    });
  });

  it('switches role fields between Customer and Service Provider', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <RegisterPage />
        </AuthProvider>
      </BrowserRouter>
    );

    // Initial role is CUSTOMER
    expect(screen.getByLabelText(/Contact Person Name/i)).toBeTruthy();

    // Click Service Provider button
    const providerRoleBtn = screen.getByText('Service Provider');
    fireEvent.click(providerRoleBtn);

    // Provider fields should now be visible
    expect(screen.getByLabelText(/Business \/ Contractor Name/i)).toBeTruthy();
    expect(screen.getByLabelText(/License Number/i)).toBeTruthy();
    expect(screen.getByLabelText(/Service Radius \(km\)/i)).toBeTruthy();
  });
});
