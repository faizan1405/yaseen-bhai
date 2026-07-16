import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import Razorpay from 'razorpay';
import { PREMIUM_PACKAGES, PackageType } from '@/lib/packages';
import { getProfileByUserId, createPackagePurchase } from '@/lib/profileStore';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const activeUserId = session?.user?.id ?? null;

    if (!activeUserId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const packageTypeInput = (body.packageType || 'monthly_membership') as PackageType;

    const pkgDef = PREMIUM_PACKAGES[packageTypeInput];
    if (!pkgDef) {
      return NextResponse.json({ error: 'Invalid package type' }, { status: 400 });
    }

    const profile = await getProfileByUserId(activeUserId);
    if (!profile) {
      return NextResponse.json({ error: 'Please create your matrimonial profile card first.' }, { status: 400 });
    }
    if (profile.profileCompletionStatus !== 'COMPLETE') {
      return NextResponse.json({ error: 'Please complete your matrimonial profile form before purchasing a package.' }, { status: 400 });
    }

    // The amount is ALWAYS derived from the trusted server-side catalogue
    // (PREMIUM_PACKAGES) — never from anything the browser sends.
    const catalogueBase = pkgDef.basePrice;
    const catalogueTotal = catalogueBase + catalogueBase * pkgDef.gstRate;

    // Explicit test mode lets you charge a nominal ₹1 to exercise the live
    // Razorpay flow without moving real money. It must be opted into via
    // RAZORPAY_TEST_MODE=true, and is a DEVELOPMENT-only affordance: it is
    // force-disabled in production so a stray RAZORPAY_TEST_MODE=true can never
    // accidentally charge real customers ₹1 instead of the true package price.
    const testModeRequested = process.env.RAZORPAY_TEST_MODE === 'true';
    const isProduction = process.env.NODE_ENV === 'production';
    if (testModeRequested && isProduction) {
      console.warn('[Razorpay] RAZORPAY_TEST_MODE=true was IGNORED in production — charging the real package price. Unset RAZORPAY_TEST_MODE to silence this warning.');
    }
    const testMode = testModeRequested && !isProduction;

    const chargedBase = testMode ? 1 : catalogueBase;
    const chargedGstRate = testMode ? 0 : pkgDef.gstRate;
    const chargedTotal = testMode ? 1 : catalogueTotal;
    const chargedSuccessFee = testMode ? 0 : pkgDef.successFeeAmount;
    const totalAmountPaise = Math.round(chargedTotal * 100);

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId.includes('dummy') || keySecret.includes('dummy')) {
      return NextResponse.json({ error: 'Payment gateway is not configured. Please contact support.' }, { status: 503 });
    }

    // Safety guard: never process live checkout with Razorpay TEST keys in
    // production — that would silently run sandbox / ₹1 test-mode charges.
    if (process.env.NODE_ENV === 'production' && keyId.startsWith('rzp_test_')) {
      return NextResponse.json({ error: 'Payment gateway is misconfigured (test mode in production). Please contact support.' }, { status: 503 });
    }

    const razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpayInstance.orders.create({
      amount: totalAmountPaise,
      currency: 'INR',
      receipt: `receipt_sub_${profile.id}_${Date.now()}`,
      notes: { packageType: packageTypeInput, testMode: String(testMode) },
    });

    // Create pending purchase record in DB. The stored amounts reflect what is
    // actually being charged (real price, or ₹1 in test mode) so records are truthful.
    await createPackagePurchase({
      profileId: profile.id,
      packageType: packageTypeInput,
      basePrice: chargedBase,
      gstRate: chargedGstRate,
      totalAmount: chargedTotal,
      billingType: pkgDef.billingType,
      successFeeAmount: chargedSuccessFee,
      razorpayOrderId: order.id,
      internalNotes: testMode ? `TEST_MODE ₹1 charge for ${pkgDef.name} (catalogue ₹${catalogueTotal})` : '',
    });

    return NextResponse.json({
      success: true,
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
