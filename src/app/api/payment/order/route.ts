import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Razorpay from 'razorpay';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const simulatedUserId = req.headers.get('x-simulator-user-id');
    const activeUserId = session?.user?.id || simulatedUserId;

    if (!activeUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const baseAmount = 300; // ₹300
    const gstAmount = baseAmount * 0.18; // 18% GST = ₹54
    const totalAmount = baseAmount + gstAmount; // ₹354
    const totalAmountPaise = Math.round(totalAmount * 100); // 35400 paise for Razorpay

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes('dummy') || keySecret.includes('dummy')) {
      // Return a simulated order for local/sandbox testing
      return NextResponse.json({
        success: true,
        isSimulated: true,
        orderId: `order_sim_${Date.now()}`,
        amount: totalAmountPaise,
        currency: 'INR',
        keyId: 'rzp_test_dummyKeyId123',
      });
    }

    const razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpayInstance.orders.create({
      amount: totalAmountPaise,
      currency: 'INR',
      receipt: `receipt_sub_${activeUserId}_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      isSimulated: false,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
