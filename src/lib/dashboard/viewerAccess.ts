import { getProfileByUserId, getUserPurchases } from '@/lib/profileStore';
import { getViewerPackageAccess, canViewFullProfile } from '@/lib/accessControl';

export type ViewerMatrimonialProfile = Awaited<ReturnType<typeof getProfileByUserId>>;

export interface ViewerAccess {
  viewerProfile: ViewerMatrimonialProfile;
  pkgAccess: ReturnType<typeof getViewerPackageAccess>;
  canViewFull: boolean;
}

/**
 * Resolve everything the privacy/compatibility layer needs to know about a
 * viewer, in one place, so every dashboard list (viewed profiles, shortlist,
 * interests) redacts and scores results identically to the main profile APIs.
 */
export async function resolveViewerAccess(userId: string): Promise<ViewerAccess> {
  const viewerProfile = await getProfileByUserId(userId);
  const purchases = viewerProfile ? await getUserPurchases(viewerProfile.id) : [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pkgAccess = getViewerPackageAccess(viewerProfile as any, purchases as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canViewFull = canViewFullProfile(viewerProfile as any, purchases as any).allowed;
  return { viewerProfile, pkgAccess, canViewFull };
}
