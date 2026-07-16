import { prisma } from '@/lib/db';
import type { NotificationType, Prisma } from '@prisma/client';
import { sanitizeActionUrl } from './notificationUrl';
import { parsePagination, buildListMeta, type Pagination } from './pagination';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string | null;
  relatedType?: string | null;
  relatedId?: string | null;
  /** Stable idempotency key — a duplicate create with the same (userId, dedupeKey) is a no-op. */
  dedupeKey?: string | null;
  expiresAt?: Date | null;
}

export async function createNotification(input: CreateNotificationInput) {
  if (input.dedupeKey) {
    const existing = await prisma.notification.findFirst({
      where: { userId: input.userId, dedupeKey: input.dedupeKey },
    });
    if (existing) return existing;
  }

  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title.slice(0, 200),
      message: input.message.slice(0, 1000),
      actionUrl: sanitizeActionUrl(input.actionUrl),
      relatedType: input.relatedType ?? null,
      relatedId: input.relatedId ?? null,
      dedupeKey: input.dedupeKey ?? null,
      expiresAt: input.expiresAt ?? null,
    },
  });
}

/**
 * Fire-and-forget wrapper for every call site outside this module. A
 * notification failure must never reverse the action that triggered it (a
 * successful payment, an accepted interest, an approved profile, ...), so this
 * always resolves and only logs the failure safely (no secrets, no raw error
 * objects that might carry connection strings).
 */
export async function safeCreateNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await createNotification(input);
  } catch (err) {
    console.error('[notifications] failed to create notification', {
      type: input.type,
      relatedType: input.relatedType,
      error: err instanceof Error ? err.message : 'unknown error',
    });
  }
}

export async function listNotifications(userId: string, pagination: Pagination, unreadOnly = false) {
  const now = new Date();
  const where: Prisma.NotificationWhereInput = {
    userId,
    ...(unreadOnly ? { isRead: false } : {}),
    OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
  };

  const [rows, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.notification.count({ where }),
  ]);

  return { items: rows, meta: buildListMeta(pagination.page, pagination.pageSize, total, rows.length) };
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  if (result.count > 0) return true;
  // Already read (or belongs to this user but was already marked) is still a
  // success from the caller's perspective as long as the row exists.
  const exists = await prisma.notification.findFirst({ where: { id: notificationId, userId }, select: { id: true } });
  return Boolean(exists);
}

export async function markAllNotificationsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  return result.count;
}

export async function deleteNotification(userId: string, notificationId: string) {
  const result = await prisma.notification.deleteMany({ where: { id: notificationId, userId } });
  return result.count > 0;
}

export async function getUnreadNotificationCount(userId: string) {
  const now = new Date();
  return prisma.notification.count({
    where: { userId, isRead: false, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
  });
}
