import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authFail } from '@/lib/adminAuth';
import { getVerificationRequests, updateVerificationStatus, getAuditLogs } from '@/lib/profileStore';
import { prisma } from '@/lib/db';
import { notifyVerificationStatus } from '@/lib/notifications';
import { safeCreateNotification } from '@/lib/dashboard/notificationService';
import { VerificationStatus } from '@prisma/client';
import { permissionListAllows } from '@/lib/permissions';

// Get all verification requests
export async function GET(req: NextRequest) {
  const base = await requireAdmin();
  if (!base.ok) return authFail(base);

  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    if (mode === 'audit') {
      if (!permissionListAllows(base.user.permissions, 'reports:view')) {
        return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
      }
      const logs = await getAuditLogs();
      return NextResponse.json({ logs });
    }

    if (!permissionListAllows(base.user.permissions, 'verification:view')) {
      return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
    }
    const requests = await getVerificationRequests();
    return NextResponse.json({ requests });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Update verification status
export async function POST(req: NextRequest) {
  const base = await requireAdmin();
  if (!base.ok) return authFail(base);

  try {
    const body = await req.json();
    const { profileId, status, notes } = body;

    if (!profileId || !status) {
      return NextResponse.json({ error: 'ProfileId and status are required' }, { status: 400 });
    }

    const validStatuses: VerificationStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_FOLLOW_UP'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid verification status' }, { status: 400 });
    }

    const requiredPerm =
      status === 'APPROVED' ? 'verification:approve' :
      status === 'REJECTED' ? 'verification:reject' :
      'verification:edit';
    if (!permissionListAllows(base.user.permissions, requiredPerm)) {
      return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
    }

    // updateVerificationStatus already writes its own AuditLog entry.
    await updateVerificationStatus(profileId, status as VerificationStatus, notes || '', base.user.id);

    try {
      const profile = await prisma.matrimonialProfile.findUnique({
        where: { id: profileId },
        include: { user: true }
      });
      if (profile) {
        const userEmail = profile.user?.email || null;
        notifyVerificationStatus(userEmail, profile.phoneNumber, profile.fullName, status);

        if (profile.userId && (status === 'APPROVED' || status === 'REJECTED')) {
          await safeCreateNotification({
            userId: profile.userId,
            type: status === 'APPROVED' ? 'PROFILE_APPROVED' : 'PROFILE_REJECTED',
            title: status === 'APPROVED' ? 'Profile approved' : 'Profile needs changes',
            message:
              status === 'APPROVED'
                ? 'Your matrimonial profile has been approved and is now visible to other members.'
                : 'Your matrimonial profile needs changes before it can be approved. Please review and update it.',
            actionUrl: '/my-account',
            relatedType: 'MatrimonialProfile',
            relatedId: profileId,
            // Bucketed to the minute: absorbs accidental double-submits of the
            // same admin action without permanently blocking a genuine later
            // status change (e.g. approved → rejected → approved again).
            dedupeKey: `profile_${status.toLowerCase()}_${profileId}_${Math.floor(Date.now() / 60000)}`,
          });
        }
      }
    } catch (e) {
      console.error('Failed to notify verification status', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
