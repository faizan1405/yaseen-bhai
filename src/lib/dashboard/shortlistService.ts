import { prisma } from '@/lib/db';
import { isRealObjectId } from './ids';
import { parsePagination, buildListMeta, type Pagination } from './pagination';
import { resolveViewerAccess } from './viewerAccess';
import { buildDashboardProfileCard } from './dashboardProfileCard';

export class ShortlistError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

export async function addShortlist(ownerId: string, targetUserId: string) {
  if (!isRealObjectId(ownerId) || !isRealObjectId(targetUserId)) {
    throw new ShortlistError('Profile not found.', 404);
  }
  if (ownerId === targetUserId) {
    throw new ShortlistError('You cannot shortlist your own profile.', 400);
  }

  try {
    return await prisma.shortlist.create({ data: { ownerId, targetUserId } });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      // Already shortlisted — treat as an idempotent success.
      return prisma.shortlist.findUnique({ where: { ownerId_targetUserId: { ownerId, targetUserId } } });
    }
    throw err;
  }
}

export async function removeShortlistByTarget(ownerId: string, targetUserId: string) {
  const result = await prisma.shortlist.deleteMany({ where: { ownerId, targetUserId } });
  return result.count > 0;
}

export async function removeShortlistById(ownerId: string, shortlistId: string) {
  const result = await prisma.shortlist.deleteMany({ where: { id: shortlistId, ownerId } });
  return result.count > 0;
}

/** Lightweight hydration for the heart-button state on profile cards. */
export async function listShortlistedProfileIds(ownerId: string): Promise<string[]> {
  const rows = await prisma.shortlist.findMany({ where: { ownerId }, select: { targetUserId: true } });
  if (rows.length === 0) return [];

  const targetUserIds = rows.map((r) => r.targetUserId);
  const profiles = await prisma.matrimonialProfile.findMany({
    where: { userId: { in: targetUserIds } },
    select: { id: true },
  });
  return profiles.map((p) => p.id);
}

export async function listShortlistedProfiles(ownerId: string, pagination: Pagination) {
  const [rows, total] = await Promise.all([
    prisma.shortlist.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.shortlist.count({ where: { ownerId } }),
  ]);

  if (rows.length === 0) {
    return { items: [], meta: buildListMeta(pagination.page, pagination.pageSize, total, 0) };
  }

  const targetUserIds = rows.map((r) => r.targetUserId);
  const [profiles, users, viewerAccess] = await Promise.all([
    prisma.matrimonialProfile.findMany({ where: { userId: { in: targetUserIds } } }),
    prisma.user.findMany({ where: { id: { in: targetUserIds } }, select: { id: true, accountStatus: true } }),
    resolveViewerAccess(ownerId),
  ]);

  const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));
  const statusByUserId = new Map(users.map((u) => [u.id, u.accountStatus]));

  const items = rows.map((row) => {
    const targetProfile = profileByUserId.get(row.targetUserId) ?? null;
    const accountStatus = statusByUserId.get(row.targetUserId) ?? null;
    return {
      shortlistId: row.id,
      createdAt: row.createdAt,
      profile: buildDashboardProfileCard(targetProfile, accountStatus ?? null, viewerAccess),
    };
  });

  return { items, meta: buildListMeta(pagination.page, pagination.pageSize, total, items.length) };
}
