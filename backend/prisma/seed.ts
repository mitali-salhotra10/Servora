import { PrismaClient, UserRole, ProviderVerificationStatus, DomainCategory, ServiceRequestStatus, ContractFrequency, ContractStatus, EquipmentType, EquipmentStatus, VisitStatus, VisitType, AttachmentType, CertificateStatus, NotificationChannel, NotificationStatus, AuditAction } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn']
});

// Deterministic ID Namespace for Synthetic Data
const ID = {
  // Users
  ADMIN: '00000000-0000-0000-0001-000000000001',
  CUST_APEX_USER: '00000000-0000-0000-0001-000000000002',
  CUST_METRO_USER: '00000000-0000-0000-0001-000000000003',
  CUST_VANGUARD_USER: '00000000-0000-0000-0001-000000000004',
  PROV_REDSHIELD_MGR: '00000000-0000-0000-0001-000000000005',
  PROV_REDSHIELD_TECH_DAVIS: '00000000-0000-0000-0001-000000000006',
  PROV_REDSHIELD_TECH_PATEL: '00000000-0000-0000-0001-000000000007',
  PROV_GUARDIAN_MGR: '00000000-0000-0000-0001-000000000008',
  PROV_GUARDIAN_TECH_MILLER: '00000000-0000-0000-0001-000000000009',

  // Profiles
  CUST_APEX_PROFILE: '00000000-0000-0000-0002-000000000001',
  CUST_METRO_PROFILE: '00000000-0000-0000-0002-000000000002',
  CUST_VANGUARD_PROFILE: '00000000-0000-0000-0002-000000000003',
  PROV_REDSHIELD_PROFILE: '00000000-0000-0000-0002-000000000004',
  PROV_GUARDIAN_PROFILE: '00000000-0000-0000-0002-000000000005',

  // Sites
  SITE_APEX_TOWER: '00000000-0000-0000-0003-000000000001',
  SITE_APEX_PLAZA: '00000000-0000-0000-0003-000000000002',
  SITE_METRO_MAIN: '00000000-0000-0000-0003-000000000003',
  SITE_METRO_OUTPATIENT: '00000000-0000-0000-0003-000000000004',
  SITE_VANGUARD_HUB: '00000000-0000-0000-0003-000000000005',

  // Services
  SVC_EXTINGUISHER_MAINT: '00000000-0000-0000-0004-000000000001',
  SVC_HYDRANT_TESTING: '00000000-0000-0000-0004-000000000002',
  SVC_ALARM_PANEL_AUDIT: '00000000-0000-0000-0004-000000000003',
  SVC_DETECTOR_CALIBRATION: '00000000-0000-0000-0004-000000000004',
  SVC_GENERAL_COMPLIANCE: '00000000-0000-0000-0004-000000000005',

  // Checklist Templates
  TPL_EXTINGUISHER: '00000000-0000-0000-0005-000000000001',
  TPL_HYDRANT: '00000000-0000-0000-0005-000000000002',
  TPL_ALARM: '00000000-0000-0000-0005-000000000003',
  TPL_GENERAL: '00000000-0000-0000-0005-000000000004',

  // Contracts
  CONTRACT_APEX_REDSHIELD: '00000000-0000-0000-0006-000000000001',
  CONTRACT_METRO_REDSHIELD: '00000000-0000-0000-0006-000000000002',
  CONTRACT_VANGUARD_GUARDIAN: '00000000-0000-0000-0006-000000000003',

  // Equipment
  EQ_APEX_EXT_1: '00000000-0000-0000-0007-000000000001',
  EQ_APEX_EXT_2: '00000000-0000-0000-0007-000000000002',
  EQ_APEX_HYD_1: '00000000-0000-0000-0007-000000000003',
  EQ_APEX_ALM_1: '00000000-0000-0000-0007-000000000004',
  EQ_APEX_DET_1: '00000000-0000-0000-0007-000000000005',
  EQ_APEX_EXT_3: '00000000-0000-0000-0007-000000000006',
  EQ_APEX_HYD_2: '00000000-0000-0000-0007-000000000007',
  EQ_METRO_EXT_1: '00000000-0000-0000-0007-000000000008',
  EQ_METRO_EXT_2: '00000000-0000-0000-0007-000000000009',
  EQ_METRO_HYD_1: '00000000-0000-0000-0007-000000000010',
  EQ_METRO_ALM_1: '00000000-0000-0000-0007-000000000011',
  EQ_METRO_DET_1: '00000000-0000-0000-0007-000000000012',
  EQ_METRO_EXT_3: '00000000-0000-0000-0007-000000000013',
  EQ_METRO_ALM_2: '00000000-0000-0000-0007-000000000014',
  EQ_VANGUARD_EXT_1: '00000000-0000-0000-0007-000000000015',
  EQ_VANGUARD_EXT_2: '00000000-0000-0000-0007-000000000016',
  EQ_VANGUARD_HYD_1: '00000000-0000-0000-0007-000000000017',
  EQ_VANGUARD_ALM_1: '00000000-0000-0000-0007-000000000018',

  // Service Requests
  SR_METRO_DETECTOR: '00000000-0000-0000-0008-000000000001',
  SR_VANGUARD_RECHARGE: '00000000-0000-0000-0008-000000000002',
  SR_APEX_AUDIT: '00000000-0000-0000-0008-000000000003',

  // Visit Schedules
  VISIT_APEX_COMPLETED: '00000000-0000-0000-0009-000000000001',
  VISIT_METRO_COMPLETED: '00000000-0000-0000-0009-000000000002',
  VISIT_APEX_IN_PROGRESS: '00000000-0000-0000-0009-000000000003',
  VISIT_APEX_ASSIGNED: '00000000-0000-0000-0009-000000000004',
  VISIT_VANGUARD_OVERDUE: '00000000-0000-0000-0009-000000000005',
  VISIT_METRO_PLANNED: '00000000-0000-0000-0009-000000000006',

  // Visit Records
  REC_APEX_1: '00000000-0000-0000-0010-000000000001',
  REC_METRO_1: '00000000-0000-0000-0010-000000000002',

  // Certificates
  CERT_APEX_TOWER: '00000000-0000-0000-0011-000000000001',
  CERT_METRO_MAIN: '00000000-0000-0000-0011-000000000002',

  // Scores
  SCORE_DAVIS: '00000000-0000-0000-0012-000000000001',
  SCORE_PATEL: '00000000-0000-0000-0012-000000000002',
  SCORE_MILLER: '00000000-0000-0000-0012-000000000003',

  // Notifications
  NOTIF_1: '00000000-0000-0000-0013-000000000001',
  NOTIF_2: '00000000-0000-0000-0013-000000000002',
  NOTIF_3: '00000000-0000-0000-0013-000000000003',

  // Audit Events
  AUDIT_1: '00000000-0000-0000-0014-000000000001',
  AUDIT_2: '00000000-0000-0000-0014-000000000002',
  AUDIT_3: '00000000-0000-0000-0014-000000000003',
  AUDIT_4: '00000000-0000-0000-0014-000000000004'
};

