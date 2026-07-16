import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getInterestCounts } from '@/lib/dashboard/interestService';

// Lightweight counts for dashboard nav badges (pending sent / received).
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const counts = await getInterestCounts(userId);
    return NextResponse.json(counts);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
