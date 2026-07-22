export type PackageType = 'monthly_membership' | 'good_profile_package' | 'second_marriage_package' | 'high_profile_package';

/**
 * Single source of truth for the package keys used across the entire app —
 * access-control checks, privacy redaction and the payment flow all key off
 * these EXACT strings. They must stay in sync with the Prisma `PackageType`
 * enum and the keys of `PREMIUM_PACKAGES`.
 *
 * IMPORTANT: the customer-facing UI labels intentionally differ from the keys.
 * Always reference the key, never the label, in logic:
 *   monthly_membership      → "Monthly Membership"
 *   good_profile_package    → "Good Profile Package"
 *   second_marriage_package → "Second Marriage"   (NOT a separate "silver_plan" key)
 *   high_profile_package    → "Premium Match Access"     (NOT a separate "gold_package" key)
 */
export const PACKAGE_KEYS = {
  MONTHLY: 'monthly_membership',
  GOOD_PROFILE: 'good_profile_package',
  SILVER: 'second_marriage_package',
  GOLD: 'high_profile_package',
} as const;

export type PackageKey = typeof PACKAGE_KEYS[keyof typeof PACKAGE_KEYS];

export interface PackageDefinition {
  type: PackageType;
  name: string;
  basePrice: number;
  gstRate: number;
  totalAmount: number;
  billingType: 'MONTHLY' | 'ONE_TIME';
  successFeeAmount: number;
  benefits: string[];
}

export const PREMIUM_PACKAGES: Record<PackageType, PackageDefinition> = {
  monthly_membership: {
    type: 'monthly_membership',
    name: 'Monthly Membership',
    basePrice: 300,
    gstRate: 0.18,
    totalAmount: 354,
    billingType: 'MONTHLY',
    successFeeAmount: 0,
    benefits: [
      'View unblurred normal profiles',
      'Expose basic phone numbers',
      'Search and filter directory',
      'Direct candidate contacts'
    ]
  },
  good_profile_package: {
    type: 'good_profile_package',
    name: 'Good Profile Package',
    basePrice: 500,
    gstRate: 0.18,
    totalAmount: 590,
    billingType: 'MONTHLY',
    successFeeAmount: 0,
    benefits: [
      'Verified profile suggestions',
      'Basic matchmaking support',
      'Privacy-safe profile sharing',
      '1 year service validity'
    ]
  },
  second_marriage_package: {
    type: 'second_marriage_package',
    name: 'Second Marriage',
    basePrice: 600,
    gstRate: 0.18,
    totalAmount: 708,
    billingType: 'MONTHLY',
    successFeeAmount: 0,
    benefits: [
      'Everything in Basic Package',
      'More verified profile suggestions',
      'Priority matchmaking support',
      'Profile shortlisting assistance',
      'Family coordination support',
      'Regular follow-up support',
      'Privacy-safe contact assistance',
      '1 year service validity'
    ]
  },
  high_profile_package: {
    type: 'high_profile_package',
    name: 'Premium Match Access',
    basePrice: 800,
    gstRate: 0.18,
    totalAmount: 944,
    billingType: 'MONTHLY',
    successFeeAmount: 0,
    benefits: [
      'Everything in Second Marriage',
      'Premium verified profile suggestions',
      'High-priority matchmaking assistance',
      'Personalized profile shortlisting',
      'Dedicated support assistance',
      'Family meeting coordination support',
      'Biodata/profile presentation guidance',
      'Regular follow-up and progress updates',
      'Privacy-safe contact assistance',
      '1 year service validity'
    ]
  }
};

/**
 * Accepted `interestedPackage` lead-label strings for each package key, in the
 * exact form they are stored on lead records. Includes historical labels so admin
 * lead filtering keeps matching older records after a customer-facing rebrand —
 * WITHOUT migrating or mutating stored data. First entry is the current label;
 * the rest are legacy aliases kept for backward compatibility.
 */
export const PACKAGE_LEAD_LABELS: Record<PackageType, string[]> = {
  monthly_membership: ['₹300 Monthly Membership'],
  good_profile_package: ['₹500 Good Profiles Package', '₹500 Good Profiles'],
  second_marriage_package: ['₹600 Second Marriage', '₹600 Basic Access'],
  high_profile_package: ['₹800 Premium Match Access'],
};

/**
 * Resolve an admin lead filter value — which may be a stable internal package key
 * OR a raw label string — into the full set of stored labels that should match it.
 * Unknown values fall back to matching themselves so free-form filters still work.
 */
export function resolveLeadPackageLabels(filterValue: string): string[] {
  if (Object.prototype.hasOwnProperty.call(PACKAGE_LEAD_LABELS, filterValue)) {
    return PACKAGE_LEAD_LABELS[filterValue as PackageType];
  }
  return [filterValue];
}
