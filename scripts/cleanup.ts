import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting sample database cleanup...');
  try {
    // 1. Find all sample users
    const sampleUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { endsWith: '@rishteforever.sample' } },
          { email: 'sample_admin@rishteforever.sample' },
        ],
      },
      include: {
        profile: {
          include: {
            purchases: true,
          },
        },
      },
    });

    if (sampleUsers.length === 0) {
      console.log('No sample users found to delete.');
      return;
    }

    const sampleUserIds = sampleUsers.map((u) => u.id);
    const sampleProfileIds: string[] = [];
    const samplePurchaseIds: string[] = [];

    for (const u of sampleUsers) {
      if (u.profile) {
        sampleProfileIds.push(u.profile.id);
        if (u.profile.purchases) {
          samplePurchaseIds.push(...u.profile.purchases.map((p) => p.id));
        }
      }
    }

    console.log(`Found ${sampleUserIds.length} sample users, ${sampleProfileIds.length} sample profiles, and ${samplePurchaseIds.length} sample package purchases.`);

    // 2. Clean up AuditLogs referencing sample users, profiles, or purchases
    const deletedLogs = await prisma.auditLog.deleteMany({
      where: {
        OR: [
          { actorUserId: { in: sampleUserIds } },
          {
            AND: [
              { targetType: 'MatrimonialProfile' },
              { targetId: { in: sampleProfileIds } },
            ],
          },
          {
            AND: [
              { targetType: 'PackagePurchase' },
              { targetId: { in: samplePurchaseIds } },
            ],
          },
        ],
      },
    });
    console.log(`Deleted ${deletedLogs.count} audit logs referencing sample records.`);

    // 3. Delete sample users (this cascades to profiles, purchases, curated leads, verification requests)
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: sampleUserIds },
      },
    });

    console.log(`Successfully deleted ${deletedUsers.count} sample users (including cascading profiles, verification requests, purchases, and lead assignments).`);
    console.log('Database cleanup completed!');
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
