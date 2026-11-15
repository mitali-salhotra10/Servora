import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QrScannerModal } from '../components/equipment/QrScannerModal';
import { equipmentApi } from '../api/equipment.api';

vi.mock('../api/equipment.api', () => ({
  equipmentApi: {
    getByQr: vi.fn(),
    getBySite: vi.fn(),
    create: vi.fn(),
  },
}));

// Mock html5-qrcode
vi.mock('html5-qrcode', () => {
  return {
    Html5Qrcode: vi.fn().mockImplementation(() => ({
      start: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn(),
      isScanning: false,
    }))
  };
});

describe('Equipment QR Scanner & Asset Verification (MOD-02 & MOD-09)', () => {
  const mockEquipment = {
    id: 'eq-uuid-1',
    siteId: 'site-alpha-123',
    serialNumber: 'FE-889911',
    qrCodeIdentifier: 'QR-FE-889911',
    equipmentType: 'FIRE_EXTINGUISHER',
    specification: '6kg ABC Dry Powder',
    locationInSite: 'Floor 2, Corridor East',
    status: 'OPERATIONAL',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders modal with camera and manual code entry tabs', () => {
    render(
      <QrScannerModal
        isOpen={true}
        onClose={vi.fn()}
        expectedSiteId="site-alpha-123"
        expectedSiteName="Tower Alpha"
        onEquipmentSelected={vi.fn()}
      />
    );

    expect(screen.getByText('Equipment Identification')).toBeTruthy();
    expect(screen.getByText('Site: Tower Alpha')).toBeTruthy();
    expect(screen.getByText('Camera Scanner')).toBeTruthy();
    expect(screen.getByText('Manual Identifier')).toBeTruthy();
  });

  it('switches to manual mode and verifies equipment successfully', async () => {
    vi.mocked(equipmentApi.getByQr).mockResolvedValueOnce(mockEquipment as any);
    const onSelectSpy = vi.fn();

    render(
      <QrScannerModal
        isOpen={true}
        onClose={vi.fn()}
        expectedSiteId="site-alpha-123"
        expectedSiteName="Tower Alpha"
        onEquipmentSelected={onSelectSpy}
      />
    );

    // Switch to manual mode
    fireEvent.click(screen.getByText('Manual Identifier'));

    const input = screen.getByLabelText(/Equipment QR Code or Serial Identifier/i);
    const verifyBtn = screen.getByRole('button', { name: /Verify Equipment/i });

    fireEvent.change(input, { target: { value: 'QR-FE-889911' } });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText('Equipment Verified for Inspection')).toBeTruthy();
      expect(screen.getByText('FE-889911')).toBeTruthy();
      expect(screen.getByText('Floor 2, Corridor East')).toBeTruthy();
    });

    // Click Proceed
    const proceedBtn = screen.getByRole('button', { name: /Start Inspection Checklist/i });
    fireEvent.click(proceedBtn);

    expect(onSelectSpy).toHaveBeenCalledWith(mockEquipment);
  });

  it('rejects equipment belonging to a different facility site', async () => {
    const foreignEquipment = {
      ...mockEquipment,
      siteId: 'foreign-site-999',
      site: { siteName: 'Other Facility' }
    };
    vi.mocked(equipmentApi.getByQr).mockResolvedValueOnce(foreignEquipment as any);

    render(
      <QrScannerModal
        isOpen={true}
        onClose={vi.fn()}
        expectedSiteId="site-alpha-123"
        expectedSiteName="Tower Alpha"
        onEquipmentSelected={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Manual Identifier'));
    const input = screen.getByLabelText(/Equipment QR Code or Serial Identifier/i);
    const verifyBtn = screen.getByRole('button', { name: /Verify Equipment/i });

    fireEvent.change(input, { target: { value: 'QR-FE-889911' } });
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByText(/Site Mismatch/i)).toBeTruthy();
    });
  });
});
