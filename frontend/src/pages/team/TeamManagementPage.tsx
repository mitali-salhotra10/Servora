import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { apiClient } from '../../api/client';
import { UserPlus, Phone, Mail, Award, RefreshCw, Users } from 'lucide-react';

interface TeamMember {
  id: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  providerProfile?: {
    businessName: string;
    licenseNumber: string;
  };
}

export const TeamManagementPage: React.FC = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.get<{ success: boolean; data: TeamMember[] }>('/team');
      setTeam(res.data.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load field service team');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Field Service Technicians & Managers</h1>
            <Badge variant="info">{team.length} Active Personnel</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Live database registry of certified field engineers, managers, and service providers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchTeam}>
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => alert('New team member registration is available in User Management')}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            Add Team Member
          </Button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <LoadingSpinner message="Querying live service team from PostgreSQL..." />
      ) : team.length === 0 ? (
        <Card className="p-8 text-center text-slate-500">
          <Users className="w-10 h-10 mx-auto text-slate-400 mb-2" />
          <p className="font-semibold text-slate-700">No technicians found</p>
          <p className="text-xs text-slate-400 mt-1">Technicians registered with your service provider will appear here.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {team.map((member) => (
            <Card key={member.id} className="p-5 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{member.email.split('@')[0].replace('.', ' ').toUpperCase()}</h3>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{member.email}</span>
                  </div>
                  {member.phone && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>
                <Badge variant={member.role === 'SERVICE_MANAGER' ? 'success' : 'info'}>
                  {member.role === 'SERVICE_MANAGER' ? 'Manager' : 'Technician'}
                </Badge>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>{member.providerProfile?.licenseNumber || 'Certified Life Safety Tech'}</span>
                </div>
                <Badge variant="neutral">ACTIVE</Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
