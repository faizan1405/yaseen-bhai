import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { parsePagination } from '@/lib/dashboard/pagination';
import { listNotifications, markAllNotificationsRead } from '@/lib/dashboard/notificationService';
import { markAllNotificationsSchema } from '@/lib/dashboard/validation';

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pagination = parsePagination(searchParams.get('page'), searchParams.get('pageSize'));
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  try {
    const result = await listNotifications(userId, pagination, unreadOnly);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = markAllNotificationsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const updated = await markAllNotificationsRead(userId);
    return NextResponse.json({ success: true, updated });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
