import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, authFail, getRequestMeta } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/adminAudit';
import {
  getAllSuccessStories,
  createSuccessStory,
  updateSuccessStory,
  deleteSuccessStory,
} from '@/lib/successStories';

function validate(body: any): string | null {
  if (!body?.coupleNames || typeof body.coupleNames !== 'string' || body.coupleNames.trim() === '') {
    return 'Couple names are required.';
  }
  if (!body?.story || typeof body.story !== 'string' || body.story.trim() === '') {
    return 'Story content is required.';
  }
  if (body.coupleNames.length > 200) return 'Couple names too long.';
  if (body.story.length > 4000) return 'Story content too long (max 4000 characters).';
  if (body.displayOrder !== undefined && Number.isNaN(Number(body.displayOrder))) {
    return 'Display order must be a number.';
  }
  return null;
}

// Admin: list ALL stories (published + drafts).
export async function GET() {
  const gate = await requirePermission('successStories:view');
  if (!gate.ok) return authFail(gate);
  try {
    const stories = await getAllSuccessStories();
    return NextResponse.json({ stories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Admin: create a new story.
export async function POST(req: NextRequest) {
  const gate = await requirePermission('successStories:create');
  if (!gate.ok) return authFail(gate);
  try {
    const body = await req.json();
    const err = validate(body);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    const story = await createSuccessStory({ ...body, createdById: gate.user.id });

    const meta = getRequestMeta(req);
    await logAdminAction({
      actorUserId: gate.user.id,
      action: 'SUCCESS_STORY_CREATED',
      targetType: 'SuccessStory',
      targetId: story?.id ?? null,
      newValue: { coupleNames: body.coupleNames, isPublished: body.isPublished },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Admin: update an existing story (also used for publish/unpublish toggles).
export async function PUT(req: NextRequest) {
  const gate = await requirePermission('successStories:edit');
  if (!gate.ok) return authFail(gate);
  try {
    const body = await req.json();
    if (!body?.id) return NextResponse.json({ error: 'Story id required.' }, { status: 400 });
    const err = validate(body);
    if (err) return NextResponse.json({ error: err }, { status: 400 });
    const story = await updateSuccessStory(body.id, body);

    const meta = getRequestMeta(req);
    await logAdminAction({
      actorUserId: gate.user.id,
      action: 'SUCCESS_STORY_UPDATED',
      targetType: 'SuccessStory',
      targetId: body.id,
      newValue: { coupleNames: body.coupleNames, isPublished: body.isPublished },
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true, story });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Admin: delete a story.
export async function DELETE(req: NextRequest) {
  const gate = await requirePermission('successStories:delete');
  if (!gate.ok) return authFail(gate);
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Story id required.' }, { status: 400 });
    await deleteSuccessStory(id);

    const meta = getRequestMeta(req);
    await logAdminAction({
      actorUserId: gate.user.id,
      action: 'SUCCESS_STORY_DELETED',
      targetType: 'SuccessStory',
      targetId: id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
