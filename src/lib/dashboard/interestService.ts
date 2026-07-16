import { prisma } from '@/lib/db';
import type { InterestRequest, InterestStatus } from '@prisma/client';
import { getProfileById, getProfileByUserId, getUserPurchases } from '@/lib/profileStore';
import { checkRateLimit } from '@/lib/rateLimit';
import { isRealObjectId } from './ids';
import { buildListMeta, type Pagination } from './pagination';
import { resolveViewerAccess } from './viewerAccess';
import { buildDashboardProfileCard } from './dashboardProfileCard';
import { checkInterestEligibility } from './interestEligibility';
import { safeCreateNotification } from './notificationService';

export class InterestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Statuses that a new send-attempt is allowed to reactivate in place.
const REACTIVATABLE: InterestStatus[] = ['WITHDRAWN', 'REJECTED'];

function isUniqueConstraintError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: string }).code === 'P2002';
}

/**
 * Send (or re-send, after a withdrawal/rejection) an interest request.
 * `targetProfileId` is a MatrimonialProfile id — never a raw user id supplied
 * by the browser — and is resolved to the receiver's User id server-side.
 */
export async function sendInterest(senderId: string, targetProfileId: string, message?: string): Promise<InterestRequest> {
  // Abuse protection: cap how many interest requests one account can send per hour.
  if (checkRateLimit(`interest_send_${senderId}`, 15, 60 * 60 * 1000)) {
    throw new InterestError('You have sent too many interest requests. Please try again later.', 429);
  }

  const receiverProfile = await getProfileById(targetProfileId);
  if (!receiverProfile) {
    throw new InterestError('Profile not found.', 404);
  }

  const receiverId = receiverProfile.userId;
  if (receiverId === senderId) {
    throw new InterestError('You cannot send an interest request to yourself.', 400);
  }
  if (!isRealObjectId(senderId) || !isRealObjectId(receiverId)) {
    throw new InterestError('Profile not found.', 404);
  }

  const [senderProfile, receiverUser] = await Promise.all([
    getProfileByUserId(senderId),
    prisma.user.findUnique({ where: { id: receiverId }, select: { accountStatus: true } }),
  ]);

  if (!senderProfile) {
    throw new InterestError('Complete your profile before sending interest requests.', 403);
  }
  const senderPurchases = await getUserPurchases(senderProfile.id);

  const eligibility = checkInterestEligibility({
    senderProfile,
    senderPurchases,
    receiverProfile,
    receiverAccountStatus: receiverUser?.accountStatus ?? null,
  });
  if (!eligibility.allowed) {
    throw new InterestError(eligibility.reason || 'This profile is not eligible for interest requests.', 403);
  }

  const safeMessage = message ? message.slice(0, 300) : null;
  const now = new Date();

  let record: InterestRequest;
  try {
    record = await prisma.interestRequest.create({
      data: { senderId, receiverId, status: 'PENDING', message: safeMessage, sentAt: now },
    });
  } catch (err) {
    if (!isUniqueConstraintError(err)) throw err;

    // A row already exists for this (sender, receiver) pair — inspect it
    // rather than blindly failing, since WITHDRAWN/REJECTED requests may be
    // legitimately re-sent (reusing the same document keeps the unique index
    // meaningful: exactly one row per ordered pair, ever).
    const existing = await prisma.interestRequest.findUnique({
      where: { senderId_receiverId: { senderId, receiverId } },
    });
    if (!existing) throw err;
    if (!REACTIVATABLE.includes(existing.status)) {
      throw new InterestError('You already have an active interest request with this profile.', 409);
    }

    // Conditional update guards the race where two re-send attempts land at
    // once — only the request that observes the still-reactivatable status
    // wins; the loser gets a clean 409 instead of corrupting state.
    const result = await prisma.interestRequest.updateMany({
      where: { id: existing.id, status: { in: REACTIVATABLE } },
      data: { status: 'PENDING', message: safeMessage, sentAt: now, respondedAt: null, withdrawnAt: null },
    });
    if (result.count === 0) {
      throw new InterestError('You already have an active interest request with this profile.', 409);
    }
    record = await prisma.interestRequest.findUniqueOrThrow({ where: { id: existing.id } });
  }

  await safeCreateNotification({
    userId: receiverId,
    type: 'INTEREST_RECEIVED',
    title: 'New interest request',
    message: `${senderProfile.fullName} sent you an interest request.`,
    actionUrl: '/dashboard/interests/received',
    relatedType: 'InterestRequest',
    relatedId: record.id,
    dedupeKey: `interest_received_${record.id}_${record.sentAt.toISOString()}`,
  });

  return record;
}

