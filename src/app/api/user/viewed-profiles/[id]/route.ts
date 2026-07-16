import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { removeViewedProfile } from '@/lib/dashboard/profileViewService';

type RouteContext = { params: Promise<{ id: string }> };

// `id` is the ProfileView record id (as returned by the list endpoint), so
// removal keeps working even after the target profile itself is gone.
export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  const viewerId = session?.user?.id;
  if (!viewerId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const removed = await removeViewedProfile(viewerId, id);
    if (!removed) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
