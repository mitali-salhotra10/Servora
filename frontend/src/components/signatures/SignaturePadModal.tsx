import React, { useRef, useState, useEffect } from 'react';
import { X, Eraser, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';

export interface CustomerSignatureData {
  signerName: string;
  signerTitle: string;
  signatureData: string; // Base64 PNG image
  signedAt: string;
}

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteName: string;
  technicianName: string;
  totalAssets: number;
  passedCount: number;
  defectCount: number;
  onConfirm: (signature: CustomerSignatureData) => void;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  siteName,
  technicianName,
  totalAssets,
  passedCount,
  defectCount,
  onConfirm
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('Facility Manager');
  const [confirmedStatement, setConfirmedStatement] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup canvas high-DPI scaling
  useEffect(() => {
    if (!isOpen) return;

    const setupCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#0f172a'; // Dark slate ink
        ctx.lineWidth = 2.5;
      }
    };

    // Timeout allows DOM modal rendering to complete before reading dimensions
    const timer = setTimeout(setupCanvas, 100);
    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setHasDrawn(true);
    setError(null);

    const { x, y } = getCanvasCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCanvasCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    setError(null);

    if (!signerName.trim()) {
      setError('Please provide the full name of the customer representative.');
      return;
    }

    if (!hasDrawn) {
      setError('Please draw the customer signature inside the signature box.');
      return;
    }

    if (!confirmedStatement) {
      setError('Please review and check the sign-off acknowledgment statement.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');

    onConfirm({
      signerName: signerName.trim(),
      signerTitle: signerTitle.trim() || 'Representative',
      signatureData,
      signedAt: new Date().toISOString()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">Customer Sign-Off & Verification</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Inspection Summary Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Facility Inspection Summary</p>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{siteName}</p>
              </div>
              <span className="text-xs font-medium text-slate-500">Tech: {technicianName}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-blue-200/60 text-center">
              <div>
                <p className="text-xs text-slate-500">Total Assets</p>
                <p className="text-sm font-bold text-slate-800">{totalAssets}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Passed</p>
                <p className="text-sm font-bold text-emerald-600">{passedCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Defects Flagged</p>
                <p className={`text-sm font-bold ${defectCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                  {defectCount}
                </p>
              </div>
            </div>
          </div>

          {/* Representative Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Representative Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Marcus Vance"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Role / Title
              </label>
              <input
                type="text"
                placeholder="e.g. Facility Manager"
                value={signerTitle}
                onChange={(e) => setSignerTitle(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Signature Canvas Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Draw Signature (Touch, Stylus or Mouse) *
              </label>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center space-x-1"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 relative group">
              <canvas
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                style={{ touchAction: 'none' }}
                className="w-full h-36 cursor-crosshair bg-white"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 font-medium text-sm">
                  Sign on the line above
                </div>
              )}
            </div>
          </div>

          {/* Legal Sign-Off Confirmation Checkbox */}
          <div className="flex items-start space-x-2.5 pt-1">
            <input
              id="confirmStatement"
              type="checkbox"
              checked={confirmedStatement}
              onChange={(e) => setConfirmedStatement(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="confirmStatement" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
              I confirm that I am an authorized representative of this facility, that the technician has completed the listed fire safety equipment inspections, and that the recorded observations accurately reflect the current physical state of the life-safety equipment.
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleConfirm}>
            <Check className="w-4 h-4 mr-1.5" />
            Confirm & Sign Off
          </Button>
        </div>
      </div>
    </div>
  );
};
