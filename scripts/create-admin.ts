/**
 * One-shot script to seed an admin user into MongoDB.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts [email] [password]
 *
 * Defaults match the README/.env hint:
 *   admin@asannikah.com / admin@123
 *
 * Behavior:
 *   - If a user with this email already exists, it's promoted to ADMIN,
 *     its password hash is reset, and admin metadata is updated.
 *   - If not, a new ADMIN user is created.
 *   - Run this once. Delete the script (or leave it) — it is safe to re-run.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] || 'admin@asannikah.com').toLowerCase().trim();
  const password = process.argv[3] || 'admin@123';

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { email },
      data: {
        role: 'ADMIN',
        passwordHash,
        adminActive: true,
        adminRole: 'SUPER_ADMIN',
        adminCreatedAt: existing.adminCreatedAt ?? new Date(),
        adminUpdatedAt: new Date(),
      },
      select: { id: true, email: true, role: true, adminRole: true, adminActive: true },
    });
    console.log('Existing user promoted to admin:', updated);
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        name: 'Asan Nikah Admin',
        role: 'ADMIN',
        accountStatus: 'ACTIVE',
        passwordHash,
        adminActive: true,
        adminRole: 'SUPER_ADMIN',
        adminPermissions: [],
        adminCreatedAt: new Date(),
        adminUpdatedAt: new Date(),
      },
      select: { id: true, email: true, role: true, adminRole: true, adminActive: true },
    });
    console.log('New admin user created:', created);
  }

  console.log('\nAdmin login URL: /admin/login');
  console.log(`Email:    ${email}`);
  console.log(`Password: ${password}`);
  console.log('\nChange the password after first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
