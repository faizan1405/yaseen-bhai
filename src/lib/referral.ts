import { prisma } from './db';

// Approved business band for the referral commission. Kept here as the single
// source of truth so both the API validation and any calculation agree.
export const REFERRAL_MIN_PERCENT = 20;
export const REFERRAL_MAX_PERCENT = 23;
export const REFERRAL_DEFAULT_PERCENT = 21;

function clampPercent(value: number): number {
  if (Number.isNaN(value)) return REFERRAL_DEFAULT_PERCENT;
  return Math.min(REFERRAL_MAX_PERCENT, Math.max(REFERRAL_MIN_PERCENT, value));
}

/**
 * Returns the persisted referral commission percentage. Falls back to the
 * default only when settings do not exist or the DB is unreachable — it never
 * trusts a client-supplied value. This is the value referral payouts must use.
 */
export async function getReferralCommissionPercent(): Promise<number> {
  try {
    const settings = await prisma.globalSettings.findFirst();
    if (settings && typeof settings.referralCommissionPercent === 'number') {
      return clampPercent(settings.referralCommissionPercent);
    }
  } catch {
    // DB unreachable — fall through to the safe default.
  }
  return REFERRAL_DEFAULT_PERCENT;
}

/** Commission amount (rounded to 2 dp) for a given base amount using the saved rate. */
export async function calculateReferralCommission(baseAmount: number): Promise<number> {
  const pct = await getReferralCommissionPercent();
  return Math.round(baseAmount * (pct / 100) * 100) / 100;
}
