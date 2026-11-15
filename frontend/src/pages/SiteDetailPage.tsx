import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sitesApi } from '../api/sites.api';
import { Site } from '../types';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Badge } from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Wrench,
  Compass,
  Edit2,
  Check,
  X
} from 'lucide-react';

export const SiteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [site, setSite] = useState<Site | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit fields
  const [onSiteContactName, setOnSiteContactName] = useState('');
  const [onSiteContactPhone, setOnSiteContactPhone] = useState('');
  const [geofenceRadiusMeters, setGeofenceRadiusMeters] = useState('100');

  useEffect(() => {
    const fetchSite = async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        setError(null);
        const data = await sitesApi.getSiteById(id);
        setSite(data);
        setOnSiteContactName(data.onSiteContactName);
        setOnSiteContactPhone(data.onSiteContactPhone);
        setGeofenceRadiusMeters(data.geofenceRadiusMeters.toString());
      } catch (err: any) {
        setError(err.message || 'Failed to load site details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSite();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !site) return;

    const radius = parseInt(geofenceRadiusMeters, 10);
    if (isNaN(radius) || radius < 10 || radius > 5000) {
      setError('Geofence radius must be between 10 and 5000 meters');
      return;
    }

    setIsSaving(true);
    try {
      const updated = await sitesApi.updateSite(id, {
        onSiteContactName: onSiteContactName.trim(),
        onSiteContactPhone: onSiteContactPhone.trim(),
        geofenceRadiusMeters: radius,
      });
      setSite(updated);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update site');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading facility details..." />;
  }

  if (error || !site) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Link to="/sites">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Sites
          </Button>
        </Link>
        <ErrorMessage message={error || 'Site not found'} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link to="/sites">
            <Button variant="ghost" size="sm" aria-label="Back to sites">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Sites
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{site.siteName}</h1>
            <p className="text-xs text-slate-500 flex items-center mt-0.5">
              <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
              {site.address}, {site.city} ({site.postalCode})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Information
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
              <X className="w-3.5 h-3.5 mr-1.5" /> Cancel
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <Card title="Edit Contact & Geofence Settings">
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="On-Site Contact Name"
                required
                value={onSiteContactName}
                onChange={(e) => setOnSiteContactName(e.target.value)}
              />
              <Input
                label="On-Site Contact Phone"
                required
                value={onSiteContactPhone}
                onChange={(e) => setOnSiteContactPhone(e.target.value)}
              />
            </div>
            <Input
              label="Geofence Radius (meters)"
              type="number"
              min="10"
              max="5000"
              required
              value={geofenceRadiusMeters}
              onChange={(e) => setGeofenceRadiusMeters(e.target.value)}
              hint="Allowed distance for mobile technician check-in validation"
            />
            <div className="flex justify-end space-x-3 pt-3">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSaving}>
                <Check className="w-4 h-4 mr-1.5" /> Save Changes
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <Card title="Facility Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Street Address</span>
                  <p className="font-medium text-slate-800 mt-0.5">{site.address}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">City & Postal</span>
                  <p className="font-medium text-slate-800 mt-0.5">
                    {site.city}, {site.postalCode}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Primary Contact</span>
                  <p className="font-medium text-slate-800 mt-0.5 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {site.onSiteContactName}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Phone</span>
                  <p className="font-medium text-slate-800 mt-0.5 flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {site.onSiteContactPhone}
                  </p>
                </div>
              </div>
            </Card>

            {/* Equipment Register */}
            <Card
              title="Equipment Registry (Phase 4)"
              subtitle="Registered fire protection units at this facility"
            >
              {site.equipment && site.equipment.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {site.equipment.map((eq) => (
                    <div key={eq.id} className="py-2.5 flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2.5">
                        <Wrench className="w-4 h-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-800">{eq.equipmentType}</p>
                          <p className="text-xs text-slate-400">QR: {eq.qrCode}</p>
                        </div>
                      </div>
                      <Badge variant="info">{eq.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p>No equipment registered yet for this site.</p>
                  <p className="text-slate-400 mt-1">
                    Equipment scanning & cataloging will be enabled in Phase 4.
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar: Geofence & Trust Status */}
          <div className="space-y-6">
            <Card title="Geofence Check-in">
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-500 uppercase">Latitude</span>
                  <p className="font-mono text-sm text-slate-800 mt-0.5">{site.latitude.toString()}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase">Longitude</span>
                  <p className="font-mono text-sm text-slate-800 mt-0.5">{site.longitude.toString()}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase">Geofence Radius</span>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {site.geofenceRadiusMeters} meters
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center text-emerald-700 bg-emerald-50 p-2.5 rounded border border-emerald-200">
                    <Compass className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Coordinates verified for technician dispatch</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Activity Summary">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Equipment Count</span>
                  <span className="font-semibold text-slate-800">{site._count?.equipment || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Scheduled Visits</span>
                  <span className="font-semibold text-slate-800">{site._count?.visitSchedules || 0}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Active Contracts</span>
                  <span className="font-semibold text-slate-800">{site._count?.contracts || 0}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
