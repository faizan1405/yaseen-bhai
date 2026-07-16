import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parsePagination } from '@/lib/dashboard/pagination';
import { listSentInterests } from '@/lib/dashboard/interestService';

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams.get('page'), searchParams.get('pageSize'));

  try {
    const result = await listSentInterests(userId, pagination);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
