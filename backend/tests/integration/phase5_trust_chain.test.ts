import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/db/prisma';
import { signToken } from '../../src/utils/jwt';
import { computeSha256 } from '../../src/utils/hash';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';

describe('Phase 5: Digital Trust Chain, Attachments & PDF Certificates API', () => {
  const providerUserId = '550e8400-e29b-41d4-a716-446655440001';
  const customerUserId = '550e8400-e29b-41d4-a716-446655440002';

  const providerToken = signToken({
    userId: providerUserId,
    email: 'tech@servora.com',
    role: UserRole.SERVICE_PROVIDER,
    tokenVersion: 1
  });

  const customerToken = signToken({
    userId: customerUserId,
    email: 'client@acme.com',
    role: UserRole.CUSTOMER,
    tokenVersion: 1
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Binary Evidence Upload API (POST /api/v1/attachments)', () => {
    it('rejects unauthenticated file upload attempts with 401', async () => {
      const res = await request(app)
        .post('/api/v1/attachments')
        .attach('file', Buffer.from('fake image content'), 'test.jpg');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects forbidden file types (e.g., text/plain) with 400', async () => {
      const res = await request(app)
        .post('/api/v1/attachments')
        .set('Authorization', `Bearer ${providerToken}`)
        .attach('file', Buffer.from('console.log("malicious")'), {
          filename: 'script.js',
          contentType: 'application/javascript'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Invalid file format/i);
    });

    it('successfully uploads valid image binary and computes SHA-256 digest (SEC-005)', async () => {
      const dummyJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
      const expectedSha256 = crypto.createHash('sha256').update(dummyJpeg).digest('hex');

      const res = await request(app)
        .post('/api/v1/attachments')
        .set('Authorization', `Bearer ${providerToken}`)
        .attach('file', dummyJpeg, {
          filename: 'extinguisher_gauge.jpg',
          contentType: 'image/jpeg'
        })
        .field('fileType', 'PRESSURE_GAUGE');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.fileHash).toBe(expectedSha256);
      expect(res.body.data.fileSizeBytes).toBe(dummyJpeg.length);
      expect(res.body.data.fileUri).toMatch(/^\/uploads\/att-/);
    });
  });

  describe('Public Certificate Verification API (GET /api/v1/certificates/verify/:certificateNumber)', () => {
    it('returns 404 for unknown or unregistered certificate numbers', async () => {
      vi.spyOn(prisma.certificate, 'findUnique').mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/v1/certificates/verify/CERT-INVALID-999');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not registered/i);
    });

    it('returns privacy-sanitized certificate authenticity without exposing customer PII (SEC-006)', async () => {
      const mockCert: any = {
        id: 'cert-uuid-1',
        certificateNumber: 'CERT-2026-F00189',
        status: 'VALID',
        issuedDate: new Date('2026-11-03'),
        expirationDate: new Date('2027-11-03'),
        verificationHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        site: {
          siteName: 'Industrial Facility - Sector 18',
          address: 'Private Street 123',
          customer: {
            contactPersonPhone: '+1-555-PRIVATE-PHONE',
            billingEmail: 'private-billing@client.com'
          }
        },
        provider: {
          businessName: 'SafeGuard Fire Protection Pvt Ltd',
          licenseNumber: 'TX-FP-98214'
        },
        visitRecord: {
          checklistResponses: [
            { passedInspection: true },
            { passedInspection: true }
          ]
        }
      };

      vi.spyOn(prisma.certificate, 'findUnique').mockResolvedValueOnce(mockCert);

      const res = await request(app)
        .get('/api/v1/certificates/verify/CERT-2026-F00189');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.certificateNumber).toBe('CERT-2026-F00189');
      expect(res.body.data.status).toBe('VALID');
      expect(res.body.data.maskedSiteName).toMatch(/\*\*\*/); // Masked PII
      expect(res.body.data.providerBusinessName).toBe('SafeGuard Fire Protection Pvt Ltd');
      expect(res.body.data.isSealValid).toBe(true);

      // Verify ZERO sensitive customer PII is returned
      const rawText = JSON.stringify(res.body);
      expect(rawText).not.toContain('+1-555-PRIVATE-PHONE');
      expect(rawText).not.toContain('private-billing@client.com');
    });
  });

  describe('Cryptographic Record Sealing with Customer Signature & Evidence (SEC-007)', () => {
    it('produces different canonical hashes when customer signature or evidence changes', () => {
      const basePayload = {
        visitScheduleId: 'visit-1',
        technicianId: 'tech-1',
        checkInTimestamp: '2026-11-03T10:00:00.000Z',
        checkInLatitude: 29.75,
        checkInLongitude: -95.36,
        isGeofenceVerified: true,
        checklistResponses: [{ equipmentId: 'eq-1', passedInspection: true }]
      };

      const hashWithoutSig = computeSha256(basePayload);

      const hashWithSig = computeSha256({
        ...basePayload,
        customerSignerName: 'John Doe',
        customerSignatureHash: computeSha256('data:image/png;base64,sampleSignature')
      });

      const hashWithModifiedSig = computeSha256({
        ...basePayload,
        customerSignerName: 'John Doe',
        customerSignatureHash: computeSha256('data:image/png;base64,tamperedSignature')
      });

      expect(hashWithoutSig).not.toBe(hashWithSig);
      expect(hashWithSig).not.toBe(hashWithModifiedSig);
    });

    it('verifies that any tampering with sealed record data causes integrity verification failure', () => {
      // 1. Original sealed record
      const originalRecord = {
        visitScheduleId: 'visit-audit-101',
        technicianId: 'tech-audit-1',
        checkInLatitude: 29.7523,
        checkInLongitude: -95.3611,
        isGeofenceVerified: true,
        checklistResponses: [
          { equipmentId: 'eq-ext-101', pressureReadingBar: 14.5, passedInspection: true }
        ],
        customerSignerName: 'Sarah Connor',
        customerSignatureHash: computeSha256('signature_base64_stream')
      };

      const originalHash = computeSha256(originalRecord);

      // Verify original seal matches
      const isOriginalValid = computeSha256(originalRecord) === originalHash;
      expect(isOriginalValid).toBe(true);

      // 2. Tampered record: Pressure altered or passedInspection flipped
      const tamperedRecord = {
        ...originalRecord,
        checklistResponses: [
          { equipmentId: 'eq-ext-101', pressureReadingBar: 4.0, passedInspection: false } // modified
        ]
      };

      const isTamperedValid = computeSha256(tamperedRecord) === originalHash;
      expect(isTamperedValid).toBe(false); // Integrity validation successfully detects tampering!
    });
  });
});
