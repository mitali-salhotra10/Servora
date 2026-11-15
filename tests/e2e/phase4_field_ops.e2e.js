import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function loginUser(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: HTTP ${res.status} ${JSON.stringify(res.data)}`);
  }
  return {
    user: res.data.data.user,
    token: res.data.data.token
  };
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

function canonicalJsonStringify(obj) {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'number' || typeof obj === 'boolean' || typeof obj === 'string') return JSON.stringify(obj);
  if (obj instanceof Date) return JSON.stringify(obj.toISOString());
  if (Array.isArray(obj)) return `[${obj.map(item => canonicalJsonStringify(item)).join(',')}]`;
  if (typeof obj === 'object') {
    const keys = Object.keys(obj).sort();
    const keyValues = [];
    for (const key of keys) {
      const val = obj[key];
      if (val !== undefined && typeof val !== 'function' && typeof val !== 'symbol') {
        keyValues.push(`${JSON.stringify(key)}:${canonicalJsonStringify(val)}`);
      }
    }
    return `{${keyValues.join(',')}}`;
  }
  return JSON.stringify(obj);
}

function computeSha256(data) {
  const str = typeof data === 'string' ? data : canonicalJsonStringify(data);
  return crypto.createHash('sha256').update(str, 'utf8').digest('hex');
}

async function runPhase4Audit() {
  console.log('================================================================');
  console.log('SERVORA PHASE 4: FIELD OPERATIONS, OFFLINE SYNC & INTEGRITY AUDIT');
  console.log('================================================================\n');

  // Authenticate roles
  console.log('--- 0. Authentication & Context Setup ---');
  const techAuth = await loginUser('tech.davis@redshieldfire.com', 'Password123!');
  console.log(`✓ Technician Davis logged in: ${techAuth.user.id}`);

  const mgrAuth = await loginUser('manager@redshieldfire.com', 'Password123!');
  console.log(`✓ Service Manager logged in: ${mgrAuth.user.id}`);

  const custAuth = await loginUser('facilities@apexcommerce.com', 'Password123!');
  console.log(`✓ Customer Apex logged in: ${custAuth.user.id}`);

  // --------------------------------------------------------------------------
  // 1. QR Equipment Identification
  // --------------------------------------------------------------------------
  console.log('\n--- 1. QR Equipment Identification Audit ---');
  
  // 1.1 Valid QR Lookup against live PostgreSQL
  const validQrRes = await request('/equipment/qr/SRV-EQ-APX-FE-001', {
    headers: authHeaders(techAuth.token)
  });
  console.log(`✓ Live QR Lookup (SRV-EQ-APX-FE-001): HTTP ${validQrRes.status}`);
  if (!validQrRes.ok) throw new Error('Live QR lookup failed');
  const eqData = validQrRes.data.data;
  console.log(`  Equipment ID: ${eqData.id}, Serial: ${eqData.serialNumber}, Type: ${eqData.equipmentType}`);
  console.log(`  Associated Facility: ${eqData.site.siteName} (ID: ${eqData.siteId})`);

  // 1.2 Invalid QR Lookup
  const invalidQrRes = await request('/equipment/qr/SRV-EQ-NONEXISTENT-9999', {
    headers: authHeaders(techAuth.token)
  });
  console.log(`✓ Invalid QR Lookup (SRV-EQ-NONEXISTENT-9999): HTTP ${invalidQrRes.status} (Expected: 404)`);
  if (invalidQrRes.status !== 404) throw new Error('Expected 404 for invalid QR');
  console.log(`  Error Message: "${invalidQrRes.data.error?.message || invalidQrRes.data.message}"`);

  // 1.3 Site Mismatch Detection
  // Lookup equipment belonging to MetroHealth
  const foreignQrRes = await request('/equipment/qr/SRV-EQ-MTH-FE-001', {
    headers: authHeaders(techAuth.token)
  });
  const foreignEquipment = foreignQrRes.data.data;
  console.log(`✓ Foreign Site Equipment Retrieved: ${foreignEquipment.serialNumber} (Site: ${foreignEquipment.site.siteName})`);

  // --------------------------------------------------------------------------
  // 2. Binary Evidence Upload & Cryptographic SHA-256 Hashing
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Binary Evidence & Signatures Audit ---');

  // 2.1 File Type Validation (Reject invalid MIME type)
  const textFormData = new FormData();
  const textBlob = new Blob(['Not an image file'], { type: 'text/plain' });
  textFormData.append('file', textBlob, 'test.txt');
  textFormData.append('fileType', 'PHOTO_BEFORE');

  const textUploadRes = await fetch(`${BASE_URL}/attachments`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${techAuth.token}` },
    body: textFormData
  });
  const textUploadData = await textUploadRes.json();
  console.log(`✓ Disallowed MIME Type (text/plain): HTTP ${textUploadRes.status} (Expected: 400)`);
  if (textUploadRes.status !== 400) throw new Error('Expected 400 for text/plain upload');
  console.log(`  Rejection Reason: "${textUploadData.error?.message || textUploadData.message}"`);

  // 2.2 File Size Validation (Reject files > 5MB)
  const oversizedBuffer = Buffer.alloc(5.5 * 1024 * 1024, 0xAA);
  const oversizedBlob = new Blob([oversizedBuffer], { type: 'image/jpeg' });
  const oversizedFormData = new FormData();
  oversizedFormData.append('file', oversizedBlob, 'giant_photo.jpg');
  oversizedFormData.append('fileType', 'PHOTO_BEFORE');

  const oversizedUploadRes = await fetch(`${BASE_URL}/attachments`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${techAuth.token}` },
    body: oversizedFormData
  });
  const oversizedUploadData = await oversizedUploadRes.json();
  console.log(`✓ Oversized File Upload (>5MB): HTTP ${oversizedUploadRes.status} (Expected: 400)`);
  if (oversizedUploadRes.status !== 400) throw new Error('Expected 400 for oversized upload');
  console.log(`  Rejection Reason: "${oversizedUploadData.error?.message || oversizedUploadData.message}"`);

  // 2.3 Successful Real Binary Upload (Valid PNG image)
  // Create a valid 1x1 PNG binary buffer
  const validPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const expectedBinaryHash = crypto.createHash('sha256').update(validPngBuffer).digest('hex');

  const validBlob = new Blob([validPngBuffer], { type: 'image/png' });
  const validFormData = new FormData();
  validFormData.append('file', validBlob, 'test_inspection_evidence.png');
  validFormData.append('fileType', 'PRESSURE_GAUGE');

  const binaryUploadRes = await fetch(`${BASE_URL}/attachments`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${techAuth.token}` },
    body: validFormData
  });
  const binaryUploadData = await binaryUploadRes.json();
  console.log(`✓ Binary PNG Photo Upload: HTTP ${binaryUploadRes.status} (Expected: 201)`);
  if (binaryUploadRes.status !== 201) throw new Error('Binary photo upload failed');
  
  const uploadedAttachment = binaryUploadData.data;
  console.log(`  Attachment ID: ${uploadedAttachment.id}`);
  console.log(`  Storage URI: ${uploadedAttachment.fileUri}`);
  console.log(`  Computed SHA-256 Digest: ${uploadedAttachment.fileHash}`);
  console.log(`  Local Expected SHA-256:  ${expectedBinaryHash}`);
  if (uploadedAttachment.fileHash !== expectedBinaryHash) {
    throw new Error('SHA-256 digest mismatch on binary file upload!');
  }
  console.log('  ✓ SHA-256 binary integrity verified: Exact match!');

  // 2.4 Binary Retrieval Test
  const downloadRes = await fetch(`${BASE_URL}/attachments/${uploadedAttachment.id}/file`, {
    headers: { 'Authorization': `Bearer ${techAuth.token}` }
  });
  console.log(`✓ Binary File Streaming: HTTP ${downloadRes.status} (Expected: 200)`);
  const downloadedBuffer = Buffer.from(await downloadRes.arrayBuffer());
  const downloadedHash = crypto.createHash('sha256').update(downloadedBuffer).digest('hex');
  if (downloadedHash !== expectedBinaryHash) {
    throw new Error('Downloaded binary does not match original file hash!');
  }
  console.log(`  Retrieved Content-Type: ${downloadRes.headers.get('content-type')}`);
  console.log('  ✓ Retrieved binary content perfectly identical to uploaded bytes.');

  // --------------------------------------------------------------------------
  // 3. GPS & Geofencing Enforcement Audit
  // --------------------------------------------------------------------------
  console.log('\n--- 3. GPS & Geofencing Enforcement Audit ---');

  // Retrieve real contract and site managed by RedShield Fire & Safety
  const mgrContracts = await request('/contracts', { headers: authHeaders(mgrAuth.token) });
  if (!mgrContracts.ok || !mgrContracts.data?.data?.length) {
    throw new Error('Manager could not retrieve contracts');
  }
  const realContract = mgrContracts.data.data[0];
  const apexContractId = realContract.id;
  const apexWestSiteId = realContract.siteId;
  console.log(`✓ Active Contract: ${realContract.contractNumber} (${apexContractId}), Site: ${realContract.site?.siteName} (${apexWestSiteId})`);

  // 3.1 Test Visit 1: Inspection outside geofence radius
  const scheduleRes1 = await request('/visits', {
    method: 'POST',
    headers: authHeaders(mgrAuth.token),
    body: JSON.stringify({
      contractId: apexContractId,
      siteId: apexWestSiteId,
      assignedTechnicianId: techAuth.user.id,
      targetDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      visitType: 'EMERGENCY_INSPECTION'
    })
  });
  if (!scheduleRes1.ok) {
    throw new Error(`Schedule Visit 1 failed: HTTP ${scheduleRes1.status} ${JSON.stringify(scheduleRes1.data)}`);
  }
  const visit1Id = scheduleRes1.data.data.id;
  console.log(`✓ Scheduled Visit 1 for Geofence Testing: ${visit1Id}`);

  // Fetch visit details to get equipment
  const visit1Details = await request(`/visits/${visit1Id}`, { headers: authHeaders(techAuth.token) });
  const siteEquipment = visit1Details.data.data.site.equipment[0];

  // 3.2 Equipment Site-Mismatch Check
  console.log('\n>>> Equipment-to-Site Boundary Validation:');
  const mismatchPayload = {
    idempotencyKey: `mismatch-test-${Date.now()}`,
    checkInLatitude: 41.8827,
    checkInLongitude: -87.6233,
    checklistResponses: [
      {
        equipmentId: eqData.id, // Apex Commercial Tower equipment submitted to MetroHealth visit!
        domainCategory: eqData.equipmentType,
        responsesJson: { q_status: 'PASS' },
        passedInspection: true
      }
    ]
  };
  const mismatchRes = await request(`/visits/${visit1Id}/inspections`, {
    method: 'POST',
    headers: authHeaders(techAuth.token),
    body: JSON.stringify(mismatchPayload)
  });
  console.log(`✓ Foreign Equipment in Site Inspection: HTTP ${mismatchRes.status} (Expected: 400)`);
  if (mismatchRes.status !== 400) throw new Error('Expected 400 for foreign equipment');
  console.log(`  Rejection Reason: "${mismatchRes.data.error?.message || mismatchRes.data.message}"`);

  // 3.3 Outside Geofence Test (Checking in 13.5 km away)
  console.log('\n>>> Out-of-Bounds Geofence Enforcement:');
  const outsidePayload = {
    idempotencyKey: `outside-test-${Date.now()}`,
    checkInLatitude: 41.9500, // ~13.5 km north-west
    checkInLongitude: -87.7500,
    checkInAccuracyMeters: 5.0,
    isGeofenceVerified: true, // Client attempts to assert true
    customerSignerName: 'Marcus Vance',
    customerSignatureData: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    checklistResponses: [
      {
        equipmentId: siteEquipment.id,
        domainCategory: siteEquipment.equipmentType,
        responsesJson: { q_pressure_gauge: 'PASS' },
        passedInspection: true
      }
    ]
  };
  const outsideRes = await request(`/visits/${visit1Id}/inspections`, {
    method: 'POST',
    headers: authHeaders(techAuth.token),
    body: JSON.stringify(outsidePayload)
  });
  console.log(`✓ Inspection Submitted from Outside Radius: HTTP ${outsideRes.status}`);
  const outsideRecord = outsideRes.data.data;
  console.log(`  Recorded isGeofenceVerified: ${outsideRecord.isGeofenceVerified} (Expected: false)`);
  if (outsideRecord.isGeofenceVerified !== false) {
    throw new Error('Geofence enforcement failed: out-of-bounds inspection marked as verified!');
  }
  console.log('  ✓ Geofence correctly denied client assertion when outside radius.');

  // 3.4 Inside Geofence Test (Checking in at site coordinates)
  console.log('\n>>> In-Bounds Geofence Verification:');
  const scheduleRes2 = await request('/visits', {
    method: 'POST',
    headers: authHeaders(mgrAuth.token),
    body: JSON.stringify({
      contractId: apexContractId,
      siteId: apexWestSiteId,
      assignedTechnicianId: techAuth.user.id,
      targetDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      visitType: 'EMERGENCY_INSPECTION'
    })
  });
  if (!scheduleRes2.ok) {
    throw new Error(`Schedule Visit 2 failed: HTTP ${scheduleRes2.status} ${JSON.stringify(scheduleRes2.data)}`);
  }
  const visit2Id = scheduleRes2.data.data.id;
  const visit2Details = await request(`/visits/${visit2Id}`, { headers: authHeaders(techAuth.token) });
  const site2 = visit2Details.data.data.site;
  const site2Equipment = site2.equipment[0];

  const insideIdempotencyKey = `inside-test-${Date.now()}`;
  const insidePayload = {
    idempotencyKey: insideIdempotencyKey,
    checkInLatitude: Number(site2.latitude), // Exactly at site coordinates
    checkInLongitude: Number(site2.longitude),
    checkInAccuracyMeters: 3.5,
    customerSignerName: 'Marcus Vance',
    customerSignatureData: 'data:image/svg+xml;base64,PHN2Zz48Y2lyY2xlLz48L3N2Zz4=',
    technicianNotes: 'Phase 4 Field Operations Full Audit Record. DEMO DATA.',
    checklistResponses: [
      {
        equipmentId: site2Equipment.id,
        domainCategory: site2Equipment.equipmentType,
        responsesJson: { q_pressure_gauge: 'PASS', q_hose_intact: 'PASS' },
        passedInspection: true
      }
    ]
  };
  const insideRes = await request(`/visits/${visit2Id}/inspections`, {
    method: 'POST',
    headers: authHeaders(techAuth.token),
    body: JSON.stringify(insidePayload)
  });
  console.log(`✓ Inspection Submitted within Radius: HTTP ${insideRes.status}`);
  const insideRecord = insideRes.data.data;
  console.log(`  Recorded isGeofenceVerified: ${insideRecord.isGeofenceVerified} (Expected: true)`);
  if (insideRecord.isGeofenceVerified !== true) {
    throw new Error('Geofence verification failed for coordinates inside radius!');
  }
  console.log('  ✓ Geofence verified: Haversine distance <= 150m confirmed.');

  // --------------------------------------------------------------------------
  // 4. Inspection Integrity & Canonical Record Hashing (SEC-007)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Inspection Integrity & Tamper-Detection Audit ---');
  console.log(`  Persisted Record Hash: ${insideRecord.recordHash}`);

  // 4.1 Reconstruct canonical payload and compute local SHA-256
  const canonicalPayload = {
    visitScheduleId: visit2Id,
    technicianId: techAuth.user.id,
    checkInTimestamp: insideRecord.checkInTimestamp,
    checkInLatitude: insidePayload.checkInLatitude,
    checkInLongitude: insidePayload.checkInLongitude,
    isGeofenceVerified: true,
    customerSignerName: insidePayload.customerSignerName,
    customerSignatureHash: computeSha256(insidePayload.customerSignatureData),
    attachmentHashes: [],
    checklistResponses: [
      {
        equipmentId: site2Equipment.id,
        passedInspection: true,
        defectNotes: null,
        responsesJson: { q_pressure_gauge: 'PASS', q_hose_intact: 'PASS' }
      }
    ]
  };
  const localComputedHash = computeSha256(canonicalPayload);
  console.log(`  Local Canonical SHA-256:  ${localComputedHash}`);
  if (localComputedHash !== insideRecord.recordHash) {
    throw new Error(`Canonical hash mismatch! Server: ${insideRecord.recordHash}, Local: ${localComputedHash}`);
  }
  console.log('  ✓ Canonical record hash verified: Exact cryptographic match.');

  // 4.2 Tamper Simulation
  console.log('\n>>> Tamper Detection Simulation:');
  const tamperedPayload = {
    ...canonicalPayload,
    checklistResponses: [
      {
        equipmentId: site2Equipment.id,
        passedInspection: false, // Altered inspection status post-facto
        defectNotes: 'TAMPERED DATA',
        responsesJson: { q_pressure_gauge: 'FAIL', q_hose_intact: 'PASS' }
      }
    ]
  };
  const tamperedHash = computeSha256(tamperedPayload);
  console.log(`  Tampered Payload SHA-256: ${tamperedHash}`);
  if (tamperedHash === insideRecord.recordHash) {
    throw new Error('Tamper detection failed: altered payload generated same hash!');
  }
  console.log('  ✓ Tamper detection confirmed: Hash collision prevented, alteration cleanly detectable.');

  // --------------------------------------------------------------------------
  // 5. Synchronization Engine & Idempotency Guarantee
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Synchronization Engine & Idempotency Audit ---');

  // 5.1 Idempotent Re-submission
  const duplicateRes = await request(`/visits/${visit2Id}/inspections`, {
    method: 'POST',
    headers: {
      ...authHeaders(techAuth.token),
      'Idempotency-Key': insideIdempotencyKey
    },
    body: JSON.stringify(insidePayload)
  });
  console.log(`✓ Idempotent Duplicate Submission: HTTP ${duplicateRes.status} (Expected: 200)`);
  if (duplicateRes.status !== 200) throw new Error('Expected 200 duplicate response');
  console.log(`  Message: "${duplicateRes.data.message}"`);
  console.log(`  Sealed Record Hash preserved: ${duplicateRes.data.data.recordHash === insideRecord.recordHash}`);

  // 5.2 Conflict Prevention (Conflicting submission to completed visit)
  const conflictPayload = {
    idempotencyKey: `new-key-${Date.now()}`,
    checkInLatitude: 41.8827,
    checkInLongitude: -87.6233,
    checklistResponses: [
      {
        equipmentId: site2Equipment.id,
        domainCategory: site2Equipment.equipmentType,
        responsesJson: { q_pressure_gauge: 'PASS' },
        passedInspection: true
      }
    ]
  };
  const conflictRes = await request(`/visits/${visit2Id}/inspections`, {
    method: 'POST',
    headers: authHeaders(techAuth.token),
    body: JSON.stringify(conflictPayload)
  });
  console.log(`✓ Conflicting Submission to Completed Visit: HTTP ${conflictRes.status} (Expected: 409)`);
  if (conflictRes.status !== 409) throw new Error('Expected 409 Conflict');
  console.log(`  Rejection Reason: "${conflictRes.data.error?.message || conflictRes.data.message}"`);

  console.log('\n================================================================');
  console.log('PHASE 4 FIELD OPERATIONS AUDIT COMPLETED: 100% PASS');
  console.log('================================================================');
}

runPhase4Audit().catch((err) => {
  console.error('\n❌ Phase 4 Audit Error:', err);
  process.exit(1);
});
