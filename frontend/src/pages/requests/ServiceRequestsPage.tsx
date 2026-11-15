import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { serviceRequestsApi, ServiceRequest } from '../../api/serviceRequests.api';
import { sitesApi } from '../../api/sites.api';
import { Site } from '../../types';
import {
  Plus,
  CheckCircle2,
  Clock,
  Wrench,
  Building2,
  Calendar,
  X,
  Send
} from 'lucide-react';

export const ServiceRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [category, setCategory] = useState('Fire Extinguisher Service / Refill');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY'>('HIGH');
  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().slice(0, 10));
  const [issueDescription, setIssueDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [reqList, siteList] = await Promise.all([
        serviceRequestsApi.getAll(),
        sitesApi.getMySites()
      ]);
      setRequests(reqList);
      setSites(siteList);
      if (siteList.length > 0 && !selectedSiteId) {
        setSelectedSiteId(siteList[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load service requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedSiteId) {
      setFormError('Please select a facility for this service request.');
      return;
    }

    if (!issueDescription.trim()) {
      setFormError('Please describe the issue or maintenance complaint.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await serviceRequestsApi.create({
        siteId: selectedSiteId,
        category,
        urgency,
        preferredDate,
        customerNotes: issueDescription.trim()
      });

      setRequests((prev) => [created, ...prev]);
      setIsModalOpen(false);
      setIssueDescription('');
      setSuccessMessage(`Service request ${created.ticketNumber} submitted successfully!`);

      setTimeout(() => {
        setSuccessMessage(null);
      }, 6000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit service request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyBadge = (u: string) => {
    switch (u) {
      case 'EMERGENCY':
        return <Badge variant="danger">EMERGENCY</Badge>;
      case 'HIGH':
        return <Badge variant="warning">HIGH PRIORITY</Badge>;
      case 'MEDIUM':
        return <Badge variant="info">MEDIUM</Badge>;
      default:
        return <Badge variant="neutral">LOW</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'SUBMITTED':
        return <Badge variant="info">SUBMITTED</Badge>;
      case 'SCHEDULED':
        return <Badge variant="warning">SCHEDULED</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">IN PROGRESS</Badge>;
      case 'COMPLETED':
      case 'RESOLVED':
        return <Badge variant="success">RESOLVED</Badge>;
      default:
        return <Badge variant="neutral">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Service Requests & Issue Reports</h1>
            <Badge variant="info">{requests.length} Total</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Log maintenance complaints, request equipment refills, or report life-safety defects for immediate dispatch.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Service Request
        </Button>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-emerald-800 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <LoadingSpinner message="Loading service requests..." />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No Service Requests Found"
          description="You do not have any open or historical maintenance service requests."
        />
      ) : (
        /* Requests Table / Cards */
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="p-5 hover:border-slate-300 transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded">
                      {req.ticketNumber}
                    </span>
                    {getStatusBadge(req.status)}
                    {getUrgencyBadge(req.urgency)}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base flex items-center">
                    <Building2 className="w-4 h-4 mr-1.5 text-slate-400" />
                    {req.siteName}
                  </h3>

                  <p className="text-xs font-medium text-slate-700">
                    Category: <span className="text-blue-700 font-semibold">{req.category}</span>
                  </p>

                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100 max-w-2xl">
                    {req.customerNotes || 'No additional notes provided.'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target: {req.preferredDate}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Logged: {new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New Service Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center">
                <Wrench className="w-4 h-4 mr-2 text-blue-400" />
                Submit Life-Safety Service Request
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && <ErrorMessage message={formError} onDismiss={() => setFormError(null)} />}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Facility Site</label>
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
                >
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Fire Extinguisher Service / Refill">Fire Extinguisher Refill</option>
                    <option value="Hydrant Flow & Standpipe Check">Hydrant Flow Defect</option>
                    <option value="Fire Alarm Chirp / Battery Fault">Fire Alarm Fault</option>
                    <option value="Sprinkler Valve Leakage">Sprinkler Leakage</option>
                    <option value="Emergency Exit Light Failure">Exit Light Failure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Level</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low (Routine)</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High Priority</option>
                    <option value="EMERGENCY">Emergency (Life Safety)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Service Date</label>
                <input
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Defect Description & Notes</label>
                <textarea
                  rows={3}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Detail the location of defective unit, pressure status, or alarm symptoms..."
                  className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-3">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmitting}>
                  <Send className="w-4 h-4 mr-2" />
                  {isSubmitting ? 'Submitting...' : 'Dispatch Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
