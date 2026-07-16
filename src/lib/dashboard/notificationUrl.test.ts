import { describe, it, expect } from 'vitest';
import { sanitizeActionUrl } from './notificationUrl';

describe('sanitizeActionUrl', () => {
  it('accepts a normal relative dashboard path', () => {
    expect(sanitizeActionUrl('/dashboard/interests/received')).toBe('/dashboard/interests/received');
  });

  it('accepts a relative path with a query string', () => {
    expect(sanitizeActionUrl('/search?profile=abc123')).toBe('/search?profile=abc123');
  });

  it('rejects absolute URLs to another host', () => {
    expect(sanitizeActionUrl('https://evil.com/phish')).toBeNull();
    expect(sanitizeActionUrl('http://evil.com')).toBeNull();
  });

  it('rejects protocol-relative URLs', () => {
    expect(sanitizeActionUrl('//evil.com/phish')).toBeNull();
  });

  it('rejects javascript: and other non-http schemes', () => {
    expect(sanitizeActionUrl('javascript:alert(1)')).toBeNull();
  });

  it('rejects backslash tricks', () => {
    expect(sanitizeActionUrl('/\\evil.com')).toBeNull();
  });

  it('rejects paths without a leading slash', () => {
    expect(sanitizeActionUrl('dashboard/notifications')).toBeNull();
  });

  it('rejects null, undefined and empty input', () => {
    expect(sanitizeActionUrl(null)).toBeNull();
    expect(sanitizeActionUrl(undefined)).toBeNull();
    expect(sanitizeActionUrl('')).toBeNull();
    expect(sanitizeActionUrl('   ')).toBeNull();
  });

  it('rejects overly long input', () => {
    expect(sanitizeActionUrl('/' + 'a'.repeat(400))).toBeNull();
  });
});
