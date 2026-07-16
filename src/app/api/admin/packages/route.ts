import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, authFail, getRequestMeta } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/adminAudit';
import {
  getAllPurchases,
  getCuratedAssignments,
  assignCuratedLead,
  updateCuratedLeadStatus,
  updateHighProfileEligibility,
  confirmMarriage,
  updateSuccessFeeStatus
} from '@/lib/profileStore';
import { ApprovalStatus, PaymentStatus } from '@prisma/client';

export async function GET(req: NextRequest) {
  const gate = await requirePermission('payments:view');
  if (!gate.ok) return authFail(gate);

  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode');

    if (mode === 'assignments') {
      const assignments = await getCuratedAssignments();
      return NextResponse.json({ assignments });
    }

    const purchases = await getAllPurchases();
    return NextResponse.json({ purchases });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action } = body;

  // assign_lead / update_lead_status are lead-assignment operations; the rest
  // are payment/eligibility mutations.
  const requiredPerm = action === 'assign_lead' || action === 'update_lead_status'
    ? 'packages:assign'
    : 'payments:edit';

  const gate = await requirePermission(requiredPerm);
  if (!gate.ok) return authFail(gate);
  const meta = getRequestMeta(req);

  try {
    if (action === 'assign_lead') {
      const { buyerProfileId, leadProfileId } = body;
      if (!buyerProfileId || !leadProfileId) {
        return NextResponse.json({ error: 'Missing profiles' }, { status: 400 });
      }
      const assignment = await assignCuratedLead(buyerProfileId, leadProfileId);
      await logAdminAction({
        actorUserId: gate.user.id,
        action: 'CURATED_LEAD_ASSIGNED',
        targetType: 'CuratedLeadAssignment',
        targetId: assignment?.id ?? null,
        newValue: { buyerProfileId, leadProfileId },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      return NextResponse.json({ success: true, assignment });
    }

    if (action === 'update_lead_status') {
      const { assignmentId, status } = body;
      if (!assignmentId || !status) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }
      const updated = await updateCuratedLeadStatus(assignmentId, status);
      await logAdminAction({
        actorUserId: gate.user.id,
        action: 'CURATED_LEAD_STATUS_CHANGE',
        targetType: 'CuratedLeadAssignment',
        targetId: assignmentId,
        newValue: { status },
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
      return NextResponse.json({ success: true, assignment: updated });
    }

    if (action === 'update_eligibility') {
      const { purchaseId, status, notes } = body;
      if (!purchaseId || !status) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }
      // updateHighProfileEligibility already writes its own audit log entry.
      const updated = await updateHighProfileEligibility(purchaseId, status as ApprovalStatus, notes || '', gate.user.id);
      return NextResponse.json({ success: true, purchase: updated });
    }

    if (action === 'confirm_marriage') {
      const { purchaseId, confirmed } = body;
      if (!purchaseId || confirmed === undefined) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }
      // confirmMarriage already writes its own audit log entry.
      const updated = await confirmMarriage(purchaseId, confirmed, gate.user.id);
      return NextResponse.json({ success: true, purchase: updated });
    }

    if (action === 'update_success_fee_status') {
      const { purchaseId, status } = body;
      if (!purchaseId || !status) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }
      // updateSuccessFeeStatus already writes its own audit log entry.
      const updated = await updateSuccessFeeStatus(purchaseId, status as PaymentStatus, gate.user.id);
      return NextResponse.json({ success: true, purchase: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
