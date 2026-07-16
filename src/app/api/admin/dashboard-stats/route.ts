import { NextResponse } from 'next/server';
import { requirePermission, authFail } from '@/lib/adminAuth';
import { prisma } from '@/lib/db';

// Read-only aggregate visibility for admins into the new member-engagement
// features (interest requests + notification delivery). No user impersonation,
// no per-user PII beyond counts — matches the "no new admin system in this
// pass" instruction while still satisfying "admins may view aggregate stats".
export async function GET() {
  const gate = await requirePermission('reports:view');
  if (!gate.ok) return authFail(gate);

  try {
    const [pending, accepted, rejected, withdrawn, totalNotifications, unreadNotifications, failedDeliveries] =
      await Promise.all([
        prisma.interestRequest.count({ where: { status: 'PENDING' } }),
        prisma.interestRequest.count({ where: { status: 'ACCEPTED' } }),
        prisma.interestRequest.count({ where: { status: 'REJECTED' } }),
        prisma.interestRequest.count({ where: { status: 'WITHDRAWN' } }),
        prisma.notification.count(),
        prisma.notification.count({ where: { isRead: false } }),
        prisma.notificationLog.count({ where: { status: 'FAILED' } }),
      ]);

    return NextResponse.json({
      interests: {
        pending,
        accepted,
        rejected,
        withdrawn,
        total: pending + accepted + rejected + withdrawn,
      },
      notifications: {
        total: totalNotifications,
        unread: unreadNotifications,
        failedDeliveries,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
