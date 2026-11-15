import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SignaturePadModal } from '../components/signatures/SignaturePadModal';
import { CertificateVerificationPage } from '../pages/public/CertificateVerificationPage';
import { certificatesApi } from '../api/certificates.api';

// Mock certificates API
vi.mock('../api/certificates.api', () => ({
  certificatesApi: {
    verifyCertificate: vi.fn(),
    getPdfUrl: vi.fn((certNo: string) => `/api/v1/certificates/${certNo}/pdf`),
  },
}));

// Setup canvas mock for JSDOM
beforeEach(() => {
  vi.restoreAllMocks();

  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    scale: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
    lineCap: 'round',
    lineJoin: 'round',
    strokeStyle: '#0f172a',
    lineWidth: 2.5,
  }) as any;

  HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mockPngSignatureData');
  HTMLCanvasElement.prototype.setPointerCapture = vi.fn();
  HTMLCanvasElement.prototype.releasePointerCapture = vi.fn();
  HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn().mockReturnValue({
    left: 0,
    top: 0,
    width: 400,
    height: 180,
  });
});

describe('Phase 5 Frontend — Digital Signature Modal (MOD-09 / FR-044)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    siteName: 'Alpha Logistics Warehouse',
    technicianName: 'tech@servora.com',
    totalAssets: 12,
    passedCount: 11,
    defectCount: 1,
    onConfirm: vi.fn(),
  };

  it('renders inspection summary metrics and customer confirmation requirements', () => {
    render(<SignaturePadModal {...defaultProps} />);

    expect(screen.getByText('Customer Sign-Off & Verification')).toBeTruthy();
    expect(screen.getByText('Alpha Logistics Warehouse')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy(); // total assets
    expect(screen.getByText('11')).toBeTruthy(); // passed
    expect(screen.getByText('1')).toBeTruthy(); // defect
    expect(screen.getByPlaceholderText('e.g. Marcus Vance')).toBeTruthy();
    expect(screen.getByText(/I confirm that I am an authorized representative/i)).toBeTruthy();
  });

  it('validates that signer name is required', () => {
    render(<SignaturePadModal {...defaultProps} />);

    // Attempt to confirm without typing name
    fireEvent.click(screen.getByText('Confirm & Sign Off'));

    expect(screen.getByText('Please provide the full name of the customer representative.')).toBeTruthy();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('validates that signature drawing is required before confirming', () => {
    render(<SignaturePadModal {...defaultProps} />);

    // Type signer name and check confirmation statement, but do not draw on canvas
    fireEvent.change(screen.getByPlaceholderText('e.g. Marcus Vance'), {
      target: { value: 'Alice Smith' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    // Attempt to confirm
    fireEvent.click(screen.getByText('Confirm & Sign Off'));

    expect(screen.getByText('Please draw the customer signature inside the signature box.')).toBeTruthy();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('validates that the legal confirmation checkbox is acknowledged', () => {
    render(<SignaturePadModal {...defaultProps} />);

    // Provide name
    fireEvent.change(screen.getByPlaceholderText('e.g. Marcus Vance'), {
      target: { value: 'Alice Smith' },
    });

    // Draw on canvas
    const canvas = document.querySelector('canvas')!;
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 20, clientY: 20 });

    // Do NOT check checkbox
    fireEvent.click(screen.getByText('Confirm & Sign Off'));

    expect(screen.getByText('Please review and check the sign-off acknowledgment statement.')).toBeTruthy();
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it('successfully captures signature and passes data to onConfirm handler', () => {
    const handleConfirm = vi.fn();
    render(<SignaturePadModal {...defaultProps} onConfirm={handleConfirm} />);

    // Enter name
    fireEvent.change(screen.getByPlaceholderText('e.g. Marcus Vance'), {
      target: { value: 'Robert Vance' },
    });

    // Draw on canvas
    const canvas = document.querySelector('canvas')!;
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });
    fireEvent.pointerMove(canvas, { pointerId: 1, clientX: 30, clientY: 40 });
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 30, clientY: 40 });

    // Check legal declaration
    fireEvent.click(screen.getByRole('checkbox'));

    // Submit
    fireEvent.click(screen.getByText('Confirm & Sign Off'));

    expect(handleConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        signerName: 'Robert Vance',
        signerTitle: 'Facility Manager',
        signatureData: 'data:image/png;base64,mockPngSignatureData',
      })
    );
  });

  it('clears drawing state when Clear button is clicked', () => {
    render(<SignaturePadModal {...defaultProps} />);

    // Enter name and checkbox
    fireEvent.change(screen.getByPlaceholderText('e.g. Marcus Vance'), {
      target: { value: 'Robert Vance' },
    });
    fireEvent.click(screen.getByRole('checkbox'));

    // Draw on canvas
    const canvas = document.querySelector('canvas')!;
    fireEvent.pointerDown(canvas, { pointerId: 1, clientX: 10, clientY: 10 });

    // Click clear
    fireEvent.click(screen.getByText('Clear'));

    // Should fail drawing validation because drawing was cleared
    fireEvent.click(screen.getByText('Confirm & Sign Off'));
    expect(screen.getByText('Please draw the customer signature inside the signature box.')).toBeTruthy();
  });
});

