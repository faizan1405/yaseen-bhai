import { describe, it, expect } from 'vitest';
import { checkInterestEligibility } from './interestEligibility';

function baseProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'profile-1',
    userId: 'user-1',
    fullName: 'Test Person',
    gender: 'Female',
    maritalStatus: 'Single',
    occupation: 'Teacher',
    annualIncomeRange: '₹3 LPA - ₹5 LPA',
    verificationStatus: 'APPROVED',
    profileCompletionStatus: 'COMPLETE',
    category: 'normal',
    hasPaid: false,
    maslak: null,
    fiqh: null,
    biradari: null,
    district: null,
    locality: null,
    preferredLocations: [],
    ...overrides,
  };
}

const activeStandardPurchase = [
  { packageType: 'monthly_membership', paymentStatus: 'PAID', accessStatus: 'ACTIVE', expiryDate: null },
];

describe('checkInterestEligibility', () => {
  it('allows a sender with a completed profile and active package to message a normal, approved profile', () => {
    const result = checkInterestEligibility({
      senderProfile: baseProfile({ id: 'sender' }),
      senderPurchases: activeStandardPurchase,
      receiverProfile: baseProfile({ id: 'receiver' }),
      receiverAccountStatus: 'ACTIVE',
    });
    expect(result.allowed).toBe(true);
  });

  it('rejects when the receiver account is suspended (blocked)', () => {
    const result = checkInterestEligibility({
      senderProfile: baseProfile({ id: 'sender' }),
      senderPurchases: activeStandardPurchase,
      receiverProfile: baseProfile({ id: 'receiver' }),
      receiverAccountStatus: 'SUSPENDED',
    });
    expect(result.allowed).toBe(false);
  });

  it('rejects when the receiver profile is not approved (pending/rejected)', () => {
    const result = checkInterestEligibility({
      senderProfile: baseProfile({ id: 'sender' }),
      senderPurchases: activeStandardPurchase,
      receiverProfile: baseProfile({ id: 'receiver', verificationStatus: 'PENDING' }),
      receiverAccountStatus: 'ACTIVE',
    });
    expect(result.allowed).toBe(false);
  });

  it('rejects a sender with an incomplete profile', () => {
    const result = checkInterestEligibility({
      senderProfile: baseProfile({ id: 'sender', profileCompletionStatus: 'INCOMPLETE' }),
      senderPurchases: activeStandardPurchase,
      receiverProfile: baseProfile({ id: 'receiver' }),
      receiverAccountStatus: 'ACTIVE',
    });
    expect(result.allowed).toBe(false);
  });

  it('rejects a sender with no active package', () => {
    const result = checkInterestEligibility({
      senderProfile: baseProfile({ id: 'sender' }),
      senderPurchases: [],
      receiverProfile: baseProfile({ id: 'receiver' }),
      receiverAccountStatus: 'ACTIVE',
    });
    expect(result.allowed).toBe(false);
  });

  it('rejects when the receiver is in a locked category the sender has not unlocked', () => {
    const result = checkInterestEligibility({
      senderProfile: baseProfile({ id: 'sender' }),
      senderPurchases: activeStandardPurchase,
      receiverProfile: baseProfile({ id: 'receiver', category: 'good_profile' }),
      receiverAccountStatus: 'ACTIVE',
    });
    expect(result.allowed).toBe(false);
  });

  it('allows access to a locked-category profile once the sender holds the matching package', () => {
    const result = checkInterestEligibility({
      senderProfile: baseProfile({ id: 'sender', hasPaid: true }),
      senderPurchases: [
        ...activeStandardPurchase,
        { packageType: 'good_profile_package', paymentStatus: 'PAID', accessStatus: 'ACTIVE', expiryDate: null },
      ],
      receiverProfile: baseProfile({ id: 'receiver', category: 'good_profile' }),
      receiverAccountStatus: 'ACTIVE',
    });
    expect(result.allowed).toBe(true);
  });
});
