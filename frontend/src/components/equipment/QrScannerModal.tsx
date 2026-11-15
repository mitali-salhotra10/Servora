import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { equipmentApi } from '../../api/equipment.api';
import { CachedEquipment } from '../../db';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ErrorMessage } from '../common/ErrorMessage';
import { LoadingSpinner } from '../common/LoadingSpinner';
import {
  QrCode,
  Camera,
  X,
  Keyboard,
  CheckCircle
} from 'lucide-react';

export interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  expectedSiteId: string;
  expectedSiteName: string;
  onEquipmentSelected: (equipment: CachedEquipment) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  expectedSiteId,
  expectedSiteName,
  onEquipmentSelected
}) => {
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifiedEquipment, setVerifiedEquipment] = useState<CachedEquipment | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrRegionId = 'qr-reader-viewport';

  useEffect(() => {
    if (!isOpen) {
      stopCameraScanner();
      setVerifiedEquipment(null);
      setError(null);
      return;
    }

    if (mode === 'camera') {
      startCameraScanner();
    } else {
      stopCameraScanner();
    }

    return () => {
      stopCameraScanner();
    };
  }, [isOpen, mode]);

  const startCameraScanner = async () => {
    setError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrRegionId);
      }

      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        setError('No camera detected on this device. Use manual code entry below.');
        setMode('manual');
        return;
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText) => {
          await handleResolveCode(decodedText);
        },
        () => {
          // Frame error (no QR detected in frame), silent ignore
        }
      );
    } catch (err: any) {
      setError(`Camera access error: ${err.message || 'Permission denied'}. Please use manual entry.`);
      setMode('manual');
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Ignored on teardown
      }
    }
  };

  const handleResolveCode = async (rawCode: string) => {
    const trimmed = rawCode.trim();
    if (!trimmed) {
      setError('Please enter a valid QR code or serial number');
      return;
    }

    stopCameraScanner();
    setIsLoading(true);
    setError(null);

    try {
      const equipment = await equipmentApi.getByQr(trimmed);

      // Verify equipment belongs to the expected site
      if (equipment.siteId !== expectedSiteId) {
        setError(
          `Site Mismatch: Equipment "${equipment.serialNumber}" belongs to site "${equipment.site?.siteName || equipment.siteId}", not "${expectedSiteName}".`
        );
        return;
      }

      setVerifiedEquipment(equipment);
    } catch (err: any) {
      setError(err.message || `No equipment registered with QR code "${trimmed}".`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAndProceed = () => {
    if (verifiedEquipment) {
      onEquipmentSelected(verifiedEquipment);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Equipment Identification</h3>
              <p className="text-xs text-slate-500">Site: {expectedSiteName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg touch-target flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

          {/* Verification Card Result */}
          {verifiedEquipment ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Equipment Verified for Inspection</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 pt-2 border-t border-emerald-200/60">
                <div>
                  <span className="font-semibold text-slate-500 uppercase">Serial Number</span>
                  <p className="font-mono text-sm text-slate-900">{verifiedEquipment.serialNumber}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase">Type</span>
                  <p className="font-medium text-slate-900">{verifiedEquipment.equipmentType}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase">QR Tag</span>
                  <p className="font-mono text-slate-900">{verifiedEquipment.qrCodeIdentifier}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 uppercase">Location in Site</span>
                  <p className="font-medium text-slate-900">{verifiedEquipment.locationInSite || 'Not specified'}</p>
                </div>
              </div>

              <div className="pt-3 flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVerifiedEquipment(null);
                    if (mode === 'camera') startCameraScanner();
                  }}
                >
                  Rescan
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1"
                  onClick={handleConfirmAndProceed}
                >
                  Start Inspection Checklist
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Tab Selector between Camera and Manual Input */}
              <div className="flex border-b border-slate-200 mb-4">
                <button
                  type="button"
                  onClick={() => setMode('camera')}
                  className={`pb-2.5 px-4 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors touch-target ${
                    mode === 'camera'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span>Camera Scanner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className={`pb-2.5 px-4 text-xs font-semibold flex items-center space-x-1.5 border-b-2 transition-colors touch-target ${
                    mode === 'manual'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Keyboard className="w-4 h-4" />
                  <span>Manual Identifier</span>
                </button>
              </div>

              {isLoading && <LoadingSpinner message="Resolving equipment record..." />}

              {mode === 'camera' ? (
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-black flex items-center justify-center min-h-[260px]">
                    <div id={qrRegionId} className="w-full" />
                  </div>
                  <p className="text-xs text-center text-slate-500">
                    Align equipment QR code inside the viewfinder window
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleResolveCode(manualCode);
                  }}
                  className="space-y-4"
                >
                  <Input
                    label="Equipment QR Code or Serial Identifier"
                    id="manualCodeInput"
                    required
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. QR-FE-998811 or FE-998811"
                    hint="Scan tag on physical asset or enter alphanumeric ID"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full font-semibold"
                    isLoading={isLoading}
                  >
                    Verify Equipment
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
