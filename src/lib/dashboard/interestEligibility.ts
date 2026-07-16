import { redactProfile } from '@/lib/profilePrivacy';
import { canViewFullProfile, getViewerPackageAccess } from '@/lib/accessControl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawProfile = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawPurchase = any;

export interface EligibilityContext {
  senderProfile: RawProfile;
  senderPurchases: RawPurchase[];
  receiverProfile: RawProfile;
  receiverAccountStatus: string | null;
}

export interface EligibilityResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Pure business rule (no DB access) deciding whether `senderProfile` may send
 * an interest request to `receiverProfile`. Reuses the SAME package-access and
 * privacy-redaction logic as full-profile viewing (`accessControl.ts` /
 * `profilePrivacy.ts`) instead of re-implementing category rules, so a sender
 * can never message a profile they are not otherwise entitled to see in full.
 */
export function checkInterestEligibility(ctx: EligibilityContext): EligibilityResult {
  if (ctx.receiverAccountStatus === 'SUSPENDED') {
    return { allowed: false, reason: 'This profile is not available.' };
  }
  if (ctx.receiverProfile.verificationStatus !== 'APPROVED') {
    return { allowed: false, reason: 'This profile is not available.' };
  }

  const access = canViewFullProfile(ctx.senderProfile, ctx.senderPurchases);
  if (!access.allowed) {
    return {
      allowed: false,
      reason: 'Complete your profile and choose a package before sending interest requests.',
    };
  }

  const pkgAccess = getViewerPackageAccess(ctx.senderProfile, ctx.senderPurchases);
  const redacted: RawProfile = redactProfile(
    ctx.receiverProfile,
    pkgAccess.hasStandard,
    pkgAccess.hasSecondMarriage,
    pkgAccess.hasHighProfile,
    pkgAccess.hasGoodProfile,
    false,
    false,
  );
  if (redacted.isLockedCategory) {
    return { allowed: false, reason: 'Upgrade your package to send an interest request to this profile.' };
  }

  return { allowed: true };
}