export async function respondToInterest(
  receiverId: string,
  interestId: string,
  action: 'ACCEPT' | 'REJECT',
): Promise<InterestRequest> {
  const existing = await prisma.interestRequest.findUnique({ where: { id: interestId } });
  if (!existing) throw new InterestError('Interest request not found.', 404);
  if (existing.receiverId !== receiverId) {
    throw new InterestError('You are not authorized to respond to this request.', 403);
  }
  if (existing.status !== 'PENDING') {
    throw new InterestError('This request has already been responded to.', 409);
  }

  const newStatus: InterestStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED';
  const now = new Date();

  // Atomic conditional transition — re-checks status in the same write so a
  // concurrent accept/reject/withdraw can't race this one.
  const result = await prisma.interestRequest.updateMany({
    where: { id: interestId, status: 'PENDING' },
    data: { status: newStatus, respondedAt: now },
  });
  if (result.count === 0) {
    throw new InterestError('This request has already been responded to.', 409);
  }

  const receiverProfile = await getProfileByUserId(receiverId);
  await safeCreateNotification({
    userId: existing.senderId,
    type: newStatus === 'ACCEPTED' ? 'INTEREST_ACCEPTED' : 'INTEREST_REJECTED',
    title: newStatus === 'ACCEPTED' ? 'Interest accepted' : 'Interest update',
    message:
      newStatus === 'ACCEPTED'
        ? `${receiverProfile?.fullName || 'A member'} accepted your interest request.`
        : `${receiverProfile?.fullName || 'A member'} declined your interest request.`,
    actionUrl: '/dashboard/interests/sent',
    relatedType: 'InterestRequest',
    relatedId: interestId,
    dedupeKey: `interest_${newStatus.toLowerCase()}_${interestId}`,
  });

  return prisma.interestRequest.findUniqueOrThrow({ where: { id: interestId } });
}

export async function withdrawInterest(senderId: string, interestId: string): Promise<InterestRequest> {
  const existing = await prisma.interestRequest.findUnique({ where: { id: interestId } });
  if (!existing) throw new InterestError('Interest request not found.', 404);
  if (existing.senderId !== senderId) {
    throw new InterestError('You are not authorized to withdraw this request.', 403);
  }
  if (existing.status !== 'PENDING') {
    throw new InterestError('Only pending requests can be withdrawn.', 409);
  }

  const now = new Date();
  const result = await prisma.interestRequest.updateMany({
    where: { id: interestId, status: 'PENDING' },
    data: { status: 'WITHDRAWN', withdrawnAt: now },
  });
  if (result.count === 0) {
    throw new InterestError('Only pending requests can be withdrawn.', 409);
  }

  await safeCreateNotification({
    userId: existing.receiverId,
    type: 'INTEREST_WITHDRAWN',
    title: 'Interest request withdrawn',
    message: 'A member withdrew their interest request.',
    actionUrl: '/dashboard/interests/received',
    relatedType: 'InterestRequest',
    relatedId: interestId,
    dedupeKey: `interest_withdrawn_${interestId}`,
  });

  return prisma.interestRequest.findUniqueOrThrow({ where: { id: interestId } });
}

async function buildInterestList(
  rows: InterestRequest[],
  total: number,
  pagination: Pagination,
  viewerUserId: string,
  direction: 'sent' | 'received',
) {
  if (rows.length === 0) {
    return { items: [], meta: buildListMeta(pagination.page, pagination.pageSize, total, 0) };
  }

  const counterpartIds = Array.from(new Set(rows.map((r) => (direction === 'sent' ? r.receiverId : r.senderId))));
  const [profiles, users, viewerAccess] = await Promise.all([
    prisma.matrimonialProfile.findMany({ where: { userId: { in: counterpartIds } } }),
    prisma.user.findMany({ where: { id: { in: counterpartIds } }, select: { id: true, accountStatus: true } }),
    resolveViewerAccess(viewerUserId),
  ]);
  const profileByUserId = new Map(profiles.map((p) => [p.userId, p]));
  const statusByUserId = new Map(users.map((u) => [u.id, u.accountStatus]));

  const items = rows.map((row) => {
    const counterpartId = direction === 'sent' ? row.receiverId : row.senderId;
    const targetProfile = profileByUserId.get(counterpartId) ?? null;
    const accountStatus = statusByUserId.get(counterpartId) ?? null;
    return {
      id: row.id,
      status: row.status,
      message: row.message,
      sentAt: row.sentAt,
      respondedAt: row.respondedAt,
      withdrawnAt: row.withdrawnAt,
      profile: buildDashboardProfileCard(targetProfile, accountStatus ?? null, viewerAccess),
    };
  });

  return { items, meta: buildListMeta(pagination.page, pagination.pageSize, total, items.length) };
}

export async function listSentInterests(senderId: string, pagination: Pagination) {
  const [rows, total] = await Promise.all([
    prisma.interestRequest.findMany({
      where: { senderId },
      orderBy: { sentAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.interestRequest.count({ where: { senderId } }),
  ]);
  return buildInterestList(rows, total, pagination, senderId, 'sent');
}

export async function listReceivedInterests(receiverId: string, pagination: Pagination) {
  const [rows, total] = await Promise.all([
    prisma.interestRequest.findMany({
      where: { receiverId },
      orderBy: { sentAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
    }),
    prisma.interestRequest.count({ where: { receiverId } }),
  ]);
  return buildInterestList(rows, total, pagination, receiverId, 'received');
}

export async function getInterestCounts(userId: string) {
  const [pendingSent, pendingReceived] = await Promise.all([
    prisma.interestRequest.count({ where: { senderId: userId, status: 'PENDING' } }),
    prisma.interestRequest.count({ where: { receiverId: userId, status: 'PENDING' } }),
  ]);
  return { pendingSent, pendingReceived };
}
