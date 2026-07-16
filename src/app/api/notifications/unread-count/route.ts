import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUnreadNotificationCount } from '@/lib/dashboard/notificationService';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ count: 0 });
  }

  try {
    const count = await getUnreadNotificationCount(userId);
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
