import React, { useEffect, useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import { EmptyState } from '../../components/common/EmptyState';
import { certificatesApi } from '../../api/certificates.api';
import {
  Download,
  ExternalLink,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export interface CertificateItem {
  id: string;
  certificateNumber: string;
  status: 'VALID' | 'REVOKED' | 'EXPIRED';
  issuedDate: string;
  expirationDate: string;
  verificationHash: string;
  pdfStorageUri?: string;
  site?: {
    id: string;
    siteName: string;
    address: string;
    city: string;
    customer?: {
      id: string;
      companyName: string;
    };
  };
  provider?: {
    id: string;
    businessName: string;
  };
}

export const CertificatesListPage: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await certificatesApi.getMyCertificates();
      setCertificates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load certificates from platform');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-900">Life-Safety Compliance Certificates</h1>
            <Badge variant="success">ISO 17020 Compliant</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Official cryptographically verifiable inspection compliance certificates issued following physical technician audits.
          </p>
        </div>
        <div className="text-right">
          <Badge variant="info">{certificates.length} Verified Records</Badge>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {isLoading ? (
        <LoadingSpinner message="Querying verified trust certificates..." />
      ) : certificates.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No Certificates Found"
          description="Compliance certificates are generated automatically upon successful completion and sealing of technician inspections."
        />
      ) : (
        /* Certificates Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {certificates.map((cert) => {
            const siteName = cert.site?.siteName || 'Facility';
            const customerName = cert.site?.customer?.companyName || 'Registered Customer';
            const providerName = cert.provider?.businessName || 'Certified Service Provider';
            const issuedDateFormatted = new Date(cert.issuedDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            const validUntilFormatted = new Date(cert.expirationDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });

            return (
              <Card key={cert.id} className="p-6 border-t-4 border-t-emerald-600 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
                      {cert.certificateNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 mt-2 text-base">{siteName}</h3>
                    <p className="text-xs text-slate-500">{customerName}</p>
                  </div>
                  <Badge variant={cert.status === 'VALID' ? 'success' : 'danger'}>
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {cert.status} & SEALED
                  </Badge>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Certified Provider:</span>
                    <span className="font-medium text-slate-800">{providerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Date of Issue:</span>
                    <span>{issuedDateFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Valid Until:</span>
                    <span className="font-semibold text-emerald-700">{validUntilFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cryptographic Seal:</span>
                    <span className="font-mono text-[10px] text-slate-600 truncate max-w-[200px]" title={cert.verificationHash}>
                      {cert.verificationHash ? `${cert.verificationHash.slice(0, 16)}...` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={`/verify/${encodeURIComponent(cert.certificateNumber)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Public QR Seal Page
                  </a>

                  <a
                    href={certificatesApi.getPdfUrl(cert.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex"
                  >
                    <Button variant="outline" size="sm">
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download PDF
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
