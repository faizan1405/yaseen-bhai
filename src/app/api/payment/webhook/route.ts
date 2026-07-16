import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { verifyPackagePurchase } from '@/lib/profileStore';
import { prisma } from '@/lib/db';
import { notifyMembership } from '@/lib/notifications';
import { safeCreateNotification } from '@/lib/dashboard/notificationService';

// Razorpay server-to-server webhook. This is the authoritative confirmation of
// payment: even if the browser closes before the client-side verify call runs,
// Razorpay still POSTs here and the membership is activated.
//
// Security: the raw request body is HMAC-SHA256'd with RAZORPAY_WEBHOOK_SECRET
// and compared (constant-time) against the `x-razorpay-signature` header. An
// unsigned or mismatched request is rejected before any DB work happens.
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Not configured — accept nothing rather than trusting unsigned callbacks.
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature') || '';

  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  try {
    const type = event?.event;
    if (type === 'payment.captured' || type === 'order.paid') {
      const paymentEntity = event?.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || event?.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id || 'webhook_payment';

      if (orderId) {
        // Detect whether this event actually transitions the purchase, so
        // repeated webhook deliveries do not re-send the membership email.
        const before = await prisma.packagePurchase.findFirst({ where: { razorpayOrderId: orderId } });
        const wasAlreadyPaid = before?.paymentStatus === 'PAID';

        // Idempotent: verifyPackagePurchase no-ops if already marked PAID.
        const purchase = await verifyPackagePurchase(orderId, paymentId);

        if (purchase && !wasAlreadyPaid) {
          try {
            const dbPurchase = await prisma.packagePurchase.findUnique({
              where: { id: purchase.id },
              include: { profile: { include: { user: true } } },
            });
            if (dbPurchase?.profile) {
              notifyMembership(
                dbPurchase.profile.user?.email || null,
                dbPurchase.profile.phoneNumber,
                dbPurchase.profile.fullName,
                dbPurchase.packageType,
              );

              if (dbPurchase.profile.userId) {
                await safeCreateNotification({
                  userId: dbPurchase.profile.userId,
                  type: 'MEMBERSHIP_ACTIVATED',
                  title: 'Membership activated',
                  message: `Your ${dbPurchase.packageType.replace(/_/g, ' ')} package is now active.`,
                  actionUrl: '/my-account',
                  relatedType: 'PackagePurchase',
                  relatedId: dbPurchase.id,
                  // Same key the client-verify path uses for this purchase, so
                  // whichever of the two confirmation routes fires first "wins"
                  // and the other is a safe no-op — no duplicate notification
                  // even though Razorpay may also retry this webhook itself.
                  dedupeKey: `payment_success_${dbPurchase.id}`,
                });
              }
            }
          } catch (e) {
            console.error('Webhook membership notification failed', e);
          }
        }
      }
    } else if (type === 'payment.failed') {
      const paymentEntity = event?.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        try {
          const purchase = await prisma.packagePurchase.findFirst({
            where: { razorpayOrderId: orderId },
            include: { profile: true },
          });
          if (purchase?.profile?.userId && purchase.paymentStatus !== 'PAID') {
            await safeCreateNotification({
              userId: purchase.profile.userId,
              type: 'PAYMENT_FAILED',
              title: 'Payment failed',
              message: `Your payment for the ${purchase.packageType.replace(/_/g, ' ')} package could not be completed. Please try again.`,
              actionUrl: '/premium',
              relatedType: 'PackagePurchase',
              relatedId: purchase.id,
              dedupeKey: `payment_failed_${purchase.id}_${paymentId || orderId}`,
            });
          }
        } catch (e) {
          console.error('Webhook payment-failed notification failed', e);
        }
      }
    }

    // Always 200 so Razorpay does not needlessly retry handled events.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // 500 lets Razorpay retry later.
    return NextResponse.json({ error: 'Processing error' }, { status: 500 });
  }
}