async function main() {
  console.log('[Servora Seed] Starting deterministic synthetic database seeding on Supabase PostgreSQL...');

  // Standard development password hashed with bcrypt (salt 10)
  // Password satisfies: >=8 chars, >=1 number, >=1 special character
  const devPasswordPlain = 'Password123!';
  const defaultPasswordHash = await bcrypt.hash(devPasswordPlain, 10);

  // ----------------------------------------------------
  // 1. Synthetic Users & Profiles
  // ----------------------------------------------------
  console.log('[Servora Seed] 1. Upserting Users & Profiles...');

  // Admin User
  await prisma.user.upsert({
    where: { email: 'admin@servora.app' },
    update: {},
    create: {
      id: ID.ADMIN,
      email: 'admin@servora.app',
      passwordHash: defaultPasswordHash,
      phone: '+1-555-0100',
      role: UserRole.ADMIN,
      isActive: true,
      tokenVersion: 1
    }
  });

  // Customer 1: Apex Commerce Group
  await prisma.user.upsert({
    where: { email: 'facilities@apexcommerce.com' },
    update: {},
    create: {
      id: ID.CUST_APEX_USER,
      email: 'facilities@apexcommerce.com',
      passwordHash: defaultPasswordHash,
      phone: '+1-555-0101',
      role: UserRole.CUSTOMER,
      isActive: true,
      tokenVersion: 1
    }
  });

  await prisma.customerProfile.upsert({
    where: { userId: ID.CUST_APEX_USER },
    update: {},
    create: {
      id: ID.CUST_APEX_PROFILE,
      userId: ID.CUST_APEX_USER,
      companyName: 'Apex Commerce Group (DEMO DATA)',
      contactPersonName: 'Sarah Jenkins',
      taxId: 'US-EIN-94-2849182',
      billingAddress: '100 Main St, Suite 400, Chicago, IL 60601'
    }
  });

  // Customer 2: MetroHealth Medical Center
  await prisma.user.upsert({
    where: { email: 'compliance@metrohealth.org' },
    update: {},
    create: {
      id: ID.CUST_METRO_USER,
      email: 'compliance@metrohealth.org',
      passwordHash: defaultPasswordHash,
      phone: '+1-555-0102',
      role: UserRole.CUSTOMER,
      isActive: true,
      tokenVersion: 1
    }
  });

  await prisma.customerProfile.upsert({
    where: { userId: ID.CUST_METRO_USER },
    update: {},
    create: {
      id: ID.CUST_METRO_PROFILE,
      userId: ID.CUST_METRO_USER,
      companyName: 'MetroHealth Medical Center (DEMO DATA)',
      contactPersonName: 'Dr. Robert Chen',
      taxId: 'US-EIN-36-8192039',
      billingAddress: '2500 Medical Center Dr, Evanston, IL 60201'
    }
  });

  // Customer 3: Vanguard Logistics Hub
  await prisma.user.upsert({
    where: { email: 'ops@vanguardlogistics.com' },
    update: {},
    create: {
      id: ID.CUST_VANGUARD_USER,
      email: 'ops@vanguardlogistics.com',
      passwordHash: defaultPasswordHash,
      phone: '+1-555-0103',
      role: UserRole.CUSTOMER,
      isActive: true,
      tokenVersion: 1
    }
  });

  await prisma.customerProfile.upsert({
    where: { userId: ID.CUST_VANGUARD_USER },
    update: {},
    create: {
      id: ID.CUST_VANGUARD_PROFILE,
      userId: ID.CUST_VANGUARD_USER,
      companyName: 'Vanguard Logistics Hub (DEMO DATA)',
      contactPersonName: 'Marcus Vance',
      taxId: 'US-EIN-47-1928374',
      billingAddress: '10400 OHare Logistics Way, Des Plaines, IL 60018'
    }
  });

  // Service Provider 1: RedShield Fire & Safety Solutions
  await prisma.user.upsert({
    where: { email: 'manager@redshieldfire.com' },
    update: {},
    create: {
      id: ID.PROV_REDSHIELD_MGR,
      email: 'manager@redshieldfire.com',
      passwordHash: defaultPasswordHash,
      phone: '+1-555-0200',
      role: UserRole.SERVICE_MANAGER,
      isActive: true,
      tokenVersion: 1
    }
  });

  await prisma.providerProfile.upsert({
    where: { userId: ID.PROV_REDSHIELD_MGR },
    update: {},
    create: {
      id: ID.PROV_REDSHIELD_PROFILE,
      userId: ID.PROV_REDSHIELD_MGR,
      businessName: 'RedShield Fire & Safety Solutions (DEMO DATA)',
      licenseNumber: 'IL-FP-2024-9981',
      verificationStatus: ProviderVerificationStatus.VERIFIED,
      serviceRadiusKm: 50,
      baseLatitude: 41.8781,
      baseLongitude: -87.6298,
      averageRating: 4.88,
      totalCompletedVisits: 142
    }
  });

  // RedShield Technicians
  await prisma.user.upsert({
    where: { email: 'tech.davis@redshieldfire.com' },
    update: {},
    create: {
      id: ID.PROV_REDSHIELD_TECH_DAVIS,
      email: 'tech.davis@redshieldfire.com',
      passwordHash: defaultPasswordHash,
      phone: '+1-555-0201',
      role: UserRole.SERVICE_PROVIDER,
      isActive: true,
      tokenVersion: 1
    }
  });

  await prisma.user.upsert({
    where: { email: 'tech.patel@redshieldfire.com' },
    update: {},
    create: {
      id: ID.PROV_REDSHIELD_TECH_PATEL,
      email: 'tech.patel@redshieldfire.com',
      passwordHash: defaultPasswordHash,
      phone: '+1-555-0202',
      role: UserRole.SERVICE_PROVIDER,
      isActive: true,
      tokenVersion: 1
    }
  });

  // Service Provider 2: Guardian Fire Protection Corp
  await prisma.user.upsert({
    where: { email: 'manager@guardianfire.com' },
    update: {},
    create: {
      id: ID.PROV_GUARDIAN_MGR,
      email: 'manager@guardianfire.com',
      passwordHash: defaultPasswordHash,
      phone: '+1-555-0300',
      role: UserRole.SERVICE_MANAGER,
      isActive: true,
      tokenVersion: 1
    }
  });

  await prisma.providerProfile.upsert({
    where: { userId: ID.PROV_GUARDIAN_MGR },
    update: {},
    create: {
      id: ID.PROV_GUARDIAN_PROFILE,
      userId: ID.PROV_GUARDIAN_MGR,
      businessName: 'Guardian Fire Protection Corp (DEMO DATA)',
      licenseNumber: 'IL-FP-2025-4412',
      verificationStatus: ProviderVerificationStatus.VERIFIED,
      serviceRadiusKm: 40,
      baseLatitude: 41.9742,
      baseLongitude: -87.9073,
      averageRating: 4.75,
      totalCompletedVisits: 89
    }
  });

  // Guardian Technician
  await prisma.user.upsert({
    where: { email: 'tech.miller@guardianfire.com' },
    update: {},
    create: {
      id: ID.PROV_GUARDIAN_TECH_MILLER,
      email: 'tech.miller@guardianfire.com',
      passwordHash: defaultPasswordHash,
      phone: '+1-555-0301',
      role: UserRole.SERVICE_PROVIDER,
      isActive: true,
      tokenVersion: 1
    }
  });

  // ----------------------------------------------------
  // 2. Physical Sites & Facilities
  // ----------------------------------------------------
  console.log('[Servora Seed] 2. Upserting Sites & Facilities...');

  const sitesData = [
    {
      id: ID.SITE_APEX_TOWER,
      customerId: ID.CUST_APEX_PROFILE,
      siteName: 'Apex Commercial Tower (DEMO DATA)',
      address: '100 Main St',
      city: 'Chicago',
      postalCode: '60601',
      latitude: 41.8781,
      longitude: -87.6298,
      geofenceRadiusMeters: 100,
      onSiteContactName: 'John Miller (Building Ops)',
      onSiteContactPhone: '+1-555-0111'
    },
    {
      id: ID.SITE_APEX_PLAZA,
      customerId: ID.CUST_APEX_PROFILE,
      siteName: 'Apex West Retail Plaza (DEMO DATA)',
      address: '550 W Madison St',
      city: 'Chicago',
      postalCode: '60661',
      latitude: 41.8821,
      longitude: -87.6415,
      geofenceRadiusMeters: 120,
      onSiteContactName: 'Elena Rostova (Property Mgr)',
      onSiteContactPhone: '+1-555-0112'
    },
    {
      id: ID.SITE_METRO_MAIN,
      customerId: ID.CUST_METRO_PROFILE,
      siteName: 'MetroHealth Main Hospital Complex (DEMO DATA)',
      address: '2500 Medical Center Dr',
      city: 'Evanston',
      postalCode: '60201',
      latitude: 42.0451,
      longitude: -87.6877,
      geofenceRadiusMeters: 150,
      onSiteContactName: 'Michael Chang (Safety Officer)',
      onSiteContactPhone: '+1-555-0113'
    },
    {
      id: ID.SITE_METRO_OUTPATIENT,
      customerId: ID.CUST_METRO_PROFILE,
      siteName: 'MetroHealth Outpatient Surgical Center (DEMO DATA)',
      address: '880 Health Science Blvd',
      city: 'Skokie',
      postalCode: '60077',
      latitude: 42.0324,
      longitude: -87.7356,
      geofenceRadiusMeters: 100,
      onSiteContactName: 'Dr. Rebecca Nurse (Clinic Dir)',
      onSiteContactPhone: '+1-555-0114'
    },
    {
      id: ID.SITE_VANGUARD_HUB,
      customerId: ID.CUST_VANGUARD_PROFILE,
      siteName: 'Vanguard Air Cargo Distribution Hub (DEMO DATA)',
      address: '10400 OHare Logistics Way',
      city: 'Des Plaines',
      postalCode: '60018',
      latitude: 41.9742,
      longitude: -87.9073,
      geofenceRadiusMeters: 250,
      onSiteContactName: 'Gary Kowalski (Yard Dispatch)',
      onSiteContactPhone: '+1-555-0115'
    }
  ];

  for (const s of sitesData) {
    await prisma.site.upsert({
      where: { id: s.id },
      update: {},
      create: s
    });
  }

  // ----------------------------------------------------
  // 3. Service Offerings Catalog
  // ----------------------------------------------------
  console.log('[Servora Seed] 3. Upserting Service Offerings...');

  const servicesData = [
    {
      id: ID.SVC_EXTINGUISHER_MAINT,
      providerId: ID.PROV_REDSHIELD_PROFILE,
      name: 'Annual Fire Extinguisher Certification & Maintenance',
      domainCategory: DomainCategory.FIRE_EXTINGUISHER,
      description: 'NFPA 10 compliant annual physical inspection, pressure gauge check, tag verification and hydrostatic date audit.',
      basePrice: 150.00,
      estimatedDurationMinutes: 60,
      isActive: true
    },
    {
      id: ID.SVC_HYDRANT_TESTING,
      providerId: ID.PROV_REDSHIELD_PROFILE,
      name: 'Quarterly Fire Hydrant Flow & Pressure Testing',
      domainCategory: DomainCategory.FIRE_HYDRANT,
      description: 'NFPA 25 static pressure, residual pressure, flow rate gpm measurement and valve maintenance.',
      basePrice: 350.00,
      estimatedDurationMinutes: 120,
      isActive: true
    },
    {
      id: ID.SVC_ALARM_PANEL_AUDIT,
      providerId: ID.PROV_REDSHIELD_PROFILE,
      name: 'Comprehensive Fire Alarm Control Panel Inspection',
      domainCategory: DomainCategory.FIRE_ALARM,
      description: 'NFPA 72 primary/secondary battery load testing, circuit supervisory check, enunciator and dialer communication validation.',
      basePrice: 500.00,
      estimatedDurationMinutes: 180,
      isActive: true
    },
    {
      id: ID.SVC_DETECTOR_CALIBRATION,
      providerId: ID.PROV_GUARDIAN_PROFILE,
      name: 'Multi-Sensor Smoke & Heat Detector Calibration',
      domainCategory: DomainCategory.FIRE_ALARM,
      description: 'Aerosol sensitivity testing and thermal response verification across high-sensitivity cleanrooms and wards.',
      basePrice: 275.00,
      estimatedDurationMinutes: 90,
      isActive: true
    },
    {
      id: ID.SVC_GENERAL_COMPLIANCE,
      providerId: ID.PROV_GUARDIAN_PROFILE,
      name: 'Facility Life Safety Compliance & Egress Audit',
      domainCategory: DomainCategory.GENERAL_SAFETY,
      description: 'OSHA / NFPA 101 emergency lighting 90-minute battery test, exit doorway clearances and pathway compliance.',
      basePrice: 450.00,
      estimatedDurationMinutes: 120,
      isActive: true
    }
  ];

  for (const s of servicesData) {
    await prisma.service.upsert({
      where: { id: s.id },
      update: {},
      create: s
    });
  }

  // ----------------------------------------------------
  // 4. Standard Checklist Templates
  // ----------------------------------------------------
  console.log('[Servora Seed] 4. Upserting Checklist Templates...');

  const templatesData = [
    {
      id: ID.TPL_EXTINGUISHER,
      serviceId: ID.SVC_EXTINGUISHER_MAINT,
      domainCategory: DomainCategory.FIRE_EXTINGUISHER,
      version: 1,
      title: 'NFPA 10 Portable Fire Extinguisher Inspection Checklist',
      itemsJson: [
        { code: 'EXT-LOC', prompt: 'Unit in designated location and unobstructed', required: true },
        { code: 'EXT-GAUGE', prompt: 'Pressure gauge needle indicates operable range (green zone)', required: true },
        { code: 'EXT-PIN', prompt: 'Safety pull pin and tamper seal present and intact', required: true },
        { code: 'EXT-HOSE', prompt: 'Nozzle and hose clear, supple, free of cracks or blockages', required: true },
        { code: 'EXT-COLLAR', prompt: 'Inspection verification collar and annual tag signed', required: true }
      ],
      isActive: true
    },
    {
      id: ID.TPL_HYDRANT,
      serviceId: ID.SVC_HYDRANT_TESTING,
      domainCategory: DomainCategory.FIRE_HYDRANT,
      version: 1,
      title: 'NFPA 25 Private Fire Hydrant Operational Checklist',
      itemsJson: [
        { code: 'HYD-CLEAR', prompt: 'Minimum 36 inches clear working radius around hydrant barrel', required: true },
        { code: 'HYD-VALVE', prompt: 'Operating stem turns freely without binding or leakage', required: true },
        { code: 'HYD-CAP', prompt: 'Outlet caps lubed and gasket seals in pliable condition', required: true },
        { code: 'HYD-STATIC', prompt: 'Static line pressure meets baseline specifications (>50 PSI)', required: true },
        { code: 'HYD-DRAIN', prompt: 'Barrel drain mechanism functions properly after closure', required: true }
      ],
      isActive: true
    },
    {
      id: ID.TPL_ALARM,
      serviceId: ID.SVC_ALARM_PANEL_AUDIT,
      domainCategory: DomainCategory.FIRE_ALARM,
      version: 1,
      title: 'NFPA 72 Fire Alarm System Functional Verification',
      itemsJson: [
        { code: 'ALM-POWER', prompt: 'Primary 120VAC power indicator illuminated; no ground fault', required: true },
        { code: 'ALM-BATT', prompt: 'Secondary standby battery voltage >= 24V under simulated load', required: true },
        { code: 'ALM-COMM', prompt: 'Central monitoring station connection verified operational', required: true },
        { code: 'ALM-ANNUN', prompt: 'Remote enunciator display matches master panel zoning status', required: true }
      ],
      isActive: true
    },
    {
      id: ID.TPL_GENERAL,
      serviceId: ID.SVC_GENERAL_COMPLIANCE,
      domainCategory: DomainCategory.GENERAL_SAFETY,
      version: 1,
      title: 'Life Safety Egress & Emergency Lighting Audit',
      itemsJson: [
        { code: 'GEN-EXIT', prompt: 'Exit corridors, stairwells and panic doors completely unobstructed', required: true },
        { code: 'GEN-LGT', prompt: 'Emergency lighting battery backup illumination test passed', required: true },
        { code: 'GEN-SIGN', prompt: 'Exit directional signs visibly illuminated in all branches', required: true }
      ],
      isActive: true
    }
  ];

  for (const t of templatesData) {
    await prisma.checklistTemplate.upsert({
      where: { id: t.id },
      update: {},
      create: t
    });
  }

  // ----------------------------------------------------
  // 5. Fire Safety Assets & Equipment
  // ----------------------------------------------------
  console.log('[Servora Seed] 5. Upserting Equipment Assets...');

  const equipmentData = [
    // Site 1 (Apex Tower)
    { id: ID.EQ_APEX_EXT_1, siteId: ID.SITE_APEX_TOWER, serialNumber: 'SN-APX-FE-001', qrCodeIdentifier: 'SRV-EQ-APX-FE-001', equipmentType: EquipmentType.FIRE_EXTINGUISHER, specification: 'Badger ABC Dry Chemical 10lb (Class A, B, C)', locationInSite: 'Floor 1 Main Lobby East Wall', status: EquipmentStatus.OPERATIONAL },
    { id: ID.EQ_APEX_EXT_2, siteId: ID.SITE_APEX_TOWER, serialNumber: 'SN-APX-FE-002', qrCodeIdentifier: 'SRV-EQ-APX-FE-002', equipmentType: EquipmentType.FIRE_EXTINGUISHER, specification: 'Ansul Sentry CO2 5lb (Class B, C)', locationInSite: 'Basement Server Room B-104', status: EquipmentStatus.OPERATIONAL },
    { id: ID.EQ_APEX_HYD_1, siteId: ID.SITE_APEX_TOWER, serialNumber: 'SN-APX-FH-001', qrCodeIdentifier: 'SRV-EQ-APX-FH-001', equipmentType: EquipmentType.FIRE_HYDRANT, specification: 'Mueller Super Centurion 250 5-1/4 inch 3-way', locationInSite: 'North Courtyard Entrance Gate', status: EquipmentStatus.OPERATIONAL },
    { id: ID.EQ_APEX_ALM_1, siteId: ID.SITE_APEX_TOWER, serialNumber: 'SN-APX-FA-001', qrCodeIdentifier: 'SRV-EQ-APX-FA-001', equipmentType: EquipmentType.FIRE_ALARM_PANEL, specification: 'Notifier NFS2-3030 Intelligent Addressable Panel', locationInSite: 'Ground Floor Security Operations Center', status: EquipmentStatus.OPERATIONAL },
    { id: ID.EQ_APEX_DET_1, siteId: ID.SITE_APEX_TOWER, serialNumber: 'SN-APX-DS-001', qrCodeIdentifier: 'SRV-EQ-APX-DS-001', equipmentType: EquipmentType.DETECTOR_SENSOR, specification: 'System Sensor Photoelectric Smoke Detector', locationInSite: 'Floor 4 Executive Conference Hall', status: EquipmentStatus.OPERATIONAL },

    // Site 2 (Apex Plaza)
    { id: ID.EQ_APEX_EXT_3, siteId: ID.SITE_APEX_PLAZA, serialNumber: 'SN-APX-FE-003', qrCodeIdentifier: 'SRV-EQ-APX-FE-003', equipmentType: EquipmentType.FIRE_EXTINGUISHER, specification: 'Buckeye Class K Wet Chemical 6-Liter', locationInSite: 'Food Court Central Kitchen Bay', status: EquipmentStatus.NEEDS_MAINTENANCE },
    { id: ID.EQ_APEX_HYD_2, siteId: ID.SITE_APEX_PLAZA, serialNumber: 'SN-APX-FH-002', qrCodeIdentifier: 'SRV-EQ-APX-FH-002', equipmentType: EquipmentType.FIRE_HYDRANT, specification: 'Kennedy Guardian K-81D Post Hydrant', locationInSite: 'West Customer Parking Perimeter', status: EquipmentStatus.OPERATIONAL },

    // Site 3 (MetroHealth Main)
    { id: ID.EQ_METRO_EXT_1, siteId: ID.SITE_METRO_MAIN, serialNumber: 'SN-MTH-FE-001', qrCodeIdentifier: 'SRV-EQ-MTH-FE-001', equipmentType: EquipmentType.FIRE_EXTINGUISHER, specification: 'Amerex Halotron I Clean Agent 11lb Non-magnetic', locationInSite: 'Radiology MRI Suite Corridor', status: EquipmentStatus.OPERATIONAL },
    { id: ID.EQ_METRO_EXT_2, siteId: ID.SITE_METRO_MAIN, serialNumber: 'SN-MTH-FE-002', qrCodeIdentifier: 'SRV-EQ-MTH-FE-002', equipmentType: EquipmentType.FIRE_EXTINGUISHER, specification: 'Amerex Water Mist 2.5 Gal Class A & C Safe', locationInSite: 'Operating Room Surgical Wing Block C', status: EquipmentStatus.OPERATIONAL },
    { id: ID.EQ_METRO_HYD_1, siteId: ID.SITE_METRO_MAIN, serialNumber: 'SN-MTH-FH-001', qrCodeIdentifier: 'SRV-EQ-MTH-FH-001', equipmentType: EquipmentType.FIRE_HYDRANT, specification: 'Clow Valve Medallion High Pressure Hydrant', locationInSite: 'Emergency Ambulance Bay Driveway', status: EquipmentStatus.OPERATIONAL },
    { id: ID.EQ_METRO_ALM_1, siteId: ID.SITE_METRO_MAIN, serialNumber: 'SN-MTH-FA-001', qrCodeIdentifier: 'SRV-EQ-MTH-FA-001', equipmentType: EquipmentType.FIRE_ALARM_PANEL, specification: 'Simplex 4100ES Voice Evacuation Life Safety', locationInSite: 'Central Facilities Command Wing', status: EquipmentStatus.OPERATIONAL },
    { id: ID.EQ_METRO_DET_1, siteId: ID.SITE_METRO_MAIN, serialNumber: 'SN-MTH-DS-001', qrCodeIdentifier: 'SRV-EQ-MTH-DS-001', equipmentType: EquipmentType.DETECTOR_SENSOR, specification: 'Siemens Cerberus PRO Dual-Optical Detector', locationInSite: 'Intensive Care Unit Neonatal Ward', status: EquipmentStatus.OPERATIONAL },

    // Site 4 (MetroHealth Outpatient)
    { id: ID.EQ_METRO_EXT_3, siteId: ID.SITE_METRO_OUTPATIENT, serialNumber: 'SN-MTH-FE-003', qrCodeIdentifier: 'SRV-EQ-MTH-FE-003', equipmentType: EquipmentType.FIRE_EXTINGUISHER, specification: 'Badger ABC Multi-Purpose Dry Chem 10lb', locationInSite: 'Pharmacy Outpatient Dispensary', status: EquipmentStatus.OPERATIONAL },
    { id: ID.EQ_METRO_ALM_2, siteId: ID.SITE_METRO_OUTPATIENT, serialNumber: 'SN-MTH-FA-002', qrCodeIdentifier: 'SRV-EQ-MTH-FA-002', equipmentType: EquipmentType.FIRE_ALARM_PANEL, specification: 'Edwards EST3 Intelligent Fire Panel', locationInSite: 'Main Clinic Reception Vestibule', status: EquipmentStatus.OPERATIONAL },

    // Site 5 (Vanguard Logistics)
    { id: ID.EQ_VANGUARD_EXT_1, siteId: ID.SITE_VANGUARD_HUB, serialNumber: 'SN-VNG-FE-001', qrCodeIdentifier: 'SRV-EQ-VNG-FE-001', equipmentType: EquipmentType.FIRE_EXTINGUISHER, specification: 'Ansul Red Line Purple-K 20lb High Hazard', locationInSite: 'Aviation Fuel Storage Bay 3', status: EquipmentStatus.NEEDS_MAINTENANCE },
    { id: ID.EQ_VANGUARD_EXT_2, siteId: ID.SITE_VANGUARD_HUB, serialNumber: 'SN-VNG-FE-002', qrCodeIdentifier: 'SRV-EQ-VNG-FE-002', equipmentType: EquipmentType.FIRE_EXTINGUISHER, specification: 'Kidde Pro Line ABC 20lb Industrial', locationInSite: 'High-Bay Rack Logistics Aisle 14', status: EquipmentStatus.OPERATIONAL },
    { id: ID.EQ_VANGUARD_HYD_1, siteId: ID.SITE_VANGUARD_HUB, serialNumber: 'SN-VNG-FH-001', qrCodeIdentifier: 'SRV-EQ-VNG-FH-001', equipmentType: EquipmentType.FIRE_HYDRANT, specification: 'American Darling B-84-B Industrial Hydrant', locationInSite: 'Airside Gate Security Perimeter', status: EquipmentStatus.OPERATIONAL },
    { id: ID.EQ_VANGUARD_ALM_1, siteId: ID.SITE_VANGUARD_HUB, serialNumber: 'SN-VNG-FA-001', qrCodeIdentifier: 'SRV-EQ-VNG-FA-001', equipmentType: EquipmentType.FIRE_ALARM_PANEL, specification: 'Fire-Lite MS-9600UDLS Addressable', locationInSite: 'Logistics Dispatch Office Hub', status: EquipmentStatus.OPERATIONAL }
  ];

  for (const eq of equipmentData) {
    await prisma.equipment.upsert({
      where: { qrCodeIdentifier: eq.qrCodeIdentifier },
      update: {},
      create: eq
    });
  }

  // ----------------------------------------------------
  // 6. Maintenance Contracts (AMC / QMC)
  // ----------------------------------------------------
  console.log('[Servora Seed] 6. Upserting Maintenance Contracts...');

  // Contract 1: Apex Commerce <-> RedShield (Annual)
  await prisma.contract.upsert({
    where: { contractNumber: 'CTR-APX-RS-2026-001' },
    update: {},
    create: {
      id: ID.CONTRACT_APEX_REDSHIELD,
      contractNumber: 'CTR-APX-RS-2026-001',
      customerId: ID.CUST_APEX_PROFILE,
      providerId: ID.PROV_REDSHIELD_PROFILE,
      siteId: ID.SITE_APEX_TOWER,
      frequency: ContractFrequency.ANNUAL,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-12-31T23:59:59Z'),
      gracePeriodDays: 14,
      status: ContractStatus.ACTIVE,
      termsSummary: 'Comprehensive annual fire life-safety agreement covering all extinguishers, hydrants, and master alarm panels.',
      equipment: {
        connect: [
          { id: ID.EQ_APEX_EXT_1 },
          { id: ID.EQ_APEX_EXT_2 },
          { id: ID.EQ_APEX_HYD_1 },
          { id: ID.EQ_APEX_ALM_1 }
        ]
      }
    }
  });

  // Contract 2: MetroHealth <-> RedShield (Quarterly)
  await prisma.contract.upsert({
    where: { contractNumber: 'CTR-MTH-RS-2026-002' },
    update: {},
    create: {
      id: ID.CONTRACT_METRO_REDSHIELD,
      contractNumber: 'CTR-MTH-RS-2026-002',
      customerId: ID.CUST_METRO_PROFILE,
      providerId: ID.PROV_REDSHIELD_PROFILE,
      siteId: ID.SITE_METRO_MAIN,
      frequency: ContractFrequency.QUARTERLY,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2026-12-31T23:59:59Z'),
      gracePeriodDays: 7,
      status: ContractStatus.ACTIVE,
      termsSummary: 'Joint Commission and NFPA 99 Healthcare Facilities code quarterly verification and certification contract.',
      equipment: {
        connect: [
          { id: ID.EQ_METRO_EXT_1 },
          { id: ID.EQ_METRO_EXT_2 },
          { id: ID.EQ_METRO_HYD_1 },
          { id: ID.EQ_METRO_ALM_1 }
        ]
      }
    }
  });

  // Contract 3: Vanguard Logistics <-> Guardian (Bi-Annual)
  await prisma.contract.upsert({
    where: { contractNumber: 'CTR-VNG-GF-2026-003' },
    update: {},
    create: {
      id: ID.CONTRACT_VANGUARD_GUARDIAN,
      contractNumber: 'CTR-VNG-GF-2026-003',
      customerId: ID.CUST_VANGUARD_PROFILE,
      providerId: ID.PROV_GUARDIAN_PROFILE,
      siteId: ID.SITE_VANGUARD_HUB,
      frequency: ContractFrequency.BI_ANNUAL,
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2027-02-28T23:59:59Z'),
      gracePeriodDays: 10,
      status: ContractStatus.ACTIVE,
      termsSummary: 'Industrial warehouse and hazardous cargo apron bi-annual fire suppression inspection service contract.',
      equipment: {
        connect: [
          { id: ID.EQ_VANGUARD_EXT_1 },
          { id: ID.EQ_VANGUARD_EXT_2 },
          { id: ID.EQ_VANGUARD_HYD_1 }
        ]
      }
    }
  });

  // ----------------------------------------------------
  // 7. Service Requests (Ad-hoc bookings)
  // ----------------------------------------------------
  console.log('[Servora Seed] 7. Upserting Service Requests...');

  await prisma.serviceRequest.upsert({
    where: { id: ID.SR_METRO_DETECTOR },
    update: {},
    create: {
      id: ID.SR_METRO_DETECTOR,
      customerId: ID.CUST_METRO_PROFILE,
      providerId: ID.PROV_GUARDIAN_PROFILE,
      siteId: ID.SITE_METRO_OUTPATIENT,
      serviceId: ID.SVC_DETECTOR_CALIBRATION,
      status: ServiceRequestStatus.SUBMITTED,
      preferredDate: new Date('2026-11-20T09:00:00Z'),
      preferredTimeSlot: 'Morning (09:00 - 12:00)',
      customerNotes: 'Clinic room 3B detector reported a supervisory flutter on yesterday evening routine walk. Requesting calibration.'
    }
  });

  await prisma.serviceRequest.upsert({
    where: { id: ID.SR_VANGUARD_RECHARGE },
    update: {},
    create: {
      id: ID.SR_VANGUARD_RECHARGE,
      customerId: ID.CUST_VANGUARD_PROFILE,
      providerId: ID.PROV_GUARDIAN_PROFILE,
      siteId: ID.SITE_VANGUARD_HUB,
      serviceId: ID.SVC_EXTINGUISHER_MAINT,
      status: ServiceRequestStatus.SCHEDULED,
      preferredDate: new Date('2026-11-18T14:00:00Z'),
      preferredTimeSlot: 'Afternoon (13:00 - 16:00)',
      customerNotes: 'Aviation fuel bay 3 Purple-K gauge shows slight pressure depletion below green band. Needs recharge.'
    }
  });

  await prisma.serviceRequest.upsert({
    where: { id: ID.SR_APEX_AUDIT },
    update: {},
    create: {
      id: ID.SR_APEX_AUDIT,
      customerId: ID.CUST_APEX_PROFILE,
      providerId: ID.PROV_REDSHIELD_PROFILE,
      siteId: ID.SITE_APEX_PLAZA,
      serviceId: ID.SVC_GENERAL_COMPLIANCE,
      status: ServiceRequestStatus.COMPLETED,
      preferredDate: new Date('2026-10-15T10:00:00Z'),
      preferredTimeSlot: 'Morning (10:00 - 13:00)',
      customerNotes: 'Annual food court egress and exit illumination verification.'
    }
  });

  // ----------------------------------------------------
  // 8. Visit Schedules & Executed Visit Records
  // ----------------------------------------------------
  console.log('[Servora Seed] 8. Upserting Visit Schedules & Visit Records...');

  // Visit 1: Completed Annual Inspection at Apex Tower (with record & cert)
  await prisma.visitSchedule.upsert({
    where: { id: ID.VISIT_APEX_COMPLETED },
    update: {},
    create: {
      id: ID.VISIT_APEX_COMPLETED,
      contractId: ID.CONTRACT_APEX_REDSHIELD,
      siteId: ID.SITE_APEX_TOWER,
      assignedTechnicianId: ID.PROV_REDSHIELD_TECH_DAVIS,
      targetDate: new Date('2026-10-15T09:00:00Z'),
      dueDate: new Date('2026-10-22T17:00:00Z'),
      status: VisitStatus.COMPLETED,
      visitType: VisitType.RECURRING_MAINTENANCE
    }
  });

  await prisma.visitRecord.upsert({
    where: { visitScheduleId: ID.VISIT_APEX_COMPLETED },
    update: {},
    create: {
      id: ID.REC_APEX_1,
      visitScheduleId: ID.VISIT_APEX_COMPLETED,
      idempotencyKey: 'IDEMP-APX-VISIT-20261015-001',
      technicianId: ID.PROV_REDSHIELD_TECH_DAVIS,
      checkInTimestamp: new Date('2026-10-15T09:05:12Z'),
      checkInLatitude: 41.87812,
      checkInLongitude: -87.62978,
      checkInAccuracyMeters: 4.5,
      isGeofenceVerified: true,
      checkOutTimestamp: new Date('2026-10-15T11:45:00Z'),
      customerSignerName: 'Sarah Jenkins',
      customerSignatureData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiPjxwYXRoIGQ9Ik0xMCAyMCBRIDI1IDUgNDAgMjAgVCA3MCAyMCIgc3Ryb2tlPSJibGFjayIgZmlsbD0ibm9uZSIvPjwvc3ZnPg==',
      technicianNotes: 'Completed full annual inspection on 5 assets. All pressure gauges verified in optimal range. Hydrostatic collar renewed.',
      recordHash: 'a68f0b7c4e21d89e578c7438e762d04f128be481fa7713d09a25d2c2069b1834',
      syncTimestamp: new Date('2026-10-15T11:46:10Z')
    }
  });

  // Checklist responses for Visit 1
  await prisma.checklistResponse.upsert({
    where: { id: '00000000-0000-0000-0015-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0015-000000000001',
      visitRecordId: ID.REC_APEX_1,
      equipmentId: ID.EQ_APEX_EXT_1,
      templateId: ID.TPL_EXTINGUISHER,
      responsesJson: {
        'EXT-LOC': true,
        'EXT-GAUGE': true,
        'EXT-PIN': true,
        'EXT-HOSE': true,
        'EXT-COLLAR': true
      },
      passedInspection: true,
      defectNotes: null
    }
  });

  // Attachments for Visit 1
  await prisma.attachment.upsert({
    where: { id: '00000000-0000-0000-0016-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0016-000000000001',
      visitRecordId: ID.REC_APEX_1,
      equipmentId: ID.EQ_APEX_EXT_1,
      fileType: AttachmentType.PRESSURE_GAUGE,
      fileUri: '/uploads/synthetic/apex_ext_1_gauge_pass.jpg',
      fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      mimeType: 'image/jpeg',
      fileSizeBytes: 245100,
      capturedAt: new Date('2026-10-15T09:20:00Z')
    }
  });

  // Certificate for Visit 1
  await prisma.certificate.upsert({
    where: { certificateNumber: 'CERT-APX-2026-001' },
    update: {},
    create: {
      id: ID.CERT_APEX_TOWER,
      certificateNumber: 'CERT-APX-2026-001',
      visitRecordId: ID.REC_APEX_1,
      siteId: ID.SITE_APEX_TOWER,
      customerId: ID.CUST_APEX_PROFILE,
      providerId: ID.PROV_REDSHIELD_PROFILE,
      issuedDate: new Date('2026-10-15T12:00:00Z'),
      expirationDate: new Date('2027-10-14T23:59:59Z'),
      status: CertificateStatus.VALID,
      pdfStorageUri: '/certificates/synthetic/CERT-APX-2026-001.pdf',
      qrVerificationUrl: 'http://localhost:5173/verify?cert=CERT-APX-2026-001',
      verificationHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    }
  });

  // Visit 2: Completed Inspection at MetroHealth Hospital
  await prisma.visitSchedule.upsert({
    where: { id: ID.VISIT_METRO_COMPLETED },
    update: {},
    create: {
      id: ID.VISIT_METRO_COMPLETED,
      contractId: ID.CONTRACT_METRO_REDSHIELD,
      siteId: ID.SITE_METRO_MAIN,
      assignedTechnicianId: ID.PROV_REDSHIELD_TECH_PATEL,
      targetDate: new Date('2026-10-28T08:30:00Z'),
      dueDate: new Date('2026-11-04T17:00:00Z'),
      status: VisitStatus.COMPLETED,
      visitType: VisitType.RECURRING_MAINTENANCE
    }
  });

  await prisma.visitRecord.upsert({
    where: { visitScheduleId: ID.VISIT_METRO_COMPLETED },
    update: {},
    create: {
      id: ID.REC_METRO_1,
      visitScheduleId: ID.VISIT_METRO_COMPLETED,
      idempotencyKey: 'IDEMP-MTH-VISIT-20261028-002',
      technicianId: ID.PROV_REDSHIELD_TECH_PATEL,
      checkInTimestamp: new Date('2026-10-28T08:35:00Z'),
      checkInLatitude: 42.04515,
      checkInLongitude: -87.68769,
      checkInAccuracyMeters: 3.8,
      isGeofenceVerified: true,
      checkOutTimestamp: new Date('2026-10-28T11:15:00Z'),
      customerSignerName: 'Dr. Robert Chen',
      customerSignatureData: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMzAiPjxwYXRoIGQ9Ik01IDE1IEMgMjAgNSA0MCAzMCA2MCAxMCBTIDkwIDI1IDk1IDE1IiBzdHJva2U9ImJsYWNrIiBmaWxsPSJub25lIi8+PC9zdmc+',
      technicianNotes: 'Hospital quarterly compliance review passed. Halotron clean agent units in MRI corridor meet all non-magnetic safety standards.',
      recordHash: 'bc4d39e6a0d4b8e21a8f9024f31c7e923e5a1b8d7649c20a158b29c049d13e87',
      syncTimestamp: new Date('2026-10-28T11:16:05Z')
    }
  });

  // Certificate for Visit 2
  await prisma.certificate.upsert({
    where: { certificateNumber: 'CERT-MTH-2026-002' },
    update: {},
    create: {
      id: ID.CERT_METRO_MAIN,
      certificateNumber: 'CERT-MTH-2026-002',
      visitRecordId: ID.REC_METRO_1,
      siteId: ID.SITE_METRO_MAIN,
      customerId: ID.CUST_METRO_PROFILE,
      providerId: ID.PROV_REDSHIELD_PROFILE,
      issuedDate: new Date('2026-10-28T11:30:00Z'),
      expirationDate: new Date('2027-01-27T23:59:59Z'),
      status: CertificateStatus.VALID,
      pdfStorageUri: '/certificates/synthetic/CERT-MTH-2026-002.pdf',
      qrVerificationUrl: 'http://localhost:5173/verify?cert=CERT-MTH-2026-002',
      verificationHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
    }
  });

  // Visit 3: In-Progress Visit at Apex Tower
  await prisma.visitSchedule.upsert({
    where: { id: ID.VISIT_APEX_IN_PROGRESS },
    update: {},
    create: {
      id: ID.VISIT_APEX_IN_PROGRESS,
      contractId: ID.CONTRACT_APEX_REDSHIELD,
      siteId: ID.SITE_APEX_TOWER,
      assignedTechnicianId: ID.PROV_REDSHIELD_TECH_DAVIS,
      targetDate: new Date(),
      dueDate: new Date(Date.now() + 86400000 * 3),
      status: VisitStatus.IN_PROGRESS,
      visitType: VisitType.REPAIR_REFILL
    }
  });

  // Visit 4: Assigned Upcoming Visit at Apex Plaza
  await prisma.visitSchedule.upsert({
    where: { id: ID.VISIT_APEX_ASSIGNED },
    update: {},
    create: {
      id: ID.VISIT_APEX_ASSIGNED,
      contractId: ID.CONTRACT_APEX_REDSHIELD,
      siteId: ID.SITE_APEX_PLAZA,
      assignedTechnicianId: ID.PROV_REDSHIELD_TECH_DAVIS,
      targetDate: new Date(Date.now() + 86400000 * 3),
      dueDate: new Date(Date.now() + 86400000 * 7),
      status: VisitStatus.ASSIGNED,
      visitType: VisitType.RECURRING_MAINTENANCE
    }
  });

  // Visit 5: Overdue Maintenance at Vanguard Logistics
  await prisma.visitSchedule.upsert({
    where: { id: ID.VISIT_VANGUARD_OVERDUE },
    update: {},
    create: {
      id: ID.VISIT_VANGUARD_OVERDUE,
      contractId: ID.CONTRACT_VANGUARD_GUARDIAN,
      siteId: ID.SITE_VANGUARD_HUB,
      assignedTechnicianId: ID.PROV_GUARDIAN_TECH_MILLER,
      targetDate: new Date(Date.now() - 86400000 * 10),
      dueDate: new Date(Date.now() - 86400000 * 3),
      status: VisitStatus.OVERDUE,
      visitType: VisitType.RECURRING_MAINTENANCE
    }
  });

  // Visit 6: Planned Future Visit at MetroHealth Outpatient
  await prisma.visitSchedule.upsert({
    where: { id: ID.VISIT_METRO_PLANNED },
    update: {},
    create: {
      id: ID.VISIT_METRO_PLANNED,
      contractId: ID.CONTRACT_METRO_REDSHIELD,
      siteId: ID.SITE_METRO_OUTPATIENT,
      assignedTechnicianId: null,
      targetDate: new Date(Date.now() + 86400000 * 20),
      dueDate: new Date(Date.now() + 86400000 * 25),
      status: VisitStatus.PLANNED,
      visitType: VisitType.RECURRING_MAINTENANCE
    }
  });

  // ----------------------------------------------------
  // 9. Technician Performance Scores
  // ----------------------------------------------------
  console.log('[Servora Seed] 9. Upserting Technician Scores...');

  await prisma.technicianScore.upsert({
    where: { id: ID.SCORE_DAVIS },
    update: {},
    create: {
      id: ID.SCORE_DAVIS,
      technicianId: ID.PROV_REDSHIELD_TECH_DAVIS,
      evaluationPeriod: '2026-Q3',
      totalAssigned: 24,
      totalCompleted: 23,
      onTimeRatePercent: 95.8,
      checklistAccuracyPercent: 99.1,
      customerSatisfactionScore: 4.85
    }
  });

  await prisma.technicianScore.upsert({
    where: { id: ID.SCORE_PATEL },
    update: {},
    create: {
      id: ID.SCORE_PATEL,
      technicianId: ID.PROV_REDSHIELD_TECH_PATEL,
      evaluationPeriod: '2026-Q3',
      totalAssigned: 18,
      totalCompleted: 18,
      onTimeRatePercent: 100.0,
      checklistAccuracyPercent: 98.5,
      customerSatisfactionScore: 4.90
    }
  });

  await prisma.technicianScore.upsert({
    where: { id: ID.SCORE_MILLER },
    update: {},
    create: {
      id: ID.SCORE_MILLER,
      technicianId: ID.PROV_GUARDIAN_TECH_MILLER,
      evaluationPeriod: '2026-Q3',
      totalAssigned: 15,
      totalCompleted: 14,
      onTimeRatePercent: 93.3,
      checklistAccuracyPercent: 97.0,
      customerSatisfactionScore: 4.70
    }
  });

  // ----------------------------------------------------
  // 10. Notifications Log
  // ----------------------------------------------------
  console.log('[Servora Seed] 10. Upserting Notifications...');

  await prisma.notificationLog.upsert({
    where: { id: ID.NOTIF_1 },
    update: {},
    create: {
      id: ID.NOTIF_1,
      recipientUserId: ID.CUST_APEX_USER,
      channel: NotificationChannel.IN_APP,
      title: 'Compliance Certificate Issued: Apex Tower',
      body: 'Your annual life-safety inspection has been certified. Certificate CERT-APX-2026-001 is now active.',
      status: NotificationStatus.SENT,
      actionUrl: '/customer/certificates'
    }
  });

  await prisma.notificationLog.upsert({
    where: { id: ID.NOTIF_2 },
    update: {},
    create: {
      id: ID.NOTIF_2,
      recipientUserId: ID.PROV_REDSHIELD_TECH_DAVIS,
      channel: NotificationChannel.IN_APP,
      title: 'New Dispatch Assignment',
      body: 'You have been assigned to upcoming inspection at Apex West Retail Plaza on ' + new Date(Date.now() + 86400000 * 3).toLocaleDateString(),
      status: NotificationStatus.QUEUED,
      actionUrl: '/technician/visits'
    }
  });

  await prisma.notificationLog.upsert({
    where: { id: ID.NOTIF_3 },
    update: {},
    create: {
      id: ID.NOTIF_3,
      recipientUserId: ID.CUST_VANGUARD_USER,
      channel: NotificationChannel.EMAIL,
      title: 'Overdue Inspection Alert',
      body: 'Routine fire suppression maintenance at Vanguard Air Cargo Distribution Hub is currently overdue. Please contact Guardian Fire Protection.',
      status: NotificationStatus.SENT,
      actionUrl: '/customer/maintenance'
    }
  });

  // ----------------------------------------------------
  // 11. Immutable Audit Trail Events
  // ----------------------------------------------------
  console.log('[Servora Seed] 11. Upserting Audit Trail Events...');

  const auditEvents = [
    {
      id: ID.AUDIT_1,
      userId: ID.ADMIN,
      action: AuditAction.LOGIN_SUCCESS,
      entityType: 'User',
      entityId: ID.ADMIN,
      ipAddress: '127.0.0.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Servora/1.0',
      payloadAfterJson: { role: 'ADMIN', mode: 'INITIAL_SEED_BOOTSTRAP' }
    },
    {
      id: ID.AUDIT_2,
      userId: ID.PROV_REDSHIELD_TECH_DAVIS,
      action: AuditAction.VISIT_CHECKIN,
      entityType: 'VisitRecord',
      entityId: ID.REC_APEX_1,
      ipAddress: '198.51.100.45',
      userAgent: 'ServoraMobilePWA/2.1 (Android; Field-Tech)',
      payloadAfterJson: { siteId: ID.SITE_APEX_TOWER, geofenceVerified: true, accuracy: 4.5 }
    },
    {
      id: ID.AUDIT_3,
      userId: ID.PROV_REDSHIELD_TECH_DAVIS,
      action: AuditAction.VISIT_COMPLETE,
      entityType: 'VisitRecord',
      entityId: ID.REC_APEX_1,
      ipAddress: '198.51.100.45',
      userAgent: 'ServoraMobilePWA/2.1 (Android; Field-Tech)',
      payloadAfterJson: { signer: 'Sarah Jenkins', assetsInspected: 5, passed: true }
    },
    {
      id: ID.AUDIT_4,
      userId: ID.PROV_REDSHIELD_MGR,
      action: AuditAction.CERTIFICATE_ISSUED,
      entityType: 'Certificate',
      entityId: ID.CERT_APEX_TOWER,
      ipAddress: '198.51.100.12',
      userAgent: 'Mozilla/5.0 ServoraManagerConsole/1.0',
      payloadAfterJson: { certificateNumber: 'CERT-APX-2026-001', validUntil: '2027-10-14' }
    }
  ];

  for (const a of auditEvents) {
    await prisma.auditEvent.upsert({
      where: { id: a.id },
      update: {},
      create: a
    });
  }

  console.log('[Servora Seed] Deterministic synthetic seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Servora Seed Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