describe('Phase 5 Frontend — Public Certificate Verification Portal (SEC-006 / FR-047)', () => {
  const mockValidCertificate = {
    certificateNumber: 'CERT-2026-998877',
    status: 'VALID' as const,
    maskedSiteName: 'Al*** Lo*** Wa***',
    providerBusinessName: 'Apex Fire Protection Services Ltd',
    issuedDate: '2026-11-03',
    expirationDate: '2027-11-03',
    equipmentCount: 15,
    complianceVerdict: 'COMPLIANT' as const,
    verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    isSealValid: true,
  };

  it('renders search input when accessed at root /verify', () => {
    render(
      <MemoryRouter initialEntries={['/verify']}>
        <Routes>
          <Route path="/verify" element={<CertificateVerificationPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Verify Fire Safety Certificate')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. CERT-2026-F00189')).toBeTruthy();
    expect(screen.getByText('Verify')).toBeTruthy();
  });

  it('fetches and displays certificate verification details for valid certificate in URL param', async () => {
    (certificatesApi.verifyCertificate as any).mockResolvedValueOnce(mockValidCertificate);

    render(
      <MemoryRouter initialEntries={['/verify/CERT-2026-998877']}>
        <Routes>
          <Route path="/verify/:certificateNumber" element={<CertificateVerificationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(certificatesApi.verifyCertificate).toHaveBeenCalledWith('CERT-2026-998877');
    });

    expect(await screen.findByText('CERT-2026-998877')).toBeTruthy();
    expect(screen.getByText('Al*** Lo*** Wa***')).toBeTruthy();
    expect(screen.getByText('Apex Fire Protection Services Ltd')).toBeTruthy();
    expect(screen.getByText('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')).toBeTruthy();
    expect(screen.getByText('CANONICAL SHA-256 RECORD HASH SEAL (SEC-007)')).toBeTruthy();
    expect(screen.getByText('View PDF Certificate')).toBeTruthy();
  });

  it('displays invalid/not found error when certificate lookup fails', async () => {
    (certificatesApi.verifyCertificate as any).mockRejectedValueOnce(
      new Error('Certificate CERT-2026-00000 not found or invalid')
    );

    render(
      <MemoryRouter initialEntries={['/verify/CERT-2026-00000']}>
        <Routes>
          <Route path="/verify/:certificateNumber" element={<CertificateVerificationPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(certificatesApi.verifyCertificate).toHaveBeenCalledWith('CERT-2026-00000');
    });

    expect(await screen.findByText('Certificate Not Verified')).toBeTruthy();
    expect(screen.getByText('Certificate CERT-2026-00000 not found or invalid')).toBeTruthy();
  });
});
