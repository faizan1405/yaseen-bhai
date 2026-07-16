/**
 * One-time, controlled setup script: create or update a SUPER_ADMIN account
 * with an email + password login (bcrypt-hashed, never stored in plaintext).
 *
 * This is deliberately NOT wired into `npm run build`/`npm run dev`/the seed
 * script — it must be run manually, so a stale ADMIN_PASSWORD env var can
 * never silently reset a real admin's password on every deploy.
 *
 * Usage:
 *   npx tsx scripts/bootstrap-admin-credentials.ts <email> <password>
 *   # or, reading from the environment:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=... npx tsx scripts/bootstrap-admin-credentials.ts
 *
 * Safe to re-run: it only ever creates/updates the ONE targeted admin user's
 * own credential + role fields. It never touches any other user, profile,
 * membership, payment or lead data.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.argv[2] || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.argv[3] || process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    console.error('Usage: npx tsx scripts/bootstrap-admin-credentials.ts <email> <password>');
    console.error('   or: ADMIN_EMAIL=... ADMIN_PASSWORD=... npx tsx scripts/bootstrap-admin-credentials.ts');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: 'ADMIN',
      adminRole: 'SUPER_ADMIN',
      adminActive: true,
      adminUpdatedAt: new Date(),
      ...(existing?.adminCreatedAt ? {} : { adminCreatedAt: new Date() }),
    },
    create: {
      email,
      name: 'Admin',
      role: 'ADMIN',
      adminRole: 'SUPER_ADMIN',
      adminActive: true,
      adminPermissions: [],
      passwordHash,
      adminCreatedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: null, // performed via server-side setup script, not an in-app admin
      action: existing ? 'ADMIN_PASSWORD_RESET' : 'ADMIN_CREATE',
      targetType: 'User',
      targetId: user.id,
      metadata: JSON.stringify({
        note: 'Admin email/password bootstrap via script',
        method: 'password',
      }),
    },
  });

  console.log(`✓ Admin credentials ready for ${email}.`);
  console.log('Sign in at /admin/login using "Email & Password".');
}

main()
  .catch((err) => {
    console.error('Failed to set up admin credentials:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
