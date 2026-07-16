import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProfileById } from '@/lib/profileStore';
import { recordProfileView } from '@/lib/dashboard/profileViewService';

type RouteContext = { params: Promise<{ id: string }> };

// Records that the authenticated user opened this profile. Self-views and
// unauthenticated requests are silently no-ops (200) so the client doesn't
// need special-case handling — the history feature simply won't show an entry.
export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  const viewerId = session?.user?.id;
  if (!viewerId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const targetProfile = await getProfileById(id);
    if (!targetProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const result = await recordProfileView(viewerId, targetProfile.userId);
    return NextResponse.json({ success: true, recorded: result.recorded });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
