import React, { useState, useEffect } from 'react';
import { db, CachedEquipment, ChecklistDraft } from '../../db';
import { Button } from '../common/Button';
import { EvidenceCapture } from './EvidenceCapture';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Save,
  Check
} from 'lucide-react';

export interface ChecklistItemDef {
  id: string;
  label: string;
  type: 'boolean' | 'number' | 'text';
  required: boolean;
  unit?: string;
  greenZone?: [number, number];
  helpText?: string;
}

// Built-in offline fallback templates per category
const EQUIPMENT_TEMPLATES: Record<string, ChecklistItemDef[]> = {
  FIRE_EXTINGUISHER: [
    {
      id: 'FE-01',
      label: 'Cylinder Physical Condition (No dents, rust, or deep corrosion)',
      type: 'boolean',
      required: true,
      helpText: 'Examine external shell for structural compromise or mechanical impact damage'
    },
    {
      id: 'FE-02',
      label: 'Operating Pressure Gauge Reading (PSI)',
      type: 'number',
      required: true,
      unit: 'PSI',
      greenZone: [100, 195],
      helpText: 'Indicator needle must point firmly inside the operable green pie-slice region'
    },
    {
      id: 'FE-03',
      label: 'Safety Pull-Pin & Tamper Seal Intact',
      type: 'boolean',
      required: true,
      helpText: 'Plastic security tie must be unsevered with wire pin securely lodged'
    },
    {
      id: 'FE-04',
      label: 'Discharge Hose & Nozzle Free of Obstructions',
      type: 'boolean',
      required: true,
      helpText: 'Verify no horn insect nests, dirt build-up, or hose dry-rot cracking'
    },
    {
      id: 'FE-05',
      label: 'Gross Weight Measurement (kg)',
      type: 'number',
      required: false,
      unit: 'kg',
      helpText: 'Weigh CO2 / dry powder cylinder to confirm no charge loss (>10% loss requires refill)'
    },
    {
      id: 'FE-06',
      label: 'Annual Hydrostatic Retest Stamp Valid',
      type: 'boolean',
      required: true,
      helpText: 'Stamp date must be within valid 5-year retest interval'
    }
  ],
  FIRE_HYDRANT: [
    {
      id: 'FH-01',
      label: 'Physical Access Unobstructed (Minimum 1-meter clear radius)',
      type: 'boolean',
      required: true,
      helpText: 'No parked vehicles, landscaping shrubs, or storage containers blocking access'
    },
    {
      id: 'FH-02',
      label: 'Spindle & Valve Operation (Turns freely without seizing)',
      type: 'boolean',
      required: true,
      helpText: 'Exercise wheel 3 full revolutions to confirm smooth packing gland movement'
    },
    {
      id: 'FH-03',
      label: 'Static Line Pressure Test (bar)',
      type: 'number',
      required: true,
      unit: 'bar',
      greenZone: [4, 12],
      helpText: 'Ring main pressure gauge must hold steady above 4 bar'
    },
    {
      id: 'FH-04',
      label: 'Coupling Lug & Lug Gasket Condition',
      type: 'boolean',
      required: true,
      helpText: 'Ensure rubber washer gasket is pliable and brass lugs show no stripping'
    }
  ],
  FIRE_ALARM_PANEL: [
    {
      id: 'FA-01',
      label: 'Main AC Power Healthy (Green LED Solid)',
      type: 'boolean',
      required: true,
      helpText: 'Primary power supply incoming breaker energized'
    },
    {
      id: 'FA-02',
      label: 'Standby Battery Voltage (V DC)',
      type: 'number',
      required: true,
      unit: 'V',
      greenZone: [24, 28],
      helpText: 'Float voltage across dual sealed lead-acid series pair'
    },
    {
      id: 'FA-03',
      label: 'No Active Trouble / Ground Fault Indicators',
      type: 'boolean',
      required: true
    },
    {
      id: 'FA-04',
      label: 'Audible Strobe / Hooter Sounder Test',
      type: 'boolean',
      required: true
    }
  ],
  DETECTOR_SENSOR: [
    {
      id: 'DS-01',
      label: 'Sensor Chamber Clean of Dust and Debris',
      type: 'boolean',
      required: true
    },
    {
      id: 'DS-02',
      label: 'Aerosol Smoke Test Response Time (seconds)',
      type: 'number',
      required: true,
      unit: 'sec',
      greenZone: [1, 15]
    },
    {
      id: 'DS-03',
      label: 'LED Status Indicator Flashing Normal',
      type: 'boolean',
      required: true
    }
  ]
};

