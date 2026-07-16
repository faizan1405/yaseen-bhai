import { safeCreateNotification } from './notificationService';

const EXPIRING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

interface ExpiryCheckPurchase {
  id: string;
  packageType: string;
  paymentStatus: string;
  accessStatus: string;
  expiryDate?: Date | string | null;
}

/**
 * There is no cron/scheduler in this project, so "membership expiring" alerts
 * are raised lazily: whenever a logged-in user's own active packages are
 * fetched (e.g. on dashboard/account load), any package expiring within the
 * next 7 days gets a notification — deduped to once per calendar week per
 * purchase so normal page traffic doesn't spam the user.
 */
export async function checkAndNotifyExpiringMemberships(userId: string, purchases: ExpiryCheckPurchase[]): Promise<void> {
  const now = Date.now();
  const weekBucket = Math.floor(now / WEEK_MS);

  const expiringSoon = purchases.filter((p) => {
    if (p.paymentStatus !== 'PAID' || p.accessStatus !== 'ACTIVE' || !p.expiryDate) return false;
    const expiresAt = new Date(p.expiryDate).getTime();
    return expiresAt > now && expiresAt - now <= EXPIRING_WINDOW_MS;
  });

  for (const purchase of expiringSoon) {
    await safeCreateNotification({
      userId,
      type: 'MEMBERSHIP_EXPIRING',
      title: 'Membership expiring soon',
      message: `Your ${purchase.packageType.replace(/_/g, ' ')} package will expire soon. Renew to keep full access.`,
      actionUrl: '/premium',
      relatedType: 'PackagePurchase',
      relatedId: purchase.id,
      dedupeKey: `membership_expiring_${purchase.id}_${weekBucket}`,
    });
  }
}
