import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificatesApi, PublicCertificateVerification } from '../../api/certificates.api';
import { ShieldCheck, ShieldAlert, CheckCircle, FileText, Search, Building2, Wrench } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const CertificateVerificationPage: React.FC = () => {
  const { certificateNumber: paramCertNumber } = useParams<{ certificateNumber?: string }>();
  const [searchQuery, setSearchQuery] = useState(paramCertNumber || '');
  const [activeNumber, setActiveNumber] = useState<string | null>(paramCertNumber || null);

  const [verification, setVerification] = useState<PublicCertificateVerification | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paramCertNumber) {
      setActiveNumber(paramCertNumber);
      setSearchQuery(paramCertNumber);
    }
  }, [paramCertNumber]);

  useEffect(() => {
    if (!activeNumber) return;

    const verifyCert = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setVerification(null);
        const data = await certificatesApi.verifyCertificate(activeNumber);
        setVerification(data);
      } catch (err: any) {
        setError(err.message || 'Certificate not found or unverified');
      } finally {
        setIsLoading(false);
      }
    };

    verifyCert();
  }, [activeNumber]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveNumber(searchQuery.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 sm:px-12 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shadow-sm">
            S
          </div>
          <div>
            <span className="text-base font-extrabold tracking-tight text-slate-900">SERVORA</span>
            <span className="block text-[10px] text-blue-600 font-semibold tracking-wider uppercase">Trust Verification Portal</span>
          </div>
        </Link>
        <Link to="/login" className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition">
          Sign In &rarr;
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 space-y-6">
        {/* Search Input Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900 mb-1">Verify Fire Safety Certificate</h1>
          <p className="text-xs text-slate-500 mb-4">
            Enter the unique Servora compliance certificate number or scan the QR code to verify life-safety authenticity.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. CERT-2026-F00189"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg uppercase tracking-wider focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
              />
            </div>
            <Button type="submit" variant="primary">
              Verify
            </Button>
          </form>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Verifying cryptographic trust seal...</p>
            <p className="text-xs text-slate-400 mt-1">Checking canonical SHA-256 integrity against Servora Ledger</p>
          </div>
        )}

        {/* Error / Invalid Certificate State */}
        {!isLoading && error && (
          <div className="bg-white rounded-xl border border-red-200 p-8 shadow-sm text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Certificate Not Verified</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              {error}
            </p>
            <div className="pt-2 text-xs text-slate-400 font-mono">
              Searched: {activeNumber}
            </div>
          </div>
        )}

        {/* Authentic Valid Certificate Card */}
        {!isLoading && verification && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-fadeIn">
            {/* Verdict Header Banner */}
            <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              verification.status === 'VALID' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start space-x-3.5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  verification.status === 'VALID' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-amber-600 text-white'
                }`}>
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Authentic Certificate
                    </span>
                    <Badge variant={verification.status === 'VALID' ? 'success' : 'warning'}>
                      {verification.status}
                    </Badge>
                  </div>
                  <h2 className="text-xl font-mono font-bold text-slate-900 mt-0.5">
                    {verification.certificateNumber}
                  </h2>
                </div>
              </div>

              {/* Download PDF button */}
              <a
                href={certificatesApi.getPdfUrl(verification.certificateNumber)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="bg-white hover:bg-slate-50">
                  <FileText className="w-4 h-4 mr-1.5 text-blue-600" />
                  View PDF Certificate
                </Button>
              </a>
            </div>

            {/* Metadata Grid */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <Building2 className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Facility (PII Masked)</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{verification.maskedSiteName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Location privacy protected (SEC-006)</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center space-x-2 text-slate-500 mb-1">
                    <Wrench className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Certified Contractor</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{verification.providerBusinessName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Authorized field inspection provider</p>
                </div>
              </div>

              {/* Dates & Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center py-2 border-y border-slate-100">
                <div>
                  <p className="text-xs text-slate-500">Issue Date</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{verification.issuedDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Valid Until</p>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">{verification.expirationDate}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Assets Inspected</p>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{verification.equipmentCount}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Compliance Verdict</p>
                  <p className={`text-sm font-bold mt-0.5 ${
                    verification.complianceVerdict === 'COMPLIANT' ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {verification.complianceVerdict === 'COMPLIANT' ? 'PASS' : 'CONDITIONAL'}
                  </p>
                </div>
              </div>

              {/* SHA-256 Trust Seal Box */}
              <div className="bg-slate-900 text-slate-200 rounded-lg p-4 font-mono text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span className="flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CANONICAL SHA-256 RECORD HASH SEAL (SEC-007)</span>
                  </span>
                  <span className="text-emerald-400 font-semibold">VERIFIED VALID</span>
                </div>
                <p className="text-sky-300 break-all select-all font-mono">
                  {verification.verificationHash}
                </p>
              </div>

              {/* Privacy Boundary Notice */}
              <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                This public verification portal displays certified compliance status in accordance with privacy specification SEC-006. Personal phone numbers, billing records, and private customer signature data are securely masked.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
        Servora Field-Service & Life-Safety Compliance Platform • Cryptographically Sealed
      </footer>
    </div>
  );
};
