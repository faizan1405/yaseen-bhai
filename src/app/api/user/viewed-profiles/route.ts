import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parsePagination } from '@/lib/dashboard/pagination';
import { listViewedProfiles, clearViewedProfiles } from '@/lib/dashboard/profileViewService';

export async function GET(req: NextRequest) {
  const session = await auth();
  const viewerId = session?.user?.id;
  if (!viewerId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams.get('page'), searchParams.get('pageSize'));

  try {
    const result = await listViewedProfiles(viewerId, pagination);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Clears the caller's ENTIRE viewed-profile history. Scoped to `viewerId` from
// the session, so this can never touch another user's rows.
export async function DELETE() {
  const session = await auth();
  const viewerId = session?.user?.id;
  if (!viewerId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const removed = await clearViewedProfiles(viewerId);
    return NextResponse.json({ success: true, removed });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