export interface ChecklistFormProps {
  visitId: string;
  equipment: CachedEquipment;
  onSaveCompleted: (result: {
    equipmentId: string;
    domainCategory: string;
    responsesJson: Record<string, any>;
    passedInspection: boolean;
    defectNotes?: string;
    photoEvidenceUri?: string;
    photoEvidenceType?: string;
  }) => void;
  onCancel: () => void;
}

export const ChecklistForm: React.FC<ChecklistFormProps> = ({
  visitId,
  equipment,
  onSaveCompleted,
  onCancel
}) => {
  const templateKey = equipment.equipmentType || 'FIRE_EXTINGUISHER';
  const questions: ChecklistItemDef[] =
    EQUIPMENT_TEMPLATES[templateKey] || EQUIPMENT_TEMPLATES.FIRE_EXTINGUISHER;

  const draftKey = `${visitId}_${equipment.id}`;

  const [responses, setResponses] = useState<Record<string, any>>({});
  const [defectNotes, setDefectNotes] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [photoMime, setPhotoMime] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDraftRestored, setIsDraftRestored] = useState(false);

  // Restore draft from IndexedDB
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const draft = await db.checklistDrafts.get(draftKey);
        if (draft) {
          setResponses(draft.responsesJson || {});
          setDefectNotes(draft.defectNotes || '');
          setPhotoUri(draft.photoEvidenceUri);
          setPhotoMime(draft.photoEvidenceType);
          setIsDraftRestored(true);
        }
      } catch {
        // Ignored
      }
    };
    loadDraft();
  }, [draftKey]);

  // Auto-save draft on response change
  const saveDraftToDb = async (
    updatedResponses: Record<string, any>,
    updatedNotes: string,
    evidenceUri?: string,
    evidenceMime?: string
  ) => {
    try {
      const draft: ChecklistDraft = {
        id: draftKey,
        visitId,
        equipmentId: equipment.id,
        equipmentType: equipment.equipmentType,
        responsesJson: updatedResponses,
        passedInspection: calculateOverallPass(updatedResponses),
        defectNotes: updatedNotes,
        photoEvidenceUri: evidenceUri,
        photoEvidenceType: evidenceMime,
        updatedAt: new Date().toISOString()
      };
      await db.checklistDrafts.put(draft);
    } catch {
      // Best-effort IndexedDB persistence
    }
  };

  const calculateOverallPass = (resps: Record<string, any>): boolean => {
    for (const q of questions) {
      const val = resps[q.id];
      if (q.type === 'boolean' && val === false) {
        return false;
      }
      if (q.type === 'number' && q.greenZone && typeof val === 'number') {
        if (val < q.greenZone[0] || val > q.greenZone[1]) {
          return false;
        }
      }
    }
    return true;
  };

  const handleBooleanChange = (questionId: string, value: boolean) => {
    const updated = { ...responses, [questionId]: value };
    setResponses(updated);
    if (errors[questionId]) {
      const newErr = { ...errors };
      delete newErr[questionId];
      setErrors(newErr);
    }
    saveDraftToDb(updated, defectNotes, photoUri, photoMime);
  };

  const handleNumberChange = (questionId: string, rawVal: string) => {
    const num = parseFloat(rawVal);
    const updated = { ...responses, [questionId]: isNaN(num) ? undefined : num };
    setResponses(updated);
    if (errors[questionId]) {
      const newErr = { ...errors };
      delete newErr[questionId];
      setErrors(newErr);
    }
    saveDraftToDb(updated, defectNotes, photoUri, photoMime);
  };

  const handleNotesChange = (val: string) => {
    setDefectNotes(val);
    saveDraftToDb(responses, val, photoUri, photoMime);
  };

  const handleEvidenceCaptured = (data: { uri: string; mimeType: string }) => {
    setPhotoUri(data.uri);
    setPhotoMime(data.mimeType);
    saveDraftToDb(responses, defectNotes, data.uri, data.mimeType);
  };

  const handleEvidenceRemoved = () => {
    setPhotoUri(undefined);
    setPhotoMime(undefined);
    saveDraftToDb(responses, defectNotes, undefined, undefined);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const q of questions) {
      if (q.required) {
        const val = responses[q.id];
        if (val === undefined || val === null || val === '') {
          newErrors[q.id] = `${q.label} is required`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const passed = calculateOverallPass(responses);

    onSaveCompleted({
      equipmentId: equipment.id,
      domainCategory:
        equipment.equipmentType === 'FIRE_HYDRANT'
          ? 'FIRE_HYDRANT'
          : equipment.equipmentType === 'FIRE_ALARM_PANEL' || equipment.equipmentType === 'DETECTOR_SENSOR'
          ? 'FIRE_ALARM'
          : 'FIRE_EXTINGUISHER',
      responsesJson: responses,
      passedInspection: passed,
      defectNotes: defectNotes.trim() || undefined,
      photoEvidenceUri: photoUri,
      photoEvidenceType: photoMime
    });
  };

  const isCurrentPass = calculateOverallPass(responses);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">
              Inspection Checklist: {equipment.serialNumber}
            </h2>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">
              {equipment.qrCodeIdentifier}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Type: {equipment.equipmentType} | Location: {equipment.locationInSite || 'Facility Site'}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isDraftRestored && (
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded flex items-center">
              <Save className="w-3 h-3 mr-1 text-slate-500" /> Draft restored from IndexedDB
            </span>
          )}
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
              isCurrentPass
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {isCurrentPass ? 'Status: PASS' : 'Status: DEFECT DETECTED'}
          </span>
        </div>
      </div>

      {/* Dynamic Questions List */}
      <div className="space-y-5">
        {questions.map((q, idx) => {
          const val = responses[q.id];
          const hasError = !!errors[q.id];

          return (
            <div
              key={q.id}
              className={`p-4 rounded-lg border transition-colors ${
                hasError
                  ? 'border-red-300 bg-red-50/20'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 mr-2">#{idx + 1}</span>
                  <label className="text-sm font-semibold text-slate-800">
                    {q.label}
                    {q.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {q.helpText && (
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center">
                      <Info className="w-3 h-3 mr-1 text-slate-400" />
                      {q.helpText}
                    </p>
                  )}
                </div>
              </div>

              {/* Input Control by Question Type */}
              <div className="mt-3">
                {q.type === 'boolean' ? (
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => handleBooleanChange(q.id, true)}
                      className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all touch-target border ${
                        val === true
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>PASS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBooleanChange(q.id, false)}
                      className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all touch-target border ${
                        val === false
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>FAIL / DEFECT</span>
                    </button>
                  </div>
                ) : q.type === 'number' ? (
                  <div>
                    <div className="flex items-center space-x-2 max-w-xs">
                      <input
                        type="number"
                        step="any"
                        value={val !== undefined ? val : ''}
                        onChange={(e) => handleNumberChange(q.id, e.target.value)}
                        placeholder={q.greenZone ? `${q.greenZone[0]} - ${q.greenZone[1]}` : 'Reading'}
                        className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[44px]"
                      />
                      {q.unit && <span className="text-xs font-semibold text-slate-600">{q.unit}</span>}
                    </div>

                    {q.greenZone && typeof val === 'number' && (
                      <div className="mt-1.5">
                        {val >= q.greenZone[0] && val <= q.greenZone[1] ? (
                          <span className="text-xs text-emerald-700 font-medium flex items-center">
                            <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            In operable green zone ({q.greenZone[0]}–{q.greenZone[1]} {q.unit})
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium flex items-center">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-500" />
                            Out of range: requires attention ({q.greenZone[0]}–{q.greenZone[1]} {q.unit})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : null}

                {hasError && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{errors[q.id]}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Defect Notes */}
      <div className="pt-2">
        <label htmlFor="defectNotes" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          Technician Observations & Defect Notes
        </label>
        <textarea
          id="defectNotes"
          rows={3}
          value={defectNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Record any abnormal findings, missing seals, or recommended maintenance actions..."
          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Evidence Photo */}
      <div className="pt-2 border-t border-slate-100">
        <EvidenceCapture
          evidenceUri={photoUri}
          onEvidenceCaptured={handleEvidenceCaptured}
          onEvidenceRemoved={handleEvidenceRemoved}
        />
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary">
          <Check className="w-4 h-4 mr-1.5" />
          Save Checklist for this Asset
        </Button>
      </div>
    </form>
  );
};
