/**
 * One-time, controlled setup script: promote an existing (already Google-signed-in)
 * user to SUPER_ADMIN. Run manually — this is deliberately NOT wired into `npm run seed`
 * or any build step, so it can never run unattended against production data.
 *
 * Usage:
 *   npx tsx scripts/promote-super-admin.ts user@example.com
 *
 * Requirements:
 *   - The user must already exist (i.e. they have signed in with Google at least
 *     once). This script never creates a login credential — it only elevates an
 *     existing Auth.js account, consistent with "no password-based admin login".
 *
 * This script is safe to re-run: promoting an existing Super Admin is a no-op
 * update, and it never touches any other user, profile, membership, payment or
 * lead data.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error('Usage: npx tsx scripts/promote-super-admin.ts <email>');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      `No user found with email "${email}". They must sign in with Google at least once (visit the site and log in) before they can be promoted.`
    );
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      role: 'ADMIN',
      adminRole: 'SUPER_ADMIN',
      adminActive: true,
      adminPermissions: [],
      ...(user.adminCreatedAt ? {} : { adminCreatedById: null, adminCreatedAt: new Date() }),
      adminUpdatedById: null,
      adminUpdatedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: null, // performed via server-side setup script, not an in-app admin
      action: 'ADMIN_CREATE',
      targetType: 'User',
      targetId: updated.id,
      metadata: JSON.stringify({ note: 'Initial Super Admin bootstrap via promote-super-admin.ts script', role: 'SUPER_ADMIN' }),
    },
  });

  console.log(`✓ ${email} is now an active Super Admin.`);
  console.log('They can sign in at /admin/login with the same Google account.');
}

main()
  .catch((err) => {
    console.error('Failed to promote user:', err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
