/**
 * Temporary script to fix admin credentials in the production database.
 * Uses the DATABASE_URL from .env file.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@asannikah.com';
  const password = 'admin@123';

  // Check if user exists
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, passwordHash: true },
  });

  const hash = await bcrypt.hash(password, 12);

  if (existing) {
    console.log('User exists, updating credentials...');
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        passwordHash: hash,
        adminActive: true,
        adminRole: 'SUPER_ADMIN',
        adminUpdatedAt: new Date(),
      },
      select: { id: true, email: true, role: true, adminRole: true, adminActive: true },
    });
    console.log('Updated admin:', JSON.stringify(updated));
  } else {
    console.log('User not found, creating new admin...');
    const created = await prisma.user.create({
      data: {
        email,
        name: 'Asan Nikah Admin',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        passwordHash: hash,
        adminActive: true,
        adminRole: 'SUPER_ADMIN',
        adminPermissions: [],
        adminCreatedAt: new Date(),
        adminUpdatedAt: new Date(),
      },
      select: { id: true, email: true, role: true, adminRole: true, adminActive: true },
    });
    console.log('Created admin:', JSON.stringify(created));
  }

  // Verify the credentials work
  const final = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, adminRole: true, adminActive: true },
  });
  const match = await bcrypt.compare(password, (await prisma.user.findUnique({
    where: { email },
    select: { passwordHash: true }
  }))?.passwordHash || '');

  console.log('\nFinal state:', JSON.stringify(final));
  console.log('Password verified:', match);

  await prisma.$disconnect();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
