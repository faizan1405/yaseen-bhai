import { prisma } from '@/lib/db';
import { isRealObjectId } from './ids';
import { parsePagination, buildListMeta, type Pagination } from './pagination';
import { resolveViewerAccess } from './viewerAccess';
import { buildDashboardProfileCard } from './dashboardProfileCard';

// Repeated opens of the same profile within this window update `lastViewedAt`
// (so "most recently viewed" ordering stays accurate) but do NOT bump
// `viewCount` — this is the "rapid refresh" protection required by the spec.
const VIEW_COOLDOWN_MS = 30 * 60 * 1000;

export async function recordProfileView(viewerId: string, viewedUserId: string) {
  if (!isRealObjectId(viewerId) || !isRealObjectId(viewedUserId)) {
    return { recorded: false as const, reason: 'invalid' as const };
  }
  if (viewerId === viewedUserId) {
    return { recorded: false as const, reason: 'self' as const };
  }

  const now = new Date();
  const existing = await prisma.profileView.findUnique({
    where: { viewerId_viewedUserId: { viewerId, viewedUserId } },
  });

  if (!existing) {
    await prisma.profileView.create({
      data: { viewerId, viewedUserId, viewCount: 1, firstViewedAt: now, lastViewedAt: now },
    });
    return { recorded: true as const, incremented: true };
  }

  const elapsed = now.getTime() - existing.lastViewedAt.getTime();
  const shouldIncrement = elapsed >= VIEW_COOLDOWN_MS;

  await prisma.profileView.update({
    where: { id: existing.id },
    data: {
      lastViewedAt: now,
      ...(shouldIncrement ? { viewCount: { increment: 1 } } : {}),
    },
  });
  return { recorded: true as const, incremented: shouldIncrement };
}

export async function listViewedProfiles(viewerId: string, pagination: Pagination) {
  const [rows, total] = await Promise.all([
    prisma.profileView.findMany({
      where: { viewerId },
      orderBy: { lastViewedAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.profileView.count({ where: { viewerId } }),
  ]);

  if (rows.length === 0) {
    return { items: [], meta: buildListMeta(pagination.page, pagination.pageSize, total, 0) };
  }

  const targetUserIds = rows.map((r) => r.viewedUserId);
  const [profiles, users, viewerAccess] = await Promise.all([
    prisma.matrimonialProfile.findMany({ where: { userId: { in: targetUserIds } } }),
    prisma.user.findMany({ where: { id: { in: targetUserIds } }, select: { id: true, accountStatus: true } }),
    resolveViewerAccess(viewerId),
  ]);

  const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));
  const statusByUserId = new Map(users.map((u) => [u.id, u.accountStatus]));

  const items = rows.map((row) => {
    const targetProfile = profileByUserId.get(row.viewedUserId) ?? null;
    const accountStatus = statusByUserId.get(row.viewedUserId) ?? null;
    return {
      viewId: row.id,
      viewCount: row.viewCount,
      firstViewedAt: row.firstViewedAt,
      lastViewedAt: row.lastViewedAt,
      profile: buildDashboardProfileCard(targetProfile, accountStatus ?? null, viewerAccess),
    };
  });

  return { items, meta: buildListMeta(pagination.page, pagination.pageSize, total, items.length) };
}

export async function removeViewedProfile(viewerId: string, viewId: string) {
  const result = await prisma.profileView.deleteMany({ where: { id: viewId, viewerId } });
  return result.count > 0;
}

export async function clearViewedProfiles(viewerId: string) {
  const result = await prisma.profileView.deleteMany({ where: { viewerId } });
  return result.count;
}
