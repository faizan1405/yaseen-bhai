import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, authFail, getRequestMeta } from '@/lib/adminAuth';
import { updateLead, deleteLead, getAllLeads } from '@/lib/profileStore';
import { logAdminAction } from '@/lib/adminAudit';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requirePermission('leads:edit');
  if (!gate.ok) return authFail(gate);

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, priority, adminNotes } = body;

    // Validate parameters
    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    const before = (await getAllLeads()).find((l: any) => l.id === id) || null;
    const updated = await updateLead(id, updateData);
    if (!updated) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    const meta = getRequestMeta(req);
    await logAdminAction({
      actorUserId: gate.user.id,
      action: 'LEAD_UPDATED',
      targetType: 'Lead',
      targetId: id,
      previousValue: before ? { status: before.status, priority: before.priority } : null,
      newValue: updateData,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (error: any) {
    console.error('Admin lead PATCH endpoint failed:', error);
    return NextResponse.json(
      { error: 'Internal server error updating inquiry.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await requirePermission('leads:delete');
  if (!gate.ok) return authFail(gate);

  try {
    const { id } = await params;
    const deleted = await deleteLead(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Lead not found or delete failed.' }, { status: 404 });
    }

    const meta = getRequestMeta(req);
    await logAdminAction({
      actorUserId: gate.user.id,
      action: 'LEAD_DELETED',
      targetType: 'Lead',
      targetId: id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, message: 'Lead deleted successfully.' });
  } catch (error: any) {
    console.error('Admin lead DELETE endpoint failed:', error);
    return NextResponse.json(
      { error: 'Internal server error deleting inquiry.' },
      { status: 500 }
    );
  }
}
