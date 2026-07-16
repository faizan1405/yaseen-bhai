import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendInterest, InterestError } from '@/lib/dashboard/interestService';
import { sendInterestSchema } from '@/lib/dashboard/validation';

export async function POST(req: NextRequest) {
  const session = await auth();
  const senderId = session?.user?.id;
  if (!senderId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = sendInterestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const record = await sendInterest(senderId, parsed.data.profileId, parsed.data.message);
    return NextResponse.json({ success: true, interest: record });
  } catch (error) {
    if (error instanceof InterestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
