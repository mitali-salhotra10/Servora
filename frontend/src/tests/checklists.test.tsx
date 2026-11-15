import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChecklistForm } from '../components/inspections/ChecklistForm';
import { CachedEquipment, db } from '../db';

describe('Dynamic Inspection Checklists (MOD-07 & MOD-09)', () => {
  const extinguisherEquipment: CachedEquipment = {
    id: 'eq-ext-101',
    siteId: 'site-1',
    serialNumber: 'FE-EXT-101',
    qrCodeIdentifier: 'QR-FE-EXT-101',
    equipmentType: 'FIRE_EXTINGUISHER',
    specification: '9kg Dry Chemical',
    locationInSite: 'Server Room Entrance',
    status: 'OPERATIONAL'
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    await db.checklistDrafts.clear();
  });

  it('renders fire extinguisher checklist questions and green-zone indicators', () => {
    render(
      <ChecklistForm
        visitId="visit-101"
        equipment={extinguisherEquipment}
        onSaveCompleted={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/Inspection Checklist: FE-EXT-101/i)).toBeTruthy();
    expect(screen.getByText(/Operating Pressure Gauge Reading/i)).toBeTruthy();
    expect(screen.getByText(/Safety Pull-Pin & Tamper Seal Intact/i)).toBeTruthy();
    expect(screen.getByText(/Discharge Hose & Nozzle Free of Obstructions/i)).toBeTruthy();
  });

  it('validates required questions before submission and blocks incomplete forms', async () => {
    const onSaveSpy = vi.fn();

    render(
      <ChecklistForm
        visitId="visit-101"
        equipment={extinguisherEquipment}
        onSaveCompleted={onSaveSpy}
        onCancel={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Save Checklist for this Asset/i });
    fireEvent.click(submitBtn);

    // Should not call onSaveSpy when required fields are missing
    expect(onSaveSpy).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getAllByText(/is required/i).length).toBeGreaterThan(0);
    });
  });

  it('calculates PASS status when all questions pass and pressure is in green zone', async () => {
    const onSaveSpy = vi.fn();

    render(
      <ChecklistForm
        visitId="visit-101"
        equipment={extinguisherEquipment}
        onSaveCompleted={onSaveSpy}
        onCancel={vi.fn()}
      />
    );

    // Answer all required questions
    const passButtons = screen.getAllByRole('button', { name: /^PASS$/i });
    passButtons.forEach((btn) => fireEvent.click(btn));

    // Fill pressure gauge reading in green zone (150 PSI)
    const pressureInput = screen.getByPlaceholderText(/100 - 195/i);
    fireEvent.change(pressureInput, { target: { value: '150' } });

    await waitFor(() => {
      expect(screen.getByText(/In operable green zone/i)).toBeTruthy();
    });

    const submitBtn = screen.getByRole('button', { name: /Save Checklist for this Asset/i });
    fireEvent.click(submitBtn);

    expect(onSaveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        equipmentId: extinguisherEquipment.id,
        passedInspection: true,
        domainCategory: 'FIRE_EXTINGUISHER'
      })
    );
  });

  it('calculates DEFECT status when an item fails or reading is out of range', async () => {
    const onSaveSpy = vi.fn();

    render(
      <ChecklistForm
        visitId="visit-101"
        equipment={extinguisherEquipment}
        onSaveCompleted={onSaveSpy}
        onCancel={vi.fn()}
      />
    );

    // Click FAIL on first item
    const failButton = screen.getAllByRole('button', { name: /FAIL \/ DEFECT/i })[0];
    fireEvent.click(failButton);

    // Fill other pass items
    const passButtons = screen.getAllByRole('button', { name: /^PASS$/i });
    passButtons.slice(1).forEach((btn) => fireEvent.click(btn));

    const pressureInput = screen.getByPlaceholderText(/100 - 195/i);
    fireEvent.change(pressureInput, { target: { value: '140' } });

    const submitBtn = screen.getByRole('button', { name: /Save Checklist for this Asset/i });
    fireEvent.click(submitBtn);

    expect(onSaveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        equipmentId: extinguisherEquipment.id,
        passedInspection: false
      })
    );
  });
});
