export type PackageType = 'monthly_membership' | 'good_profile_package' | 'second_marriage_package' | 'high_profile_package';

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
    basePrice: 5500,
    gstRate: 0.18,
    totalAmount: 6490,
    billingType: 'ONE_TIME',
    successFeeAmount: 21000,
    benefits: [
      'For handsome & beautiful profile matches',
      'Access to attractive/good-looking profiles',
      'Leads provided until marriage',
      'Success Fee: ₹21,000 after marriage confirmation'
    ]
  },
  second_marriage_package: {
    type: 'second_marriage_package',
    name: 'Second Marriage Package',
    basePrice: 11000,
    gstRate: 0.18,
    totalAmount: 12980,
    billingType: 'ONE_TIME',
    successFeeAmount: 0,
    benefits: [
      'For second marriage matches',
      'Dedicated matchmaking access',
      'Leads provided until marriage',
      'No extra after-marriage fee'
    ]
  },
  high_profile_package: {
    type: 'high_profile_package',
    name: 'High Profile Package',
    basePrice: 21000,
    gstRate: 0.18,
    totalAmount: 24780,
    billingType: 'ONE_TIME',
    successFeeAmount: 25000,
    benefits: [
      'For candidates earning ₹10 lakh+ annually',
      'Doctors, engineers, professionals & premium families',
      'Leads provided until marriage',
      'Success Fee: ₹25,000 after marriage confirmation'
    ]
  }
};
