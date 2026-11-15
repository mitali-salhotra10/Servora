import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { visitsApi } from '../../api/visits.api';
import { db, CachedVisit } from '../../db';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { SyncStatusBanner } from '../../components/common/SyncStatusBanner';
import {
  CalendarCheck2,
  Building2,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';

export const MyVisitsPage: React.FC = () => {
  const [visits, setVisits] = useState<CachedVisit[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOnline } = useSyncStatus();

  const loadVisits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isOnline) {
        // Fetch from API and update local IndexedDB cache
        const remoteVisits = await visitsApi.getMyAssigned();
        setVisits(remoteVisits);

        // Populate IndexedDB cache
        await db.cachedVisits.clear();
        for (const v of remoteVisits) {
          await db.cachedVisits.put(v);
        }
      } else {
        // Load from local IndexedDB cache while offline
        const localVisits = await db.cachedVisits.toArray();
        setVisits(localVisits);
      }
    } catch (err: any) {
      // Fallback to local DB if remote fails
      try {
        const localVisits = await db.cachedVisits.toArray();
        if (localVisits.length > 0) {
          setVisits(localVisits);
        } else {
          setError(err.message || 'Failed to load assigned visits.');
        }
      } catch {
        setError(err.message || 'Failed to load assigned visits.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, [isOnline]);

  const filteredVisits = visits.filter((v) => {
    if (filter === 'PENDING') return v.status !== 'COMPLETED';
    if (filter === 'COMPLETED') return v.status === 'COMPLETED';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success">COMPLETED</Badge>;
      case 'IN_PROGRESS':
      case 'CHECKED_IN':
        return <Badge variant="info">IN PROGRESS</Badge>;
      case 'ASSIGNED':
        return <Badge variant="warning">ASSIGNED</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger">OVERDUE</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Offline and Sync Status Banner */}
      <SyncStatusBanner />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Technician Daily Manifest</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Assigned routine life-safety inspections and maintenance work orders
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-200/70 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({visits.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'PENDING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({visits.filter((v) => v.status !== 'COMPLETED').length})
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              filter === 'COMPLETED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed ({visits.filter((v) => v.status === 'COMPLETED').length})
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <LoadingSpinner message="Loading assigned visits from manifest..." />
      ) : filteredVisits.length === 0 ? (
        <Card className="text-center py-12">
          <CalendarCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No visits in this view</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            You do not currently have any visits matching the selected filter.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredVisits.map((visit) => {
            const isCompleted = visit.status === 'COMPLETED';

            return (
              <div
                key={visit.id}
                className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-slate-900">
                          {visit.site?.siteName || 'Facility Site'}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center mt-0.5">
                          <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {visit.site?.address}, {visit.site?.city}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(visit.status)}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-400 uppercase text-[10px]">Due Date</span>
                      <p className="font-medium text-slate-800 mt-0.5 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        {new Date(visit.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400 uppercase text-[10px]">Visit Type</span>
                      <p className="font-medium text-slate-800 mt-0.5">
                        {visit.visitType.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Geofence: {visit.site?.geofenceRadiusMeters || 100}m
                  </div>

                  <Link to={`/visits/${visit.id}`}>
                    <Button variant={isCompleted ? 'outline' : 'primary'} size="sm">
                      <span>{isCompleted ? 'Review Inspection' : 'Start Execution'}</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
