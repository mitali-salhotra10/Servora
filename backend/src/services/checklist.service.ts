import { DomainCategory } from '@prisma/client';
import { prisma } from '../db/prisma';

export interface ChecklistItemDefinition {
  id: string;
  label: string;
  type: 'boolean' | 'number' | 'text';
  required: boolean;
  unit?: string;
  greenZone?: [number, number]; // [min, max] acceptable range
  helpText?: string;
}

export interface StandardChecklistTemplate {
  domainCategory: DomainCategory;
  title: string;
  version: number;
  items: ChecklistItemDefinition[];
}

export const STANDARD_CHECKLIST_TEMPLATES: Record<DomainCategory, StandardChecklistTemplate> = {
  FIRE_EXTINGUISHER: {
    domainCategory: DomainCategory.FIRE_EXTINGUISHER,
    title: 'Portable Fire Extinguisher Inspection (NFPA 10 / IS 2190)',
    version: 1,
    items: [
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
        label: 'Annual Hydrostatic Test Date Valid',
        type: 'boolean',
        required: true,
        helpText: 'Stamp date must be within valid 5-year retest interval'
      }
    ]
  },
  FIRE_HYDRANT: {
    domainCategory: DomainCategory.FIRE_HYDRANT,
    title: 'Hydrant & Landing Valve Inspection (NFPA 25)',
    version: 1,
    items: [
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
      },
      {
        id: 'FH-05',
        label: 'Drain Valve Weep Hole Draining (No freeze risk)',
        type: 'boolean',
        required: true,
        helpText: 'Barrel must drain automatically when main valve is fully shut'
      }
    ]
  },
  FIRE_ALARM: {
    domainCategory: DomainCategory.FIRE_ALARM,
    title: 'Fire Alarm Control Panel & Initiating Device Test',
    version: 1,
    items: [
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
        label: 'No Open Trouble / Ground Fault Indicators',
        type: 'boolean',
        required: true,
        helpText: 'Panel display must show Normal System Status with 0 active faults'
      },
      {
        id: 'FA-04',
        label: 'Audible Strobe / Hooter Sounder Test',
        type: 'boolean',
        required: true,
        helpText: 'Initiate drill mode to confirm notification appliances fire synchronously'
      }
    ]
  },
  GENERAL_SAFETY: {
    domainCategory: DomainCategory.GENERAL_SAFETY,
    title: 'General Facility Life-Safety Check',
    version: 1,
    items: [
      {
        id: 'GS-01',
        label: 'Emergency Exit Routes Free of Obstructions',
        type: 'boolean',
        required: true
      },
      {
        id: 'GS-02',
        label: 'Emergency Exit Signs Illuminated',
        type: 'boolean',
        required: true
      },
      {
        id: 'GS-03',
        label: 'Fire Extinguisher Signage & Mounting Height Compliant',
        type: 'boolean',
        required: true
      }
    ]
  }
};

export class ChecklistService {
  public static getStandardTemplates(): StandardChecklistTemplate[] {
    return Object.values(STANDARD_CHECKLIST_TEMPLATES);
  }

  public static async getOrCreateTemplate(domainCategory: DomainCategory) {
    const standard = STANDARD_CHECKLIST_TEMPLATES[domainCategory] || STANDARD_CHECKLIST_TEMPLATES.GENERAL_SAFETY;

    const existing = await prisma.checklistTemplate.findFirst({
      where: {
        domainCategory,
        isActive: true
      },
      orderBy: { version: 'desc' }
    });

    if (existing) {
      return existing;
    }

    return prisma.checklistTemplate.create({
      data: {
        domainCategory,
        version: standard.version,
        title: standard.title,
        itemsJson: standard.items as any,
        isActive: true
      }
    });
  }
}
