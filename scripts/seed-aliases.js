require('dotenv').config({ path: './backend/.env' });
const { PrismaClient, UserRole } = require('@prisma/client');

// Use DIRECT_URL or DATABASE_URL with connection_limit=1
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

async function main() {
  const hash = '$2a$10$2wH2efUfzKJA.ESrZho0leEUYrWBZbM/pVu0ClCJO9X0yS7YIynjG'; // Correct bcrypt hash for Password123!

  // Update all users password to Password123!
  const updated = await prisma.user.updateMany({
    data: { passwordHash: hash }
  });
  console.log('Updated user passwords count:', updated.count);

  // 1. sarah.chen@metrofacilities.com (Customer)
  const sarah = await prisma.user.upsert({
    where: { email: 'sarah.chen@metrofacilities.com' },
    update: { passwordHash: hash, isActive: true },
    create: {
      email: 'sarah.chen@metrofacilities.com',
      passwordHash: hash,
      role: UserRole.CUSTOMER,
      isActive: true,
      tokenVersion: 1,
      customerProfile: {
        create: {
          companyName: 'Metro Facilities Management',
          contactPersonName: 'Sarah Chen',
          taxId: 'US-EIN-12-3456789',
          billingAddress: '500 Michigan Ave, Chicago, IL 60611'
        }
      }
    }
  });
  console.log('Upserted Sarah Chen:', sarah.email);

  // 2. elena.rostova@fireshield.com (Technician)
  const elena = await prisma.user.upsert({
    where: { email: 'elena.rostova@fireshield.com' },
    update: { passwordHash: hash, isActive: true },
    create: {
      email: 'elena.rostova@fireshield.com',
      passwordHash: hash,
      role: UserRole.SERVICE_PROVIDER,
      isActive: true,
      tokenVersion: 1,
      providerProfile: {
        create: {
          businessName: 'FireShield Services Ltd',
          licenseNumber: 'FSC-IL-2024-9988',
          serviceRadiusKm: 50
        }
      }
    }
  });
  console.log('Upserted Elena Rostova:', elena.email);

  // 3. david.ross@fireshield.com (Service Manager)
  const david = await prisma.user.upsert({
    where: { email: 'david.ross@fireshield.com' },
    update: { passwordHash: hash, isActive: true },
    create: {
      email: 'david.ross@fireshield.com',
      passwordHash: hash,
      role: UserRole.SERVICE_MANAGER,
      isActive: true,
      tokenVersion: 1
    }
  });
  console.log('Upserted David Ross:', david.email);

  // 4. admin@servora.com (Admin)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@servora.com' },
    update: { passwordHash: hash, isActive: true },
    create: {
      email: 'admin@servora.com',
      passwordHash: hash,
      role: UserRole.ADMIN,
      isActive: true,
      tokenVersion: 1
    }
  });
  console.log('Upserted Admin:', admin.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
