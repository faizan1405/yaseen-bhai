import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, authFail, getRequestMeta } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/adminAudit';
import {
  getMasterDataOptions,
  addMaslakOption,
  editMaslakOption,
  toggleDisableMaslakOption,
  addCasteOption,
  editCasteOption,
  toggleDisableCasteOption,
  addLocationOption,
  toggleLocationPriority,
  toggleDisableLocationOption,
  mergeCastes,
  mergeLocations
} from '@/lib/profileStore';

// Actions that create a new master-data option vs. edit/delete an existing one.
const CREATE_ACTIONS = new Set(['add_maslak', 'add_caste', 'add_location']);

export async function GET() {
  const gate = await requirePermission('masterData:view');
  if (!gate.ok) return authFail(gate);
  try {
    const options = await getMasterDataOptions();
    return NextResponse.json(options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (!action) {
    return NextResponse.json({ error: 'Action is required' }, { status: 400 });
  }

  // Merges are destructive re-labeling operations; treat as delete-level.
  const requiredPerm = CREATE_ACTIONS.has(action)
    ? 'masterData:create'
    : action.startsWith('merge_')
      ? 'masterData:delete'
      : 'masterData:edit';

  const gate = await requirePermission(requiredPerm);
  if (!gate.ok) return authFail(gate);

  const meta = getRequestMeta(req);
  const audit = (targetType: string, targetId: string | null, newValue: unknown) =>
    logAdminAction({
      actorUserId: gate.user.id,
      action: `MASTER_DATA_${action.toUpperCase()}`,
      targetType,
      targetId,
      newValue,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

  try {
    // Maslak actions
    if (action === 'add_maslak') {
      const { label, aliases } = body;
      if (!label) return NextResponse.json({ error: 'Label is required' }, { status: 400 });
      const option = await addMaslakOption(label, aliases || []);
      await audit('MaslakOption', option?.id ?? null, { label, aliases });
      return NextResponse.json({ success: true, option });
    }

    if (action === 'edit_maslak') {
      const { id, label, aliases } = body;
      if (!id || !label) return NextResponse.json({ error: 'Id and label are required' }, { status: 400 });
      const option = await editMaslakOption(id, label, aliases || []);
      await audit('MaslakOption', id, { label, aliases });
      return NextResponse.json({ success: true, option });
    }

    if (action === 'toggle_disable_maslak') {
      const { id, isDisabled } = body;
      if (!id || isDisabled === undefined) return NextResponse.json({ error: 'Id and isDisabled are required' }, { status: 400 });
      const option = await toggleDisableMaslakOption(id, isDisabled);
      await audit('MaslakOption', id, { isDisabled });
      return NextResponse.json({ success: true, option });
    }

    // Caste actions
    if (action === 'add_caste') {
      const { label, aliases } = body;
      if (!label) return NextResponse.json({ error: 'Label is required' }, { status: 400 });
      const option = await addCasteOption(label, aliases || []);
      await audit('CasteOption', option?.id ?? null, { label, aliases });
      return NextResponse.json({ success: true, option });
    }

    if (action === 'edit_caste') {
      const { id, label, aliases } = body;
      if (!id || !label) return NextResponse.json({ error: 'Id and label are required' }, { status: 400 });
      const option = await editCasteOption(id, label, aliases || []);
      await audit('CasteOption', id, { label, aliases });
      return NextResponse.json({ success: true, option });
    }

    if (action === 'toggle_disable_caste') {
      const { id, isDisabled } = body;
      if (!id || isDisabled === undefined) return NextResponse.json({ error: 'Id and isDisabled are required' }, { status: 400 });
      const option = await toggleDisableCasteOption(id, isDisabled);
      await audit('CasteOption', id, { isDisabled });
      return NextResponse.json({ success: true, option });
    }

    // Location actions
    if (action === 'add_location') {
      const { state, district, locality, isHighPriority } = body;
      if (!state || !district) return NextResponse.json({ error: 'State and district are required' }, { status: 400 });
      const option = await addLocationOption(state, district, locality || null, !!isHighPriority);
      await audit('LocationOption', option?.id ?? null, { state, district, locality, isHighPriority });
      return NextResponse.json({ success: true, option });
    }

    if (action === 'toggle_location_priority') {
      const { id, isHighPriority } = body;
      if (!id || isHighPriority === undefined) return NextResponse.json({ error: 'Id and isHighPriority are required' }, { status: 400 });
      const option = await toggleLocationPriority(id, isHighPriority);
      await audit('LocationOption', id, { isHighPriority });
      return NextResponse.json({ success: true, option });
    }

    if (action === 'toggle_disable_location') {
      const { id, isDisabled } = body;
      if (!id || isDisabled === undefined) return NextResponse.json({ error: 'Id and isDisabled are required' }, { status: 400 });
      const option = await toggleDisableLocationOption(id, isDisabled);
      await audit('LocationOption', id, { isDisabled });
      return NextResponse.json({ success: true, option });
    }

    // Merge actions
    if (action === 'merge_castes') {
      const { sourceLabel, targetLabel } = body;
      if (!sourceLabel || !targetLabel) return NextResponse.json({ error: 'Source and target labels are required' }, { status: 400 });
      const result = await mergeCastes(sourceLabel, targetLabel);
      await audit('CasteOption', sourceLabel, { mergedInto: targetLabel });
      return NextResponse.json({ success: result });
    }

    if (action === 'merge_locations') {
      const { sourceId, targetId } = body;
      if (!sourceId || !targetId) return NextResponse.json({ error: 'Source and target IDs are required' }, { status: 400 });
      const result = await mergeLocations(sourceId, targetId);
      await audit('LocationOption', sourceId, { mergedInto: targetId });
      return NextResponse.json({ success: result });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
