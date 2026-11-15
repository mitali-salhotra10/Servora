import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sitesApi } from '../api/sites.api';
import { Site } from '../types';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Phone,
  User,
  Wrench,
  Calendar
} from 'lucide-react';

export const SitesPage: React.FC = () => {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSites = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await sitesApi.getMySites();
      setSites(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load sites');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const isCustomer = user?.role === 'CUSTOMER' || user?.role === 'ADMIN';

  const filteredSites = sites.filter(
    (site) =>
      site.siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      site.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            {isCustomer ? 'Managed Facilities & Sites' : 'Assigned Service Locations'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Verified physical locations for fire-safety equipment and geofenced inspection check-ins
          </p>
        </div>

        {isCustomer && (
          <Link to="/sites/new">
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              Register Site
            </Button>
          </Link>
        )}
      </div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by site name, address, or city..."
          className="block w-full rounded-md border border-slate-300 pl-9 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 min-h-[44px]"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner message="Loading facilities from database..." />
      ) : filteredSites.length === 0 ? (
        sites.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No facilities registered yet"
            description="Register physical building sites to track fire extinguishers, hydrants, and compliance schedules."
            actionText={isCustomer ? 'Register First Site' : undefined}
            onAction={isCustomer ? () => (window.location.href = '/sites/new') : undefined}
          />
        ) : (
          <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
            <p className="text-sm text-slate-500">
              No facilities match the search "{searchTerm}"
            </p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSites.map((site) => (
            <div
              key={site.id}
              className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    Radius: {site.geofenceRadiusMeters}m
                  </span>
                </div>

                <h3 className="font-semibold text-base text-slate-900 mt-3 line-clamp-1">
                  {site.siteName}
                </h3>
                <p className="text-xs text-slate-500 flex items-center mt-1">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                  <span>{site.address}, {site.city} ({site.postalCode})</span>
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    <span>Contact: {site.onSiteContactName}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                    <span>{site.onSiteContactPhone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center" title="Equipment Count">
                    <Wrench className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {site._count?.equipment || 0}
                  </span>
                  <span className="flex items-center" title="Scheduled Visits">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {site._count?.visitSchedules || 0}
                  </span>
                </div>

                <Link to={`/sites/${site.id}`}>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
