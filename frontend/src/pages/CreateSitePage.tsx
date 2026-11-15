import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sitesApi } from '../api/sites.api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Card } from '../components/common/Card';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ArrowLeft, Navigation } from 'lucide-react';

export const CreateSitePage: React.FC = () => {
  const navigate = useNavigate();

  const [siteName, setSiteName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState('100');
  const [onSiteContactName, setOnSiteContactName] = useState('');
  const [onSiteContactPhone, setOnSiteContactPhone] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setIsLocating(false);
      },
      (err) => {
        setError(`Failed to retrieve GPS location: ${err.message}`);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseInt(geofenceRadiusMeters, 10);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Latitude must be a valid number between -90 and 90');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      setError('Longitude must be a valid number between -180 and 180');
      return;
    }
    if (isNaN(radius) || radius < 10 || radius > 5000) {
      setError('Geofence radius must be between 10 and 5000 meters');
      return;
    }

    setIsLoading(true);
    try {
      await sitesApi.createSite({
        siteName: siteName.trim(),
        address: address.trim(),
        city: city.trim(),
        postalCode: postalCode.trim(),
        latitude: lat,
        longitude: lng,
        geofenceRadiusMeters: radius,
        onSiteContactName: onSiteContactName.trim(),
        onSiteContactPhone: onSiteContactPhone.trim(),
      });

      navigate('/sites');
    } catch (err: any) {
      setError(err.message || 'Failed to create site. Please verify all fields.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link to="/sites">
          <Button variant="ghost" size="sm" aria-label="Back to sites">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Sites
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-slate-900">Register New Facility / Site</h1>
      </div>

      <Card
        title="Physical Site & Geofence Coordinates"
        subtitle="Coordinates are used for tamper-evident technician check-ins during life-safety inspections"
      >
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-6" />}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Facility / Site Name"
            id="siteName"
            required
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="Highland Corporate Plaza - Tower A"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Street Address"
                id="address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="4500 Technology Forest Dr"
              />
            </div>
            <div>
              <Input
                label="City"
                id="city"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Houston"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Input
                label="Postal Code"
                id="postalCode"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="77381"
              />
            </div>
            <div>
              <Input
                label="Geofence Radius (meters)"
                id="geofenceRadius"
                type="number"
                min="10"
                max="5000"
                required
                value={geofenceRadiusMeters}
                onChange={(e) => setGeofenceRadiusMeters(e.target.value)}
                placeholder="100"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleDetectLocation}
                isLoading={isLocating}
              >
                <Navigation className="w-4 h-4 mr-1.5 text-blue-600" />
                Current GPS
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Latitude"
              id="latitude"
              type="text"
              required
              hint="Between -90.000000 and 90.000000"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="29.760427"
            />
            <Input
              label="Longitude"
              id="longitude"
              type="text"
              required
              hint="Between -180.000000 and 180.000000"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="-95.369803"
            />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-800 mb-3">On-Site Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Person Name"
                id="contactName"
                required
                value={onSiteContactName}
                onChange={(e) => setOnSiteContactName(e.target.value)}
                placeholder="Michael Scott (Building Manager)"
              />
              <Input
                label="Contact Phone"
                id="contactPhone"
                type="tel"
                required
                value={onSiteContactPhone}
                onChange={(e) => setOnSiteContactPhone(e.target.value)}
                placeholder="+1 555-0144"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <Link to="/sites">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Save Facility
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
