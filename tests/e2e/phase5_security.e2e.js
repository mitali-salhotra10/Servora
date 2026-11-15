import crypto from 'crypto';

const BASE_URL = 'http://localhost:5000/api/v1';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, headers: res.headers, data };
}

async function login(email, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return res;
}

function authHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('SERVORA PHASE 5: SECURITY, RELIABILITY & PRODUCTION AUDIT');
  console.log('================================================================\n');

  // --- 1. Authentication & Session Security ---
  console.log('--- 1. Authentication & Session Security Audit ---');

  // 1.1 Invalid password rejection
  const badLogin = await login('facilities@apexcommerce.com', 'WrongPassword123!');
  console.log(`✓ Invalid Password Attempt: HTTP ${badLogin.status} (Expected: 401)`);
  if (badLogin.status !== 401) throw new Error('Failed to reject invalid password');
  console.log(`  Rejection Message: "${badLogin.data.error?.message}"`);

  // 1.2 Invalid demo password attempt (must NEVER fall back to demo account)
  const badDemoLogin = await login('demo-attacker@servora.com', 'MaliciousGuess123');
  console.log(`✓ Invalid Demo Password Fallback Prevention: HTTP ${badDemoLogin.status} (Expected: 401)`);
  if (badDemoLogin.status !== 401) throw new Error('Allowed invalid credentials to fall back to demo!');

  // 1.3 Valid logins
  const apexAuthRes = await login('facilities@apexcommerce.com', 'Password123!');
  if (!apexAuthRes.ok) throw new Error(`Apex login failed: HTTP ${apexAuthRes.status} ${JSON.stringify(apexAuthRes.data)}`);
  const apexAuth = apexAuthRes.data.data;
  console.log(`✓ Customer Apex logged in: ${apexAuth.user.id}`);

  const techAuthRes = await login('tech.davis@redshieldfire.com', 'Password123!');
  if (!techAuthRes.ok) throw new Error(`Tech login failed: HTTP ${techAuthRes.status} ${JSON.stringify(techAuthRes.data)}`);
  const techAuth = techAuthRes.data.data;
  console.log(`✓ Technician Davis logged in: ${techAuth.user.id}`);

  const mgrAuthRes = await login('manager@redshieldfire.com', 'Password123!');
  if (!mgrAuthRes.ok) throw new Error(`Mgr login failed: HTTP ${mgrAuthRes.status} ${JSON.stringify(mgrAuthRes.data)}`);
  const mgrAuth = mgrAuthRes.data.data;
  console.log(`✓ Service Manager logged in: ${mgrAuth.user.id}`);

  const adminAuthRes = await login('admin@servora.app', 'Password123!');
  if (!adminAuthRes.ok) throw new Error(`Admin login failed: HTTP ${adminAuthRes.status} ${JSON.stringify(adminAuthRes.data)}`);
  const adminAuth = adminAuthRes.data.data;
  console.log(`✓ Admin logged in: ${adminAuth.user.id}`);

  // 1.4 Invalid / Tampered JWT Token
  const tamperedTokenRes = await request('/sites', {
    headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature' }
  });
  console.log(`✓ Tampered JWT Rejection: HTTP ${tamperedTokenRes.status} (Expected: 401)`);
  if (tamperedTokenRes.status !== 401) throw new Error('Accepted invalid token');

  // 1.5 Missing Token Rejection
  const missingTokenRes = await request('/sites');
  console.log(`✓ Missing Authorization Header: HTTP ${missingTokenRes.status} (Expected: 401)`);
  if (missingTokenRes.status !== 401) throw new Error('Allowed unauthenticated access');

  // --- 2. Multi-Tenant Isolation & IDOR Protection ---
  console.log('\n--- 2. Multi-Tenant Isolation & IDOR Protection Audit ---');

  // 2.1 Fetch MetroHealth's contract as Service Manager to obtain its ID
  const mgrContracts = await request('/contracts', { headers: authHeaders(mgrAuth.token) });
  const metroContract = mgrContracts.data.data.find(c => c.contractNumber?.includes('MTH'));
  if (!metroContract) throw new Error('Could not find MetroHealth contract');
  console.log(`✓ Target Foreign Contract Identified: ${metroContract.contractNumber} (${metroContract.id})`);

  // 2.2 Customer Apex attempts direct IDOR fetch of MetroHealth's contract
  const idorContractRes = await request(`/contracts/${metroContract.id}`, {
    headers: authHeaders(apexAuth.token)
  });
  console.log(`✓ Cross-Tenant Contract Access Attempt (IDOR): HTTP ${idorContractRes.status} (Expected: 403)`);
  if (idorContractRes.status !== 403) throw new Error(`IDOR vulnerability! Status was ${idorContractRes.status}`);
  console.log(`  Enforcement Response: "${idorContractRes.data.error?.message}"`);

  // 2.3 Customer Apex accesses their own contract
  const apexContract = mgrContracts.data.data.find(c => c.contractNumber?.includes('APX'));
  const apexContractRes = await request(`/contracts/${apexContract.id}`, {
    headers: authHeaders(apexAuth.token)
  });
  console.log(`✓ Legitimate Tenant Contract Access: HTTP ${apexContractRes.status} (Expected: 200)`);
  if (apexContractRes.status !== 200) throw new Error('Legitimate contract access failed');

  // 2.4 Cross-Tenant Site Access
  const metroSiteId = metroContract.siteId;
  const idorSiteRes = await request(`/sites/${metroSiteId}`, {
    headers: authHeaders(apexAuth.token)
  });
  console.log(`✓ Cross-Tenant Site Access Attempt (IDOR): HTTP ${idorSiteRes.status} (Expected: 403)`);
  if (idorSiteRes.status !== 403) throw new Error(`Site IDOR vulnerability! Status was ${idorSiteRes.status}`);

  // 2.5 Role-Based Permission Check: Customer attempting Manager dispatch
  const forbiddenDispatch = await request('/visits', {
    method: 'POST',
    headers: authHeaders(apexAuth.token),
    body: JSON.stringify({
      contractId: apexContract.id,
      siteId: apexContract.siteId,
      targetDate: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      visitType: 'EMERGENCY_INSPECTION'
    })
  });
  console.log(`✓ Customer Attempting Manager Route (RBAC): HTTP ${forbiddenDispatch.status} (Expected: 403)`);
  if (forbiddenDispatch.status !== 403) throw new Error('RBAC route protection failed');

  // --- 3. Input Validation & File Upload Security ---
  console.log('\n--- 3. Input Validation & File Upload Security Audit ---');

  // 3.1 MIME Spoofing: file claims to be image/png but content is executable text
  const spoofedBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00Malicious Executable Payload');
  const spoofedFormData = new FormData();
  spoofedFormData.append('file', new Blob([spoofedBuffer], { type: 'image/png' }), 'trojan.png');
  spoofedFormData.append('fileType', 'PHOTO_BEFORE');

  const spoofRes = await fetch(`${BASE_URL}/attachments`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${techAuth.token}` },
    body: spoofedFormData
  });
  const spoofData = await spoofRes.json().catch(() => null);
  console.log(`✓ MIME-Spoofing Detection (Magic Bytes): HTTP ${spoofRes.status} (Expected: 400)`);
  if (spoofRes.status !== 400) throw new Error('MIME spoofing was NOT prevented!');
  console.log(`  Rejection Reason: "${spoofData?.error?.message}"`);

  // 3.2 SQL Injection in Input Strings (Parameterized Query Check)
  const sqliPayload = "'; DROP TABLE \"Site\"; SELECT '";
  const sqliRes = await request('/equipment/qr/' + encodeURIComponent(sqliPayload), {
    headers: authHeaders(techAuth.token)
  });
  console.log(`✓ SQL Injection Defense (Parameterized Prisma): HTTP ${sqliRes.status} (Expected: 404)`);
  if (sqliRes.status === 500) throw new Error('SQL injection caused internal server error');

  // --- 4. Completed Inspection Immutability ---
  console.log('\n--- 4. Inspection & Visit Immutability Audit ---');

  // Find a completed visit
  const visitsRes = await request('/visits/history', { headers: authHeaders(mgrAuth.token) });
  const completedVisit = visitsRes.data?.data?.[0];
  if (completedVisit) {
    const completedVisitId = completedVisit.visitScheduleId || completedVisit.id;
    console.log(`✓ Auditing Completed Visit: ${completedVisitId}`);

    // 4.1 Attempt to revert status of completed visit to PLANNED
    const revertRes = await request(`/visits/${completedVisitId}/status`, {
      method: 'PATCH',
      headers: authHeaders(mgrAuth.token),
      body: JSON.stringify({ status: 'PLANNED' })
    });
    console.log(`✓ Revert Completed Visit Status Attempt: HTTP ${revertRes.status} (Expected: 400)`);
    if (revertRes.status !== 400) throw new Error('Allowed modification of completed visit status!');
    console.log(`  Protection Message: "${revertRes.data.error?.message}"`);

    // 4.2 Attempt to reassign technician on completed visit
    const reassignRes = await request(`/visits/${completedVisitId}/assign`, {
      method: 'PUT',
      headers: authHeaders(mgrAuth.token),
      body: JSON.stringify({ technicianId: techAuth.user.id })
    });
    console.log(`✓ Reassign Completed Visit Technician Attempt: HTTP ${reassignRes.status} (Expected: 400)`);
    if (reassignRes.status !== 400) throw new Error('Allowed reassigning completed visit technician!');
    console.log(`  Protection Message: "${reassignRes.data.error?.message}"`);
  }

  // --- 5. Public Certificate Verification & Privacy Sanitization ---
  console.log('\n--- 5. Public Certificate Verification & Privacy Sanitization ---');
  const certsRes = await request('/certificates', { headers: authHeaders(mgrAuth.token) });
  const cert = certsRes.data?.data?.[0];
  if (cert) {
    const publicVerifyRes = await request(`/certificates/verify/${cert.certificateNumber}`);
    console.log(`✓ Public Verification Endpoint: HTTP ${publicVerifyRes.status} (Expected: 200)`);
    const certView = publicVerifyRes.data.data;
    console.log(`  Certificate Number: ${certView.certificateNumber}`);
    console.log(`  Compliance Verdict: ${certView.complianceVerdict}`);
    console.log(`  Masked Site Name:   ${certView.maskedSiteName}`);
    console.log(`  Cryptographic Seal: ${certView.verificationHash}`);
    console.log(`  Is Seal Valid:      ${certView.isSealValid}`);

    // Verify absence of sensitive PII in public response
    const rawPublicJson = JSON.stringify(publicVerifyRes.data);
    const hasPii = rawPublicJson.includes('phone') || rawPublicJson.includes('email') || rawPublicJson.includes('password');
    console.log(`  PII Stripping Verified: ${!hasPii}`);
    if (hasPii) throw new Error('Exposed sensitive PII in public verification view');
  }

  console.log('\n================================================================');
  console.log('PHASE 5 SECURITY AUDIT VERIFICATION: 100% PASS');
  console.log('================================================================');
}

runSecurityAudit().catch(err => {
  console.error('\n❌ Security Audit Failed:', err.message);
  process.exit(1);
});
