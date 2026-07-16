import { redactProfile } from '@/lib/profilePrivacy';
import { computeCompatibility } from '@/lib/compatibility';
import type { ViewerAccess } from './viewerAccess';

/**
 * Privacy-safe profile summary shared by the viewed-profiles, shortlist and
 * interest-request dashboard lists. Every field here has already passed
 * through `redactProfile` — callers must never merge in raw profile fields.
 */
export interface DashboardProfileCard {
  profileId: string | null; // MatrimonialProfile id — null when unavailable
  userId: string;
  available: boolean;
  unavailableReason: 'deleted' | 'blocked' | 'unavailable' | null;
  fullName: string | null;
  age: number | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  maritalStatus: string | null;
  profileImageUrl: string | null;
  verificationStatus: string | null;
  compatibilityScore: number | null;
  isLockedCategory: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RawProfile = any;

function unavailableCard(userId: string, reason: DashboardProfileCard['unavailableReason'], verificationStatus: string | null = null): DashboardProfileCard {
  return {
    profileId: null,
    userId,
    available: false,
    unavailableReason: reason,
    fullName: null,
    age: null,
    gender: null,
    city: null,
    state: null,
    maritalStatus: null,
    profileImageUrl: null,
    verificationStatus,
    compatibilityScore: null,
    isLockedCategory: null,
  };
}

/**
 * Build the safe card shown on a dashboard list for one target profile,
 * applying the SAME privacy redaction and compatibility scoring used by the
 * main profile browsing APIs — never a simplified/parallel implementation.
 */
export function buildDashboardProfileCard(
  targetProfile: RawProfile | null,
  targetUserAccountStatus: string | null,
  viewerAccess: ViewerAccess,
): DashboardProfileCard {
  const userId = targetProfile?.userId ?? '';

  if (!targetProfile) {
    return unavailableCard(userId, 'deleted');
  }
  if (targetUserAccountStatus === 'SUSPENDED') {
    return unavailableCard(userId, 'blocked', targetProfile.verificationStatus ?? null);
  }
  if (targetProfile.verificationStatus !== 'APPROVED') {
    return unavailableCard(userId, 'unavailable', targetProfile.verificationStatus ?? null);
  }

  const isOwner = viewerAccess.viewerProfile?.userId === targetProfile.userId;
  const redacted: RawProfile = redactProfile(
    targetProfile,
    viewerAccess.pkgAccess.hasStandard,
    viewerAccess.pkgAccess.hasSecondMarriage,
    viewerAccess.pkgAccess.hasHighProfile,
    viewerAccess.pkgAccess.hasGoodProfile,
    isOwner,
    false,
  );

  const dobYear = redacted.dateOfBirth ? new Date(redacted.dateOfBirth).getFullYear() : 0;
  const age =
    dobYear > 1905
      ? Math.floor((Date.now() - new Date(redacted.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

  const compat = viewerAccess.viewerProfile
    ? computeCompatibility(viewerAccess.viewerProfile as RawProfile, targetProfile as RawProfile)
    : null;

  return {
    profileId: redacted.id,
    userId: targetProfile.userId,
    available: true,
    unavailableReason: null,
    fullName: redacted.fullName ?? null,
    age,
    gender: redacted.gender ?? null,
    city: redacted.city ?? null,
    state: redacted.state ?? null,
    maritalStatus: redacted.maritalStatus ?? null,
    profileImageUrl: redacted.profileImageUrl ?? null,
    verificationStatus: redacted.verificationStatus ?? null,
    compatibilityScore: compat ? compat.score : null,
    isLockedCategory: redacted.isLockedCategory ?? null,
  };
}
