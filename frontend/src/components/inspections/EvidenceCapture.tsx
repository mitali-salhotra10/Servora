import React, { useState, useRef } from 'react';
import { Camera, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { ErrorMessage } from '../common/ErrorMessage';

export interface EvidenceCaptureProps {
  label?: string;
  evidenceUri?: string;
  onEvidenceCaptured: (data: { uri: string; mimeType: string; sizeBytes: number }) => void;
  onEvidenceRemoved: () => void;
}

export const EvidenceCapture: React.FC<EvidenceCaptureProps> = ({
  label = 'Photographic Evidence (Pressure Gauge / Tag / Asset Condition)',
  evidenceUri,
  onEvidenceCaptured,
  onEvidenceRemoved
}) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate MIME type
    if (!file.type.startsWith('image/')) {
      setError('Only image files (JPEG, PNG, WebP) are accepted as inspection evidence.');
      return;
    }

    // Validate size limit (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('Evidence image exceeds the 5MB size limit. Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Uri = reader.result as string;
      onEvidenceCaptured({
        uri: base64Uri,
        mimeType: file.type,
        sizeBytes: file.size
      });
    };
    reader.onerror = () => {
      setError('Failed to process image file.');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3">
      <span className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
        {label}
      </span>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {evidenceUri ? (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-900/5 group max-w-sm">
          <img
            src={evidenceUri}
            alt="Inspection evidence preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute top-2 right-2 flex space-x-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 bg-slate-900/80 text-white rounded-md hover:bg-slate-900 shadow touch-target flex items-center justify-center text-xs"
              title="Replace Photo"
            >
              <Camera className="w-3.5 h-3.5 mr-1" /> Replace
            </button>
            <button
              type="button"
              onClick={onEvidenceRemoved}
              className="p-1.5 bg-red-600/90 text-white rounded-md hover:bg-red-700 shadow touch-target flex items-center justify-center"
              title="Remove Photo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-2 bg-white border-t border-slate-100 flex items-center text-xs text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            <span>Evidence photo ready for synchronization</span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-4 h-4 mr-2 text-blue-600" />
            Take Photo / Attach Evidence
          </Button>
          <span className="text-xs text-slate-400">
            Stored locally in IndexedDB while offline
          </span>
        </div>
      )}
    </div>
  );
};
