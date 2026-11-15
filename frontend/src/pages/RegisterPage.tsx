import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { Shield, Building, Wrench } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<'CUSTOMER' | 'SERVICE_PROVIDER'>('CUSTOMER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Customer specific
  const [companyName, setCompanyName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');

  // Service Provider specific
  const [businessName, setBusinessName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState('25');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    const hasNumeral = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
    if (!hasNumeral || !hasSpecial) {
      setError('Password must contain at least one numeral and one special character');
      return;
    }

    if (role === 'CUSTOMER' && !contactPersonName.trim()) {
      setError('Contact person name is required for Customer accounts');
      return;
    }

    if (role === 'SERVICE_PROVIDER' && (!businessName.trim() || !licenseNumber.trim())) {
      setError('Business name and license number are required for Service Providers');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        role,
        phone: phone.trim() || undefined,
        companyName: companyName.trim() || undefined,
        contactPersonName: contactPersonName.trim() || undefined,
        billingAddress: billingAddress.trim() || undefined,
        businessName: businessName.trim() || undefined,
        licenseNumber: licenseNumber.trim() || undefined,
        serviceRadiusKm: serviceRadiusKm ? parseInt(serviceRadiusKm, 10) : undefined,
      });

      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check form fields.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center mx-auto mb-4 text-white shadow-lg">
          <Shield className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">Create your Servora Account</h2>
        <p className="mt-2 text-sm text-slate-400">
          Select your account role to begin verifiable maintenance management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10 border border-slate-200">
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-6" />}

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setRole('CUSTOMER')}
              className={`p-4 rounded-lg border-2 text-left flex flex-col items-start transition-all touch-target ${
                role === 'CUSTOMER'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 font-semibold text-sm mb-1">
                <Building className="w-4 h-4 text-blue-600" />
                <span>Customer / Owner</span>
              </div>
              <p className="text-xs text-slate-500">
                Facility managers, building owners managing properties & fire safety.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setRole('SERVICE_PROVIDER')}
              className={`p-4 rounded-lg border-2 text-left flex flex-col items-start transition-all touch-target ${
                role === 'SERVICE_PROVIDER'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div className="flex items-center space-x-2 font-semibold text-sm mb-1">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Service Provider</span>
              </div>
              <p className="text-xs text-slate-500">
                Independent technicians or service contractors performing inspections.
              </p>
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email address"
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@domain.com"
              />
              <Input
                label="Phone number"
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555-0199"
              />
            </div>

            <Input
              label="Password"
              id="password"
              type="password"
              required
              hint="Minimum 8 characters with at least one number and one symbol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {role === 'CUSTOMER' ? (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Contact Person Name"
                    id="contactPersonName"
                    required
                    value={contactPersonName}
                    onChange={(e) => setContactPersonName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                  <Input
                    label="Company Name"
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Apex Facilities LLC"
                  />
                </div>
                <Input
                  label="Billing Address"
                  id="billingAddress"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder="100 Commercial Blvd, Suite 400"
                />
              </div>
            ) : (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Business / Contractor Name"
                    id="businessName"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Metro Fire Services Inc."
                  />
                  <Input
                    label="License Number"
                    id="licenseNumber"
                    required
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="FP-LIC-89410"
                  />
                </div>
                <Input
                  label="Service Radius (km)"
                  id="serviceRadiusKm"
                  type="number"
                  min="1"
                  max="500"
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(e.target.value)}
                  placeholder="25"
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-semibold mt-4"
              isLoading={isLoading}
            >
              Create {role === 'CUSTOMER' ? 'Customer' : 'Provider'} Account
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
