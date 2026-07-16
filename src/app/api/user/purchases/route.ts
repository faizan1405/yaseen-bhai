import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getProfileByUserId, getUserPurchases } from '@/lib/profileStore';
import { checkAndNotifyExpiringMemberships } from '@/lib/dashboard/membershipExpiry';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const activeUserId = session?.user?.id ?? null;

    if (!activeUserId) {
      return NextResponse.json({ packages: [], hasPaid: false });
    }

    const profile = await getProfileByUserId(activeUserId);
    if (!profile) {
      return NextResponse.json({ packages: [], hasPaid: false });
    }

    const purchases = await getUserPurchases(profile.id);
    const now = new Date();
    const activePackageTypes = purchases
      .filter(p =>
        p.paymentStatus === 'PAID' &&
        p.accessStatus === 'ACTIVE' &&
        (!p.expiryDate || new Date(p.expiryDate) > now)
      )
      .map(p => p.packageType);

    // Best-effort, fire-and-forget: never let an expiry-notification hiccup
    // slow down or fail this read-only endpoint.
    checkAndNotifyExpiringMemberships(activeUserId, purchases).catch(() => {});

    return NextResponse.json({
      packages: [...new Set(activePackageTypes)],
      hasPaid: profile.hasPaid,
    });
  } catch {
    return NextResponse.json({ packages: [], hasPaid: false });
  }
}
