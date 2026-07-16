import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin, requirePermission, authFail, getRequestMeta } from '@/lib/adminAuth';
import { getValidObjectId, isFallbackAllowed } from '@/lib/profileStore';
import { logAdminAction } from '@/lib/adminAudit';
import { permissionListAllows, type Permission } from '@/lib/permissions';
import { safeCreateNotification } from '@/lib/dashboard/notificationService';

// Whitelist updatable fields to prevent mass-assignment
const ALLOWED_FIELDS = [
  'verificationStatus',
  'adminApprovalStatus',
  'profileCompletionStatus',
  'hasPaid',
  'category',
  'fullName',
  'phoneNumber',
  'city',
  'state',
  'occupation',
  'education',
  'bio',
  'maslak',
  'biradari',
  'themeColor',
  'profileImageUrl',
  'profileImageStatus',
] as const;

/**
 * A single PATCH can touch profile-approval, photo-approval and/or general
 * profile-edit fields at once. We derive the set of permissions the request
 * actually needs and require ALL of them, so an admin scoped to only "photo
 * approval" can't sneak a `fullName` change through the same call.
 */
function deriveRequiredPermissions(body: Record<string, unknown>): Permission[] {
  const perms = new Set<Permission>();

  if ('profileImageStatus' in body) {
    const v = body.profileImageStatus;
    perms.add(v === 'APPROVED' ? 'photoApproval:approve' : v === 'REJECTED' ? 'photoApproval:reject' : 'photoApproval:view');
  }

  if ('verificationStatus' in body || 'adminApprovalStatus' in body) {
    const v = body.verificationStatus ?? body.adminApprovalStatus;
    perms.add(v === 'APPROVED' ? 'profileApproval:approve' : v === 'REJECTED' ? 'profileApproval:reject' : 'profileApproval:view');
  }

  const generalFields = ALLOWED_FIELDS.filter(
    (k) => k in body && k !== 'profileImageStatus' && k !== 'verificationStatus' && k !== 'adminApprovalStatus'
  );
  if (generalFields.length > 0) perms.add('profiles:edit');

  if (perms.size === 0) perms.add('profiles:edit');
  return Array.from(perms);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const base = await requireAdmin();
  if (!base.ok) return authFail(base);

  try {
    const { id } = await params;
    const body = await req.json();

    const required = deriveRequiredPermissions(body);
    const missing = required.some((p) => !permissionListAllows(base.user.permissions, p));
    if (missing) {
      return NextResponse.json({ error: 'You do not have permission to perform this action.' }, { status: 403 });
    }

    const updateData: Record<string, any> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) updateData[key] = body[key];
    }
    updateData.updatedAt = new Date();

    let previous: Record<string, unknown> | null = null;
    try {
      const dbId = getValidObjectId(id);
      try {
        previous = await prisma.matrimonialProfile.findUnique({
          where: { id: dbId },
          select: Object.fromEntries(ALLOWED_FIELDS.map((k) => [k, true])) as Record<string, boolean>,
        });
      } catch {
        previous = null;
      }

      const updated = await prisma.matrimonialProfile.update({
        where: { id: dbId },
        data: updateData,
      });

      const meta = getRequestMeta(req);
      await logAdminAction({
        actorUserId: base.user.id,
        action: 'PROFILE_UPDATED',
        targetType: 'MatrimonialProfile',
        targetId: dbId,
        previousValue: previous,
        newValue: updateData,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      // In-app notifications for the two approval axes this endpoint can
      // change. safeCreateNotification never throws, so a delivery failure
      // here can never turn this already-successful profile update into an
      // error response.
      const minuteBucket = Math.floor(Date.now() / 60000);
      if ('profileImageStatus' in updateData && (updateData.profileImageStatus === 'APPROVED' || updateData.profileImageStatus === 'REJECTED')) {
        await safeCreateNotification({
          userId: updated.userId,
          type: updateData.profileImageStatus === 'APPROVED' ? 'PHOTO_APPROVED' : 'PHOTO_REJECTED',
          title: updateData.profileImageStatus === 'APPROVED' ? 'Photo approved' : 'Photo needs changes',
          message:
            updateData.profileImageStatus === 'APPROVED'
              ? 'Your profile photo has been approved.'
              : 'Your profile photo could not be approved. Please upload a different photo.',
          actionUrl: '/my-account',
          relatedType: 'MatrimonialProfile',
          relatedId: dbId,
          dedupeKey: `photo_${updateData.profileImageStatus.toLowerCase()}_${dbId}_${minuteBucket}`,
        });
      }
      if ('verificationStatus' in updateData && (updateData.verificationStatus === 'APPROVED' || updateData.verificationStatus === 'REJECTED')) {
        await safeCreateNotification({
          userId: updated.userId,
          type: updateData.verificationStatus === 'APPROVED' ? 'PROFILE_APPROVED' : 'PROFILE_REJECTED',
          title: updateData.verificationStatus === 'APPROVED' ? 'Profile approved' : 'Profile needs changes',
          message:
            updateData.verificationStatus === 'APPROVED'
              ? 'Your matrimonial profile has been approved and is now visible to other members.'
              : 'Your matrimonial profile needs changes before it can be approved. Please review and update it.',
          actionUrl: '/my-account',
          relatedType: 'MatrimonialProfile',
          relatedId: dbId,
          dedupeKey: `profile_${updateData.verificationStatus.toLowerCase()}_${dbId}_${minuteBucket}`,
        });
      }

      return NextResponse.json({ success: true, profile: updated });
    } catch (dbErr: any) {
      if (!isFallbackAllowed()) throw dbErr;
      // In-memory fallback: return success so UI doesn't break when the database is unavailable
      return NextResponse.json({ success: true, profile: { id, ...updateData } });
    }
  } catch (error: any) {
    console.error('Admin profile PATCH failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requirePermission('profiles:delete');
  if (!gate.ok) return authFail(gate);

  try {
    const { id } = await params;

    try {
      const dbId = getValidObjectId(id);
      await prisma.matrimonialProfile.delete({ where: { id: dbId } });

      const meta = getRequestMeta(req);
      await logAdminAction({
        actorUserId: gate.user.id,
        action: 'PROFILE_DELETED',
        targetType: 'MatrimonialProfile',
        targetId: dbId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });

      return NextResponse.json({ success: true });
    } catch (dbErr: any) {
      if (!isFallbackAllowed()) throw dbErr;
      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    console.error('Admin profile DELETE failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
