import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { respondToInterest, withdrawInterest, InterestError } from '@/lib/dashboard/interestService';
import { respondInterestSchema } from '@/lib/dashboard/validation';

type RouteContext = { params: Promise<{ id: string }> };

// action=ACCEPT|REJECT is only valid for the receiver; action=WITHDRAW only
// for the sender. Which role the caller has is derived from the session, not
// the request body, so a receiver can never withdraw and a sender can never
// accept their own outgoing request.
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = respondInterestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    if (parsed.data.action === 'WITHDRAW') {
      const record = await withdrawInterest(userId, id);
      return NextResponse.json({ success: true, interest: record });
    }
    const record = await respondToInterest(userId, id, parsed.data.action);
    return NextResponse.json({ success: true, interest: record });
  } catch (error) {
    if (error instanceof InterestError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
