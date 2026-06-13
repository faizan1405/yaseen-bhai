import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { markUserAsPaid } from '@/lib/profileStore';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const simulatedUserId = req.headers.get('x-simulator-user-id');
    const activeUserId = session?.user?.id || simulatedUserId;

    if (!activeUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { orderId, paymentId, signature, isSimulated } = await req.json();

    if (!orderId || !paymentId) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    if (isSimulated || orderId.startsWith('order_sim_')) {
      // Mark as paid in simulator mode
      const profile = await markUserAsPaid(activeUserId);
      return NextResponse.json({
        success: true,
        message: 'Mock payment verified successfully!',
        profile,
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: 'Razorpay secret key not configured' }, { status: 500 });
    }

    // Verify signature cryptographically
    const bodyText = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(bodyText)
      .digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ error: 'Invalid payment signature. Verification failed.' }, { status: 400 });
    }

    // Mark profile as paid in database
    const profile = await markUserAsPaid(activeUserId);

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated!',
      profile,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
