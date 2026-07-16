import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { listShortlistedProfileIds } from '@/lib/dashboard/shortlistService';

// Lightweight hydration endpoint: just the MatrimonialProfile ids the current
// user has shortlisted, so profile cards can render the correct heart state
// after a reload without fetching full shortlist details.
export async function GET() {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const profileIds = await listShortlistedProfileIds(ownerId);
    return NextResponse.json({ profileIds });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
