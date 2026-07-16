import { describe, it, expect } from 'vitest';
import { isRealObjectId } from './ids';

describe('isRealObjectId', () => {
  it('accepts a valid 24-char hex ObjectId', () => {
    expect(isRealObjectId('507f1f77bcf86cd799439011')).toBe(true);
  });

  it('accepts uppercase hex characters', () => {
    expect(isRealObjectId('507F1F77BCF86CD799439011')).toBe(true);
  });

  it('rejects sample/fallback ids that are not real ObjectIds', () => {
    expect(isRealObjectId('sample-profile-1')).toBe(false);
  });

  it('rejects strings of the wrong length', () => {
    expect(isRealObjectId('507f1f77bcf86cd79943901')).toBe(false); // 23 chars
    expect(isRealObjectId('507f1f77bcf86cd7994390111')).toBe(false); // 25 chars
  });

  it('rejects non-string input', () => {
    expect(isRealObjectId(undefined)).toBe(false);
    expect(isRealObjectId(null)).toBe(false);
    expect(isRealObjectId(12345)).toBe(false);
  });
});
