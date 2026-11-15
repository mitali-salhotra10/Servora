/**
 * Servora — Pilot Alias & Test Account Seeding Utility
 *
 * SAFETY RESTRICTIONS:
 * - Restricted strictly to development, testing, and staging environments.
 * - Guarded against production execution (NODE_ENV === 'production').
 * - Operates ONLY on an explicit allowlist of synthetic pilot accounts.
 * - Does NOT perform global password updates or modify existing user passwords.
 * - Does NOT contain hardcoded plain-text passwords or static password hashes.
 */

require('dotenv').config({ path: './backend/.env' });
const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// 1. Environment Safeguard: Abort immediately in production
if (process.env.NODE_ENV === 'production') {
  console.error('❌ [SECURITY ERROR] seed-aliases.js is strictly forbidden in a production environment.');
  process.exit(1);
}

// 2. Strict Synthetic Test Account Allowlist
const SYNTHETIC_TEST_ACCOUNTS = new Set([
  'facilities@apexcommerce.com',
  'compliance@metrohealth.org',
  'ops@vanguardlogistics.com',
  'manager@redshieldfire.com',
  'tech.davis@redshieldfire.com',
  'tech.patel@redshieldfire.com',
  'manager@guardianfire.com',
  'tech.miller@guardianfire.com',
  'admin@servora.app',
  'sarah.chen@metrofacilities.com',
  'elena.rostova@fireshield.com',
  'david.ross@fireshield.com',
  'admin@servora.com'
]);

// 3. Resolve password dynamically from environment (never hardcoded in source)
const seedPassword = process.env.PILOT_SEED_PASSWORD || process.env.TEST_USER_PASSWORD;

function getPasswordHash() {
  if (!seedPassword) {
    throw new Error(
      'PILOT_SEED_PASSWORD or TEST_USER_PASSWORD environment variable must be provided to initialize new test accounts.'
    );
  }
  return bcrypt.hashSync(seedPassword, 10);
}

// 4. Initialize connection with connection limits
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString
    }
  }
});

async function main() {
  console.log('[Safe Seed] Verifying environment and test account boundaries...');

  const aliasesToSeed = [
    {
      email: 'sarah.chen@metrofacilities.com',
      role: UserRole.CUSTOMER,
      profile: {
        customerProfile: {
          create: {
            companyName: 'Metro Facilities Management',
            contactPersonName: 'Sarah Chen',
            taxId: 'US-EIN-12-3456789',
            billingAddress: '500 Michigan Ave, Chicago, IL 60611'
          }
        }
      }
    },
    {
      email: 'elena.rostova@fireshield.com',
      role: UserRole.SERVICE_PROVIDER,
      profile: {
        providerProfile: {
          create: {
            businessName: 'FireShield Services Ltd',
            licenseNumber: 'FSC-IL-2024-9988',
            serviceRadiusKm: 50
          }
        }
      }
    },
    {
      email: 'david.ross@fireshield.com',
      role: UserRole.SERVICE_MANAGER,
      profile: {}
    },
    {
      email: 'admin@servora.com',
      role: UserRole.ADMIN,
      profile: {}
    }
  ];

  for (const alias of aliasesToSeed) {
    // Boundary check: Enforce strict allowlist to prevent touching any real customer
    if (!SYNTHETIC_TEST_ACCOUNTS.has(alias.email)) {
      console.warn(`[Safe Seed] Skipped unauthorized email outside allowlist: ${alias.email}`);
      continue;
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: alias.email },
      select: { id: true, email: true, isActive: true }
    });

    if (existing) {
      // Do NOT modify existing password; only ensure active status
      await prisma.user.update({
        where: { id: existing.id },
        data: { isActive: true }
      });
      console.log(`✓ [Safe Seed] Existing test account verified (passwords unchanged): ${alias.email}`);
    } else {
      // Create new test account with dynamically computed hash
      const passwordHash = getPasswordHash();
      const created = await prisma.user.create({
        data: {
          email: alias.email,
          passwordHash,
          role: alias.role,
          isActive: true,
          tokenVersion: 1,
          ...alias.profile
        }
      });
      console.log(`✓ [Safe Seed] New test alias registered: ${created.email}`);
    }
  }
}

main()
  .catch((err) => {
    console.error('❌ [Safe Seed Error]:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
